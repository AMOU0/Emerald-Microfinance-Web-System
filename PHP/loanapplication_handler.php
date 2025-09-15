<?php
header('Content-Type: application/json');
date_default_timezone_set('Asia/Manila');

// Database connection parameters
$servername = "localhost";
$username = "root"; // Replace with your actual database username
$password = ""; // Replace with your actual database password
$dbname = "emerald_microfinance";

// Initialize the response array
$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];
$conn = null;

try {
    // Establish database connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Get the raw POST data
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    // Validate incoming data
    if ($data === null) {
        throw new Exception("Invalid JSON data received.");
    }

    $required_fields = ['clientID', 'colateral', 'guarantorLastName', 'guarantorFirstName', 'guarantorStreetAddress', 'guarantorPhoneNumber', 'loan-amount', 'payment-frequency', 'date-start', 'duration-of-loan', 'date-end', 'interest-rate'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            throw new Exception("Required field '{$field}' is missing or empty.");
        }
    }

    // Sanitize and prepare data for insertion
    $clientID = $conn->real_escape_string($data['clientID']);
    $colateral = $conn->real_escape_string($data['colateral']);
    $loan_amount = (float)$data['loan-amount'];
    $payment_frequency = $conn->real_escape_string($data['payment-frequency']);
    $date_start = $conn->real_escape_string($data['date-start']);
    $duration_of_loan = $conn->real_escape_string($data['duration-of-loan']);
    $date_end = $conn->real_escape_string($data['date-end']);
    $interest_rate = (int)$data['interest-rate'];
    
    $guarantorLastName = $conn->real_escape_string($data['guarantorLastName']);
    $guarantorFirstName = $conn->real_escape_string($data['guarantorFirstName']);
    $guarantorMiddleName = isset($data['guarantorMiddleName']) ? $conn->real_escape_string($data['guarantorMiddleName']) : '';
    $guarantorStreetAddress = $conn->real_escape_string($data['guarantorStreetAddress']);
    $guarantorPhoneNumber = $conn->real_escape_string($data['guarantorPhoneNumber']);

    // Begin transaction
    $conn->begin_transaction();

    // Generate a unique loan application ID
    $current_year = date("Y");
    $sql_count = "SELECT COUNT(*) as count FROM loan_applications WHERE YEAR(created_at) = ?";
    $stmt_count = $conn->prepare($sql_count);
    $stmt_count->bind_param("s", $current_year);
    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    $row_count = $result_count->fetch_assoc();
    $loan_count = $row_count['count'] + 1;
    $loan_application_id = $current_year . str_pad($loan_count, 5, '0', STR_PAD_LEFT);

    // Insert into `loan_applications` table
    // CHANGE IS HERE: The hardcoded 'Approved' status has been changed to 'Pending'
    $sql_loan = "INSERT INTO `loan_applications` (`loan_application_id`, `colateral`, `loan_amount`, `payment_frequency`, `date_start`, `duration_of_loan`, `interest_rate`, `date_end`, `client_ID`, `status`, `paid`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Unpaid')";
    $stmt_loan = $conn->prepare($sql_loan);
    $stmt_loan->bind_param("ssisssiss", $loan_application_id, $colateral, $loan_amount, $payment_frequency, $date_start, $duration_of_loan, $interest_rate, $date_end, $clientID);

    if (!$stmt_loan->execute()) {
        throw new Exception("Error inserting loan application: " . $stmt_loan->error);
    }
    
    // Insert into `guarantor` table
    $sql_guarantor = "INSERT INTO `guarantor` (`guarantor_last_name`, `guarantor_first_name`, `guarantor_middle_name`, `guarantor_street_address`, `guarantor_phone_number`, `loan_application_id`, `client_ID`) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt_guarantor = $conn->prepare($sql_guarantor);
    $stmt_guarantor->bind_param("sssssss", $guarantorLastName, $guarantorFirstName, $guarantorMiddleName, $guarantorStreetAddress, $guarantorPhoneNumber, $loan_application_id, $clientID);
    
    if (!$stmt_guarantor->execute()) {
        throw new Exception("Error inserting guarantor: " . $stmt_guarantor->error);
    }

    // Commit the transaction
    $conn->commit();

    $response['status'] = 'success';
    $response['message'] = 'Loan application and guarantor details saved successfully.';
    $response['loan_application_id'] = $loan_application_id;

} catch (Exception $e) {
    // Rollback the transaction on error
    if ($conn && $conn->in_transaction) {
        $conn->rollback();
    }
    $response['message'] = 'Transaction failed: ' . $e->getMessage();
} finally {
    // Close prepared statements and the connection
    if (isset($stmt_loan) && $stmt_loan) {
        $stmt_loan->close();
    }
    if (isset($stmt_guarantor) && $stmt_guarantor) {
        $stmt_guarantor->close();
    }
    if ($conn) {
        $conn->close();
    }
    echo json_encode($response);
}
?>