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

    // SQL query to get loan, client, and interest rate information
    $sql = "
        SELECT
            la.loan_application_id,
            la.loan_amount,
            la.payment_frequency,
            la.date_start,
            la.date_end,
            c.first_name,
            c.middle_name,
            c.last_name,
            c.client_ID,
            ip.Interest_Pecent
        FROM
            loan_applications la
        INNER JOIN
            clients c ON la.client_ID = c.client_ID
        LEFT JOIN
            interest_pecent ip ON ip.status = 'activated'
        WHERE
            la.loan_application_id = ?
        LIMIT 1;
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $loanId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();

        // Construct the data object to match the frontend's expected format
        $fullLoanData = [
            'loanID' => $row['loan_application_id'],
            'loan-amount' => (float)$row['loan_amount'],
            'payment-frequency' => $row['payment_frequency'],
            'date-start' => $row['date_start'],
            'date-end' => $row['date_end'],
            'clientName' => $row['first_name'] . ' ' . $row['middle_name'] . ' ' . $row['last_name'],
            'clientID' => $row['client_ID'],
            'interest-rate' => (int)$row['Interest_Pecent']
        ];
        
        echo json_encode($fullLoanData);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Loan not found.']);
    }

    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid or missing loan_id.']);
}

$conn->close();
?>