<?php 
// Enable detailed error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// 1. Include the connection handler and establish connection using PDO
require_once 'aadb_connect_handler.php';
$pdo = connectDB(); 

// 馃洃 CRITICAL MODIFICATION: Use $_POST and $_FILES for standard form data and files 馃洃
$data = $_POST;
$files = $_FILES; 

// 馃洃 MODIFIED: HANDLE DUPLICATE NAME CHECK REQUEST 馃洃
// This check still expects a JSON body from the separate JS fetch call
if (isset($_GET['checkName']) && $_GET['checkName'] === 'true') {
    // Read JSON data directly from the input stream for the separate checkName request
    $json_data = file_get_contents('php://input');
    $data_check = json_decode($json_data, true);

    // Check if required fields are present for the name check
    if (empty($data_check['lastName']) || empty($data_check['firstName'])) {
        echo json_encode(['duplicate' => false, 'message' => 'Missing data for name check.']);
        exit;
    }
    
    // This query uses LOWER() for case-insensitive matching
    $sql_check = "SELECT client_ID FROM clients WHERE 
        LOWER(last_name) = LOWER(?) AND 
        LOWER(first_name) = LOWER(?) AND 
        LOWER(middle_name) = LOWER(?)"; 
        
    $stmt_check = $pdo->prepare($sql_check);
    
    // Execute the check using the received data
    $stmt_check->execute([
        $data_check['lastName'],
        $data_check['firstName'],
        $data_check['middleName'] ?? '' // Use empty string if middleName is null/missing
    ]);
    
    // If a row is found, a duplicate exists
    if ($stmt_check->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(['duplicate' => true]);
    } else {
        echo json_encode(['duplicate' => false]);
    }
    exit; // Terminate script after handling the name check request
}
// 馃洃 END MODIFIED DUPLICATE NAME CHECK 馃洃

// Check if data is present for the main creation
if (empty($data)) {
    die(json_encode(['success' => false, 'message' => 'No client data received for creation.']));
}

// Start a transaction to ensure all operations are atomic
$pdo->beginTransaction();

try {
    // --- File Content Reading Helper Function ---
    /**
     * Reads the uploaded file content into a variable for LOB binding.
     */
    function readFileContent($fileInputName) {
        global $files;
        $file = $files[$fileInputName] ?? null;

        if ($file && $file['error'] === UPLOAD_ERR_OK) {
            // Read the file content
            return file_get_contents($file['tmp_name']);
        }
        return null; 
    }
    // --- End File Content Reading Helper Function ---


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

    // 3. Process File Uploads (Read the binary content)
    $barangayFileContent = readFileContent('barangayClearanceFile');
    $validIdFileContent = readFileContent('validIdFile');

    // 4. Insert into 'client_requirements' table 
    $validIdValue = $data['hasValidId'] == 1 ? ($data['validIdType'] ?? 'Valid ID Provided') : '0';
    $barangayClearanceValue = $data['hasBarangayClearance'];

    // 馃洃 MODIFIED: Target LONGBLOB columns (valid_id_scan, barangay_clearance_scan) 馃洃
    $sql_req = "INSERT INTO client_requirements (
        client_ID, has_valid_id, valid_id_scan, has_barangay_clearance, barangay_clearance_scan
    ) VALUES (?, ?, ?, ?, ?)";
    
    $stmt_req = $pdo->prepare($sql_req);
    
    // Bind regular parameters (ID and status flags)
    $stmt_req->bindParam(1, $newClientId);
    $stmt_req->bindParam(2, $validIdValue); 
    
    // 馃洃 CRITICAL: Bind LOB parameters using PDO::PARAM_LOB for binary data (valid_id_scan) 馃洃
    $stmt_req->bindParam(3, $validIdFileContent, PDO::PARAM_LOB);

    $stmt_req->bindParam(4, $barangayClearanceValue);

    // 馃洃 CRITICAL: Bind LOB parameters using PDO::PARAM_LOB for binary data (barangay_clearance_scan) 馃洃
    $stmt_req->bindParam(5, $barangayFileContent, PDO::PARAM_LOB);


    $stmt_req->execute();

    // If all queries are successful, commit the transaction
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Client created successfully!', 'clientId' => $newClientId]);

// Catch PDO exceptions and other errors
} catch (PDOException $e) {
    // If any query failed, rollback the transaction and log the error
    $pdo->rollBack();
    // Log the error for server-side debugging
    error_log("DB Error: " . $e->getMessage()); 
    // Check for large data errors
    if (strpos($e->getMessage(), 'max_allowed_packet') !== false) {
        // This suggests the file size exceeded MySQL's limit
        echo json_encode(['success' => false, 'message' => 'Database error: The file size exceeds the server limit (max_allowed_packet).']);
    } else {
        // Return a generic error to the client
        echo json_encode(['success' => false, 'message' => 'Database error during client creation.']);
    }
} catch (Exception $e) {
    // Catch any other unexpected errors
    $pdo->rollBack();
    error_log("Unexpected Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>