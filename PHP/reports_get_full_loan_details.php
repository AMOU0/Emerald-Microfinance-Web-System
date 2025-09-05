<?php
header('Content-Type: application/json');

// Database connection details
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit();
}

// Check if loan_id is provided
if (isset($_GET['loan_id']) && is_numeric($_GET['loan_id'])) {
    $loanId = $_GET['loan_id'];

    // SQL query to get loan, client, guarantor, and all payments
    $sql = "
        SELECT
            la.loan_application_id,
            la.loan_amount,
            la.payment_frequency,
            la.date_start,
            la.date_end,
            c.first_name AS client_first_name,
            c.middle_name AS client_middle_name,
            c.last_name AS client_last_name,
            c.client_ID,
            ip.Interest_Pecent,
            g.guarantor_first_name,
            g.guarantor_middle_name,
            g.guarantor_last_name,
            g.guarantor_street_address,
            g.guarantor_phone_number
        FROM
            loan_applications la
        INNER JOIN
            clients c ON la.client_ID = c.client_ID
        LEFT JOIN
            guarantor g ON c.client_ID = g.client_ID
        LEFT JOIN
            interest_pecent ip ON ip.status = 'activated'
        WHERE
            la.loan_application_id = ?
        LIMIT 1;
    ";

    // 1. Fetch Loan Details
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $loanId);
    $stmt->execute();
    $loanResult = $stmt->get_result();

    if ($loanResult->num_rows === 0) {
        $stmt->close();
        $conn->close();
        echo json_encode(['status' => 'error', 'message' => 'Loan not found.']);
        exit();
    }
    
    $row = $loanResult->fetch_assoc();
    $stmt->close();

    // 2. Fetch Payment History
    $paymentsSql = "
        SELECT
            amount_paid,
            date_payed
        FROM
            payment
        WHERE
            loan_application_id = ?
        ORDER BY
            date_payed ASC;
    ";

    $paymentsStmt = $conn->prepare($paymentsSql);
    $paymentsStmt->bind_param("i", $loanId);
    $paymentsStmt->execute();
    $paymentsResult = $paymentsStmt->get_result();

    $payments = [];
    while ($paymentRow = $paymentsResult->fetch_assoc()) {
        // Format date to 'YYYY-MM-DD' for consistency with loan schedule dates
        $date = new DateTime($paymentRow['date_payed']);
        $payments[] = [
            'amount_paid' => (float)$paymentRow['amount_paid'],
            'date_paid' => $date->format('Y-m-d')
        ];
    }
    $paymentsStmt->close();

    // Construct the final data object
    $fullLoanData = [
        'loanID' => $row['loan_application_id'],
        'loan-amount' => (float)$row['loan_amount'],
        'payment-frequency' => $row['payment_frequency'],
        'date-start' => $row['date_start'],
        'date-end' => $row['date_end'],
        'clientName' => trim($row['client_first_name'] . ' ' . $row['client_middle_name'] . ' ' . $row['client_last_name']),
        'clientID' => $row['client_ID'],
        'interest-rate' => (int)$row['Interest_Pecent'],
        'guarantorFirstName' => $row['guarantor_first_name'],
        'guarantorMiddleName' => $row['guarantor_middle_name'],
        'guarantorLastName' => $row['guarantor_last_name'],
        'guarantorStreetAddress' => $row['guarantor_street_address'],
        'guarantorPhoneNumber' => $row['guarantor_phone_number'],
        'payments' => $payments // Add the payments here
    ];
    
    echo json_encode($fullLoanData);

} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid or missing loan_id.']);
}

$conn->close();
?>