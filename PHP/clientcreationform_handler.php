<?php
// Enable detailed error reporting for development
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

// Start a transaction to ensure all operations are atomic
$conn->begin_transaction();

try {
    // 1. Generate the Client ID (YYYY-XXXXX format)
    $currentYear = date('Y');

    // Find the last client ID for the current year
    $sql = "SELECT client_ID FROM clients WHERE client_ID LIKE ? ORDER BY client_ID DESC LIMIT 1";
    $stmt = $conn->prepare($sql);
    $searchPattern = $currentYear . '%';
    $stmt->bind_param("s", $searchPattern);
    $stmt->execute();
    $result = $stmt->get_result();

    $nextClientNumber = 1;
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        // Extract the numeric part and increment it
        $lastIdNumber = intval(substr($row['client_ID'], 4));
        $nextClientNumber = $lastIdNumber + 1;
    }
    
    // Format the number with leading zeros
    $formattedNumber = sprintf("%05d", $nextClientNumber);
    $newClientId = $currentYear . $formattedNumber;
    
    // 2. Insert into 'clients' table with the custom ID
    $email = $data['email'] ?? null;
    $employmentStatus = $data['employmentStatus'] ?? null;
    $occupationPosition = $data['occupationPosition'] ?? null;
    $yearsInJob = $data['yearsInJob'] ?? null;

    $stmt_client = $conn->prepare("INSERT INTO clients (
                client_ID, last_name, first_name, middle_name, marital_status, gender, date_of_birth,
                city, barangay, postal_code, street_address, phone_number, email, employment_status,
                occupation, years_in_job, income
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt_client->bind_param("sssssssssssssssss",
        $newClientId,
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
    $stmt_client->close();

    // 3. Insert into 'client_requirements' table
    // The client_ID will also serve as the primary key for this table.
    $stmt_req = $conn->prepare("INSERT INTO client_requirements (client_ID, has_valid_id, has_barangay_clearance, has_cr) VALUES (?, ?, ?, ?)");
    $stmt_req->bind_param("siii", 
        $newClientId,
        $data['validId'], 
        $data['barangayClearance'], 
        $data['cr']
    );
    $stmt_req->execute();
    $stmt_req->close();

    // If all queries are successful, commit the transaction
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Client and guarantor data saved successfully!', 'clientId' => $newClientId]);

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
