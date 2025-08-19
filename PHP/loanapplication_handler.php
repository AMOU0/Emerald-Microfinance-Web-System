<?php
// Enable detailed error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

// --- Database Credentials ---
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

// --- Start a database transaction ---
// This ensures that either both inserts are successful, or none of them are.
// If any query fails, we can rollback all changes.
$conn->begin_transaction();

// Get the raw POST data and decode it
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if ($data === null) {
    // If JSON decoding fails, rollback the transaction and exit
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON data received.']);
    exit();
}

// Extract data from the POST request
// Note: It's good practice to sanitize input before using it in queries.
$guarantorLastName = $data['guarantorLastName'];
$guarantorFirstName = $data['guarantorFirstName'];
$guarantorMiddleName = $data['guarantorMiddleName'];
$guarantorStreetAddress = $data['guarantorStreetAddress'];
$guarantorPhoneNumber = $data['guarantorPhoneNumber'];
$loanAmount = $data['loan-amount'];
$paymentFrequency = $data['payment-frequency'];
$dateStart = $data['date-start'];
$durationOfLoan = $data['duration-of-loan'];
$dateEnd = $data['date-end'];

// --- Step 1: Insert into loan_applications table ---
// Prepare the SQL statement for the loan applications table
$sql_loan_app = "INSERT INTO loan_applications (
    loan_amount, 
    payment_frequency, 
    date_start, 
    duration_of_loan, 
    date_end
) VALUES (?, ?, ?, ?, ?)";

$stmt_loan_app = $conn->prepare($sql_loan_app);
if ($stmt_loan_app === false) {
    $conn->rollback(); // Rollback on prepare failure
    echo json_encode(['status' => 'error', 'message' => 'Prepare failed for loan_applications: ' . $conn->error]);
    exit();
}

// Bind parameters and execute the statement
// 'sdsss' stands for string (dateStart), double (loanAmount), string, string, string.
// Assuming loan_amount is a float/double and others are strings. Adjust if needed.
$stmt_loan_app->bind_param("dssss", 
    $loanAmount, 
    $paymentFrequency, 
    $dateStart, 
    $durationOfLoan, 
    $dateEnd
);

if (!$stmt_loan_app->execute()) {
    $conn->rollback(); // Rollback on execute failure
    echo json_encode(['status' => 'error', 'message' => 'Execute failed for loan_applications: ' . $stmt_loan_app->error]);
    $stmt_loan_app->close();
    exit();
}

// Get the ID of the newly inserted loan application record
$loan_application_id = $conn->insert_id;
$stmt_loan_app->close();

// --- Step 2: Insert into guarantor table ---
// Prepare the SQL statement for the guarantor table, including the foreign key
// The guarantor table must have a column (e.g., 'loan_application_id') to link it to the loan_applications table.
$sql_guarantor = "INSERT INTO guarantor (
    guarantor_last_name, 
    guarantor_first_name, 
    guarantor_middle_name, 
    guarantor_street_address, 
    guarantor_phone_number,
    loan_application_id
) VALUES (?, ?, ?, ?, ?, ?)";

$stmt_guarantor = $conn->prepare($sql_guarantor);
if ($stmt_guarantor === false) {
    $conn->rollback(); // Rollback on prepare failure
    echo json_encode(['status' => 'error', 'message' => 'Prepare failed for guarantor: ' . $conn->error]);
    exit();
}

// Bind parameters and execute the statement
// We now have 6 variables to bind.
$stmt_guarantor->bind_param("sssssi", 
    $guarantorLastName, 
    $guarantorFirstName, 
    $guarantorMiddleName, 
    $guarantorStreetAddress, 
    $guarantorPhoneNumber,
    $loan_application_id
);

if ($stmt_guarantor->execute()) {
    // If both statements executed successfully, commit the transaction
    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Loan application and guarantor information submitted successfully!']);
} else {
    // If the second statement fails, rollback all changes
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => 'Execute failed for guarantor: ' . $stmt_guarantor->error]);
}

$stmt_guarantor->close();
$conn->close();
?>
