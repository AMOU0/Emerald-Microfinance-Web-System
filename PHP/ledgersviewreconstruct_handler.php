<?php
// ledgersviewreconstruct_handler.php

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
    $currentBalance = 0.00;


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
             // If payments exist but recon record doesn't, something is wrong with data.
             http_response_code(500);
             echo json_encode(['error' => 'Reconstruction record not found for the associated payments.']);
             exit();
        }

        $reconstructPrincipal = (float)$reconDetails['reconstruct_amount'];
        $reconstructInterestRate = (float)$reconDetails['interest_rate'];
        
        // 3. Calculate Total Loan Obligation for Reconstruction: 1000 * (1 + 0.20) = 1200
        $totalReconObligation = $reconstructPrincipal * (1 + $reconstructInterestRate / 100); 
        $currentBalance = $totalReconObligation; // Start with the new total amount to be paid
        
        // 4. Calculate Running Balance After Each Payment
        foreach ($payments as $payment) {
            $paymentAmount = (float)$payment['amount_paid'];
            
            // Apply payment
            $newBalance = $currentBalance - $paymentAmount;

            $formattedPayments[] = [
                'PaymentDate' => $payment['PaymentDate'],
                'Amount' => number_format($paymentAmount, 2),
                'Method' => $payment['Method'],
                'RemainingBalance' => number_format(max(0, $newBalance), 2),
                'Type' => 'Recon: ' . $loanReconstructId
            ];
            
            // Update the current balance for the next iteration
            $currentBalance = $newBalance;
        }
    }
    
    // Structure the final JSON response object
    $response = [
        'Loan ID' => $loanId,
        'LoanReconstructId' => $loanReconstructId, // Pass the recon ID for the table header
        'Payments' => $formattedPayments,
        'Schedule' => [
            'Reconstruct_Amount' => number_format($reconstructPrincipal, 2), 
            'Reconstruct_Interest_Rate' => $reconstructInterestRate,
            'Total_Recon_Obligation' => number_format($totalReconObligation, 2),
            'Total_Payments_Recorded' => count($formattedPayments),
            'Final_Calculated_Balance' => number_format(max(0, $currentBalance), 2)
        ]
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Reconstruction Detail Query Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error fetching reconstruction details.']);
}
?>