<?php
// ledgersviewfetchloan_handler.php

// Include the centralized database connection handler 
require_once 'aadb_connect_handler.php';

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
    // 1. Fetch Loan Details, Client Name, and Guarantor Info
    $sqlLoan = "
        SELECT 
            la.loan_application_id,
            la.loan_amount,
            la.date_start AS IssueDate,
            la.status,
            la.interest_rate,
            la.duration_of_loan,
            la.payment_frequency,
            la.date_end,
            
            -- Client Information
            c.first_name AS ClientFirstName,
            c.middle_name AS ClientMiddleName,
            c.last_name AS ClientLastName,
            
            -- Guarantor Information
            g.guarantor_first_name AS GuarantorFirstName,
            g.guarantor_middle_name AS GuarantorMiddleName,
            g.guarantor_last_name AS GuarantorLastName,
            g.guarantor_street_address AS GuarantorAddress,
            g.guarantor_phone_number AS GuarantorPhone
        FROM 
            loan_applications la
        INNER JOIN 
            clients c ON la.client_ID = c.client_ID
        LEFT JOIN
            guarantor g ON la.loan_application_id = g.loan_application_id
        WHERE 
            la.loan_application_id = :loanId
        LIMIT 1 
    ";
    $stmtLoan = $conn->prepare($sqlLoan);
    $stmtLoan->bindParam(':loanId', $loanId);
    $stmtLoan->execute();
    $loanDetails = $stmtLoan->fetch(PDO::FETCH_ASSOC);

    if (!$loanDetails) {
        http_response_code(404);
        echo json_encode(['error' => 'Loan not found.']);
        exit();
    }
    
    // Initial Loan Variables for calculation
    $initialPrincipal = (float)$loanDetails['loan_amount'];
    $annualInterestRate = (float)$loanDetails['interest_rate'];
    $monthlyInterestRate = ($annualInterestRate / 100) / 12;

    // 2. Fetch Payment History (Ordered chronologically - ASC)
    $sqlPayments = "
        SELECT 
            amount_paid,
            DATE(date_payed) AS PaymentDate,
            processby AS Method,
            loan_reconstruct_id -- FIXED: Added to fetch the reconstruct ID (will be NULL)
        FROM 
            payment
        WHERE 
            loan_application_id = :loanId
            AND loan_reconstruct_id IS NULL  -- Only show payments NOT tied to a loan reconstruction
        ORDER BY 
            date_payed ASC  -- Oldest payment on top
    ";
    $stmtPayments = $conn->prepare($sqlPayments);
    $stmtPayments->bindParam(':loanId', $loanId);
    $stmtPayments->execute();
    $payments = $stmtPayments->fetchAll(PDO::FETCH_ASSOC);

    $formattedPayments = [];
    $currentBalance = $initialPrincipal;
    
    // 3. Calculate Running Balance After Each Payment
    foreach ($payments as $payment) {
        $paymentAmount = (float)$payment['amount_paid'];
        
        // Calculate balance just before this payment (Previous Balance + Interest accrued)
        $balanceWithInterest = $currentBalance * (1 + $monthlyInterestRate);
        
        // Apply payment
        $newBalance = $balanceWithInterest - $paymentAmount;
        
        // Format payment details for response
        $formattedPayments[] = [
            'PaymentDate' => $payment['PaymentDate'],
            'Amount' => number_format($paymentAmount, 2),
            'Method' => $payment['Method'],
            'RemainingBalance' => number_format(max(0, $newBalance), 2),
            // FIXED: Use the main loan ID for the 'Type' field
            'Type' => 'Loan: ' . $loanId 
        ];
        
        // Update the current balance for the next iteration
        $currentBalance = $newBalance;
    }
     
    // Combine names for easier display in JavaScript
    $clientName = trim("{$loanDetails['ClientFirstName']} {$loanDetails['ClientMiddleName']} {$loanDetails['ClientLastName']}");
    $guarantorName = trim("{$loanDetails['GuarantorFirstName']} {$loanDetails['GuarantorMiddleName']} {$loanDetails['GuarantorLastName']}");
    
    // Structure the final JSON response object
    $response = [
        'LoanId' => $loanDetails['loan_application_id'],
        'Principal' => number_format($initialPrincipal, 2),
        'IssueDate' => $loanDetails['IssueDate'],
        'Status' => ucfirst($loanDetails['status']),
        'InterestRate' => $loanDetails['interest_rate'] . '%',
        'Duration' => $loanDetails['duration_of_loan'],
        'Frequency' => $loanDetails['payment_frequency'],
        'EndDate' => $loanDetails['date_end'],
        
        // NEW FIELDS FOR JAVASCRIPT
        'ClientName' => $clientName,
        'GuarantorName' => $guarantorName ?: 'N/A', 
        'GuarantorAddress' => $loanDetails['GuarantorAddress'] ?: 'N/A',
        'GuarantorPhone' => $loanDetails['GuarantorPhone'] ?: 'N/A',
        
        'Payments' => $formattedPayments,
        
        'Schedule' => [
            'Loan_Amount' => $initialPrincipal,
            'Interest_Rate' => $annualInterestRate,
            'Monthly_Rate' => number_format($monthlyInterestRate * 100, 4) . '%',
            'Total_Payments_Recorded' => count($formattedPayments),
            'Final_Calculated_Balance' => number_format(max(0, $currentBalance), 2)
        ]
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Loan Detail Query Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error fetching loan details.']);
}
?>