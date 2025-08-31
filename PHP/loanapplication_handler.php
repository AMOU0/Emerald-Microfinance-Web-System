<?php
header('Content-Type: application/json');

// Database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => "Connection failed: " . $conn->connect_error]);
    exit();
}

// Get the raw POST data
$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true);

// Check if data is valid
if ($data === null) {
    echo json_encode(['status' => 'error', 'message' => "Invalid JSON data received."]);
    exit();
}

// Start a transaction to ensure data integrity
$conn->begin_transaction();

try {
    // 1. Insert into loan_applications table
    $sql_loan = "INSERT INTO loan_applications (client_ID, loan_amount, payment_frequency, date_start, date_end, duration_of_loan, status, paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt_loan = $conn->prepare($sql_loan);
    if ($stmt_loan === false) {
        throw new Exception("Loan prepare failed: " . $conn->error);
    }
    
    // Set default status and paid values
    $status = 'pending';
    $paid = 0;
    
    $stmt_loan->bind_param("issssssi", 
        $data['clientID'],
        $data['loan-amount'],
        $data['payment-frequency'],
        $data['date-start'],
        $data['date-end'],
        $data['duration-of-loan'],
        $status,
        $paid
    );
    
    if (!$stmt_loan->execute()) {
        throw new Exception("Loan execute failed: " . $stmt_loan->error);
    }

    $loanApplicationID = $conn->insert_id;

    // 2. Insert into guarantor table
    // Corrected column names to match the database schema
    $sql_guarantor = "INSERT INTO guarantor (client_ID, loan_application_id, guarantor_last_name, guarantor_first_name, guarantor_middle_name, guarantor_street_address, guarantor_phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt_guarantor = $conn->prepare($sql_guarantor);
    if ($stmt_guarantor === false) {
        throw new Exception("Guarantor prepare failed: " . $conn->error);
    }

    $stmt_guarantor->bind_param("iisssss",
        $data['clientID'],
        $loanApplicationID,
        $data['guarantorLastName'],
        $data['guarantorFirstName'],
        $data['guarantorMiddleName'],
        $data['guarantorStreetAddress'],
        $data['guarantorPhoneNumber']
    );

    if (!$stmt_guarantor->execute()) {
        throw new Exception("Guarantor execute failed: " . $stmt_guarantor->error);
    }

    // If everything is successful, commit the transaction
    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Loan application submitted successfully!', 'loan_application_id' => $loanApplicationID]);

} catch (Exception $e) {
    // Something went wrong, rollback the transaction
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => "Transaction failed: " . $e->getMessage()]);

} finally {
    // Close statements and connection
    if (isset($stmt_loan)) {
        $stmt_loan->close();
    }
    if (isset($stmt_guarantor)) {
        $stmt_guarantor->close();
    }
    $conn->close();
}
?>