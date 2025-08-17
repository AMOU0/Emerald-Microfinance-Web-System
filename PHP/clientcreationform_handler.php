<?php
// Enable detailed error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

// Create a new database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check for connection errors
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => "Connection failed: " . $conn->connect_error]));
}

// Log and decode the incoming JSON data
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// Check if JSON decoding was successful and data is not null
if ($data === null) {
    die(json_encode(['success' => false, 'message' => 'Invalid JSON data.']));
}

// Start a transaction
$conn->begin_transaction();

try {
    // Insert into 'clients' table
    // Store optional values in variables to pass by reference
    $email = $data['email'] ?? null;
    $employmentStatus = $data['employmentStatus'] ?? null;
    $occupationPosition = $data['occupationPosition'] ?? null;
    $yearsInJob = $data['yearsInJob'] ?? null;

    $stmt_client = $conn->prepare("INSERT INTO clients (last_name, first_name, middle_name, marital_status, gender, date_of_birth, city, barangay, postal_code, street_address, phone_number, email, employment_status, occupation, years_in_job, income) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt_client->bind_param("sssssssssssssssd",
        $data['lastName'],
        $data['firstName'],
        $data['middleName'],
        $data['maritalStatus'],
        $data['gender'],
        $data['dateOfBirth'],
        $data['city'],
        $data['barangay'],
        $data['postalCode'],
        $data['streetAddress'],
        $data['phoneNumber'],
        $email,
        $employmentStatus,
        $occupationPosition,
        $yearsInJob,
        $data['incomeSalary']
    );
    $stmt_client->execute();
    $client_ID = $stmt_client->insert_id;
    $stmt_client->close();

    // Insert into 'guarantor' table
    // Store optional values in variables to pass by reference
    $guarantorEmail = $data['guarantorEmail'] ?? null;
    $guarantorEmploymentStatus = $data['guarantorEmploymentStatus'] ?? null;
    $guarantorOccupationPosition = $data['guarantorOccupationPosition'] ?? null;
    $guarantorYearsInJob = $data['guarantorYearsInJob'] ?? null;

    $stmt_guarantor = $conn->prepare("INSERT INTO guarantor (last_name, first_name, middle_name, marital_status, gender, date_of_birth, city, barangay, postal_code, street_address, phone_number, email, employment_status, occupation, years_in_job, income, client_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt_guarantor->bind_param("ssssssssssssssdsi",
        $data['guarantorLastName'],
        $data['guarantorFirstName'],
        $data['guarantorMiddleName'],
        $data['guarantorMaritalStatus'],
        $data['guarantorGender'],
        $data['guarantorDateOfBirth'],
        $data['guarantorCity'],
        $data['guarantorBarangay'],
        $data['guarantorPostalCode'],
        $data['guarantorStreetAddress'],
        $data['guarantorPhoneNumber'],
        $guarantorEmail,
        $guarantorEmploymentStatus,
        $guarantorOccupationPosition,
        $guarantorYearsInJob,
        $data['guarantorIncomeSalary'],
        $client_ID
    );
    $stmt_guarantor->execute();
    $stmt_guarantor->close();

    // Insert into 'client_requirements' table
    $stmt_req = $conn->prepare("INSERT INTO client_requirements (has_valid_id, has_barangay_clearance, has_cr, client_ID) VALUES (?, ?, ?, ?)");
    $stmt_req->bind_param("iiis", $data['validId'], $data['barangayClearance'], $data['cr'], $client_ID);
    $stmt_req->execute();
    $stmt_req->close();

    // If all queries are successful, commit the transaction
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Client and guarantor data saved successfully!']);

} catch (mysqli_sql_exception $e) {
    // If any query failed, rollback the transaction and log the error
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Catch any other unexpected errors
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
} finally {
    // Close the database connection
    $conn->close();
}
?>