<?php
// Enable detailed error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// 1. Include the connection handler and establish connection using PDO
// Note: Assumes 'aadb_connect_handler.php' contains the connectDB() function
require_once 'aadb_connect_handler.php';
$pdo = connectDB(); 

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if ($data === null) {
    die(json_encode(['success' => false, 'message' => 'Invalid JSON data.']));
}

// 🛑 MODIFIED: HANDLE DUPLICATE NAME CHECK REQUEST (LName, FName, MName only) 🛑
if (isset($_GET['checkName']) && $_GET['checkName'] === 'true') {
    // Check if required fields are present for the name check
    if (empty($data['lastName']) || empty($data['firstName']) || empty($data['middleName'])) {
        echo json_encode(['duplicate' => false, 'message' => 'Missing data for name check.']);
        exit;
    }

    // This query uses LOWER() for case-insensitive matching: 'John Doe' matches 'john doe'
    $sql_check = "SELECT client_ID FROM clients WHERE 
        LOWER(last_name) = LOWER(?) AND 
        LOWER(first_name) = LOWER(?) AND 
        LOWER(middle_name) = LOWER(?)"; 
        
    $stmt_check = $pdo->prepare($sql_check);
    
    // Execute the check using only the name data
    $stmt_check->execute([
        $data['lastName'],
        $data['firstName'],
        $data['middleName']
    ]);
    
    // If a row is found, a duplicate exists
    if ($stmt_check->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(['duplicate' => true]);
    } else {
        echo json_encode(['duplicate' => false]);
    }
    exit; // Terminate script after handling the name check request
}
// 🛑 END MODIFIED DUPLICATE NAME CHECK 🛑

// Start a transaction to ensure all operations are atomic
$pdo->beginTransaction();

try {
    // 1. Generate the Client ID (YYYY-XXXXX format)
    $currentYear = date('Y');

    // Find the last client ID for the current year
    $sql = "SELECT client_ID FROM clients WHERE client_ID LIKE ? ORDER BY client_ID DESC LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $searchPattern = $currentYear . '%';
    $stmt->execute([$searchPattern]);

    $nextClientNumber = 1;
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        // Extract the numeric part and increment it
        $lastIdNumber = intval(substr($row['client_ID'], 4));
        $nextClientNumber = $lastIdNumber + 1;
    }
    
    // Format the number with leading zeros
    $formattedNumber = sprintf("%05d", $nextClientNumber);
    $newClientId = $currentYear . $formattedNumber;
    
    // Define optional fields, using the keys sent from the JS
    $employmentStatus = $data['employmentStatus'] ?? null;
    $occupationPosition = $data['occupationPosition'] ?? null;
    $yearsInJob = $data['yearsInJob'] ?? null;

    // 2. Insert into 'clients' table with the custom ID
    $sql_client = "INSERT INTO clients (
                client_ID, last_name, first_name, middle_name, marital_status, gender, date_of_birth,
                city, barangay, street_address, phone_number, employment_status,
                occupation, years_in_job, income
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; 
            
    $stmt_client = $pdo->prepare($sql_client);

    $params_client = [
        $newClientId,
        $data['lastName'],
        $data['firstName'],
        $data['middleName'],
        $data['maritalStatus'],
        $data['gender'],
        $data['dateOfBirth'],
        $data['city'],
        $data['barangay'],
        $data['streetAddress'],
        $data['phoneNumber'],
        $employmentStatus,
        $occupationPosition, 
        $yearsInJob,
        $data['incomeSalary'] 
    ];

    $stmt_client->execute($params_client);

    // 3. Insert into 'client_requirements' table 
    $validIdValue = $data['hasValidId'] == 1 ? ($data['validIdType'] ?? 'Valid ID Provided') : '0';
    $barangayClearanceValue = $data['hasBarangayClearance'];

    $sql_req = "INSERT INTO client_requirements (client_ID, has_valid_id, has_barangay_clearance) VALUES (?, ?, ?)";
    $stmt_req = $pdo->prepare($sql_req);
    
    $params_req = [
        $newClientId,
        $validIdValue, 
        $barangayClearanceValue
    ];

    $stmt_req->execute($params_req);

    // If all queries are successful, commit the transaction
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Client created successfully!', 'clientId' => $newClientId]);

// Catch PDO exceptions and other errors
} catch (PDOException $e) {
    // If any query failed, rollback the transaction and log the error
    $pdo->rollBack();
    // Log the error for server-side debugging
    error_log("DB Error: " . $e->getMessage()); 
    // Return a generic error to the client
    echo json_encode(['success' => false, 'message' => 'Database error during client creation.']);
} catch (Exception $e) {
    // Catch any other unexpected errors
    $pdo->rollBack();
    error_log("Unexpected Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>