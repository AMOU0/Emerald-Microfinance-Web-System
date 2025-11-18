<?php
// reportsexistingviewreconstruct_handler.php

// Include the centralized database connection handler 
require_once 'aadb_connect_handler.php';

// Set header for JSON response and prevent any output before it
header('Content-Type: application/json');

if (!isset($_GET['loanId']) || empty($_GET['loanId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Loan ID is missing.']);
    exit();
}

$loanId = $_GET['loanId'];

// Use the centralized connection function
$conn = connectDB();

try {
    // 1. Fetch ALL Reconstruction Payments to identify the Reconstruct ID
    $sqlPayments = "
        SELECT 
            p.amount_paid,
            DATE(p.date_payed) AS PaymentDate,
            p.processby AS Method,
            p.loan_reconstruct_id
        FROM 
            payment p
        WHERE 
            p.loan_application_id = :loanId
            AND p.loan_reconstruct_id IS NOT NULL  -- Only show reconstruction payments
        ORDER BY 
            p.date_payed ASC
    ";
    $stmtPayments = $conn->prepare($sqlPayments);
    $stmtPayments->bindParam(':loanId', $loanId);
    $stmtPayments->execute();
    $payments = $stmtPayments->fetchAll(PDO::FETCH_ASSOC);

    $formattedPayments = [];
    $loanReconstructId = null;
    $reconstructPrincipal = 0.00;
    $reconstructInterestRate = 0.00;
    $totalReconObligation = 0.00;
    
    // NEW TRACKING VARIABLES
    $currentObligationBalance = 0.00; // FIX: This will track the remaining P+I obligation
    $totalInterestCollected = 0.00;
    $totalPrincipalCollected = 0.00;


    if (!empty($payments)) {
        // Get the reconstruct ID from the first payment
        $loanReconstructId = $payments[0]['loan_reconstruct_id'];

        // 2. Fetch Reconstruction Details using the found ID
        $sqlRecon = "
            SELECT 
                reconstruct_amount,
                interest_rate
            FROM 
                loan_reconstruct
            WHERE 
                loan_reconstruct_id = :reconstructId
            LIMIT 1
        ";
        $stmtRecon = $conn->prepare($sqlRecon);
        $stmtRecon->bindParam(':reconstructId', $loanReconstructId);
        $stmtRecon->execute();
        $reconDetails = $stmtRecon->fetch(PDO::FETCH_ASSOC);
        
        if (!$reconDetails) {
             http_response_code(500);
             echo json_encode(['error' => 'Reconstruction record not found for the associated payments.']);
             exit();
        }

        $reconstructPrincipal = (float)$reconDetails['reconstruct_amount'];
        $reconstructInterestRate = (float)$reconDetails['interest_rate'];
        
        // 3. Calculate Total Loan Obligation for Reconstruction: Principal + Total Simple Interest
        $totalReconObligation = $reconstructPrincipal * (1 + $reconstructInterestRate / 100); 
        
        // FIX: Start tracking the total obligation balance
        $currentObligationBalance = $totalReconObligation; 
        
        // 4. Calculate Running Balance After Each Payment (Against Obligation)
        foreach ($payments as $payment) {
            $paymentAmount = (float)$payment['amount_paid'];
            
            // --- Logic to calculate Principal/Interest split for detail view ---
            $totalInterest = $totalReconObligation - $reconstructPrincipal;
            $totalInterestToCollect = $totalInterest - $totalInterestCollected;
            
            // Split payment: Collect remaining interest first, then apply the rest to principal.
            $interestPayment = min($paymentAmount, $totalInterestToCollect);
            $principalPayment = $paymentAmount - $interestPayment;

            $totalInterestCollected += $interestPayment; // Add to collected interest
            $totalPrincipalCollected += $principalPayment; // Add to collected principal
            
            // FIX: Reduce the remaining Obligation Balance by the total payment amount
            $currentObligationBalance -= $paymentAmount; 

            $formattedPayments[] = [
                'PaymentDate' => $payment['PaymentDate'],
                'Amount' => number_format($paymentAmount, 2),
                'Method' => $payment['Method'],
                // RemainingBalance now tracks the remaining Total Obligation
                'RemainingBalance' => number_format(max(0, $currentObligationBalance), 2),
                'PrincipalApplied' => number_format($principalPayment, 2),
                'InterestApplied' => number_format($interestPayment, 2),
                'Type' => 'Recon: ' . $loanReconstructId
            ];
        }
    }
    
    // Structure the final JSON response object
    $response = [
        'Loan ID' => $loanId,
        'LoanReconstructId' => $loanReconstructId,
        'Payments' => $formattedPayments,
        'Schedule' => [
            'Reconstruct_Amount' => number_format($reconstructPrincipal, 2), 
            'Reconstruct_Interest_Rate' => $reconstructInterestRate,
            'Total_Recon_Obligation' => number_format($totalReconObligation, 2),
            'Total_Payments_Recorded' => count($formattedPayments),
            'Total_Principal_Paid' => number_format($totalPrincipalCollected, 2),
            'Total_Interest_Paid' => number_format($totalInterestCollected, 2),
            // Final balance is the remaining total obligation
            'Final_Calculated_Balance' => number_format(max(0, $currentObligationBalance), 2)
        ]
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Reconstruction Detail Query Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error fetching reconstruction details.']);
}
?>