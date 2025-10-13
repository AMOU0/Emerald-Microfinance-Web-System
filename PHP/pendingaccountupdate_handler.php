<?php
header('Content-Type: application/json');

// --- 1. Database Configuration ---
$host = 'localhost';
$dbname = 'emerald_microfinance';
$username = 'root'; 
$password = ''; 
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// --- 1.1 Start Session ---
session_start();


// Function to fetch the combined client data (used for before/after state)
// This function remains crucial for capturing the state JSON.
function fetch_client_data($pdo, $clientID) {
    $sql = "
        SELECT
            c.*,
            cr.has_barangay_clearance,
            cr.has_valid_id,
            g.guarantor_last_name,
            g.guarantor_first_name,
            g.guarantor_middle_name,
            g.guarantor_street_address,
            g.guarantor_phone_number,
            la.loan_amount,
            la.payment_frequency,
            la.date_start,
            la.duration_of_loan,
            la.date_end,
            la.colateral
        FROM clients c
        LEFT JOIN client_requirements cr ON c.client_ID = cr.client_ID
        LEFT JOIN guarantor g ON c.client_ID = g.client_ID
        LEFT JOIN loan_applications la ON c.client_ID = la.client_ID
        WHERE c.client_ID = ? AND la.status = 'pending'
        ORDER BY la.created_at DESC LIMIT 1;
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$clientID]);
    return $stmt->fetch();
}


// --- 2. Input Validation and Preparation ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
    exit;
}

$clientID = trim($_POST['client_id'] ?? ''); 

if (empty($clientID)) {
    echo json_encode(['success' => false, 'error' => 'Client ID is missing. Cannot save changes.']);
    exit;
}

// User ID is not needed here as logging is done client-side.
// We keep it only for completeness if other server processes need it.
// $userId = $_SESSION['user_id'] ?? 0; 

// Personal Info Fields
$lastName = trim($_POST['lastName'] ?? '');
$firstName = trim($_POST['firstName'] ?? '');
$middleName = trim($_POST['middleName'] ?? '');
$maritalStatus = trim($_POST['maritalStatus'] ?? '');
$gender = trim($_POST['gender'] ?? '');
$dateOfBirth = trim($_POST['dateOfBirth'] ?? '');
$city = trim($_POST['city'] ?? '');
$barangay = trim($_POST['barangay'] ?? '');
$postalCode = trim($_POST['postalCode'] ?? '');
$streetAddress = trim($_POST['streetAddress'] ?? '');
$phoneNumber = trim($_POST['phoneNumber'] ?? '');
$email = trim($_POST['email'] ?? '');
$employmentStatus = trim($_POST['employmentStatus'] ?? '');
$occupation = trim($_POST['occupationPosition'] ?? '');
$yearsInJob = filter_var($_POST['yearsInJob'] ?? 0, FILTER_VALIDATE_INT);
$income = trim($_POST['incomeSalary'] ?? '');

// Requirements Fields
$hasBarangayClearance = ($_POST['barangayClearanceCheck'] ?? 'off') === 'on' ? 1 : 0;
$hasValidIdCheck = ($_POST['hasValidIdCheck'] ?? 'off') === 'on';
$validIdType = $hasValidIdCheck ? trim($_POST['validIdType'] ?? 'Others') : '0';
$colateral = trim($_POST['cr'] ?? '');

// Guarantor Fields
$guarantorLastName = trim($_POST['guarantorLastName'] ?? '');
$guarantorFirstName = trim($_POST['guarantorFirstName'] ?? '');
$guarantorMiddleName = trim($_POST['guarantorMiddleName'] ?? '');
$guarantorStreetAddress = trim($_POST['guarantorStreetAddress'] ?? '');
$guarantorPhoneNumber = trim($_POST['guarantorPhoneNumber'] ?? '');

// Loan Fields
$loanAmount = filter_var($_POST['loan-amount'] ?? '', FILTER_VALIDATE_FLOAT);
$paymentFrequency = trim($_POST['payment-frequency'] ?? '');
$dateStart = trim($_POST['date-start'] ?? '');
$durationOfLoan = trim($_POST['duration-of-loan'] ?? '');
$dateEnd = trim($_POST['date-end'] ?? '');


$beforeState = null;
$afterState = null;

try {
    // --- 3. Database Connection and Transaction Start ---
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // --- 3.1 Fetch BEFORE State for Audit Log (NEEDED to be returned to JS) ---
    $beforeStateData = fetch_client_data($pdo, $clientID);
    $beforeState = $beforeStateData ? json_encode($beforeStateData) : 'Client data not found before update.';

    $pdo->beginTransaction();

    // --- 4. Update clients Table (Personal Information) ---
    $sqlClients = "UPDATE clients SET 
        last_name = ?, first_name = ?, middle_name = ?, marital_status = ?, gender = ?, date_of_birth = ?, 
        city = ?, barangay = ?, postal_code = ?, street_address = ?, phone_number = ?, email = ?, 
        employment_status = ?, occupation = ?, years_in_job = ?, income = ?
        WHERE client_ID = ?";
        
    $stmtClients = $pdo->prepare($sqlClients);
    $stmtClients->execute([
        $lastName, $firstName, $middleName, $maritalStatus, $gender, $dateOfBirth, 
        $city, $barangay, $postalCode, $streetAddress, $phoneNumber, $email, 
        $employmentStatus, $occupation, $yearsInJob, $income, $clientID
    ]);
    
    // --- 5. Update client_requirements Table (Requirements) ---
    $sqlRequirements = "INSERT INTO client_requirements (client_ID, has_barangay_clearance, has_valid_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        has_barangay_clearance = VALUES(has_barangay_clearance), has_valid_id = VALUES(has_valid_id)";

    $stmtRequirements = $pdo->prepare($sqlRequirements);
    $stmtRequirements->execute([
        $clientID, $hasBarangayClearance, $validIdType
    ]);
    
    // --- 6. Update guarantor Table (Guarantor Information) ---
    $sqlGuarantor = "INSERT INTO guarantor (client_ID, guarantor_last_name, guarantor_first_name, guarantor_middle_name, guarantor_street_address, guarantor_phone_number)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        guarantor_last_name = VALUES(guarantor_last_name), 
        guarantor_first_name = VALUES(guarantor_first_name), 
        guarantor_middle_name = VALUES(guarantor_middle_name), 
        guarantor_street_address = VALUES(guarantor_street_address), 
        guarantor_phone_number = VALUES(guarantor_phone_number)";

    $stmtGuarantor = $pdo->prepare($sqlGuarantor);
    $stmtGuarantor->execute([
        $clientID, 
        $guarantorLastName, $guarantorFirstName, $guarantorMiddleName, 
        $guarantorStreetAddress, $guarantorPhoneNumber
    ]);
    
    // --- 7. Update loan_applications Table (Loan Details) ---
    $sqlLoan = "UPDATE loan_applications SET 
        loan_amount = ?, payment_frequency = ?, date_start = ?, 
        duration_of_loan = ?, date_end = ?, colateral = ?
        WHERE client_ID = ? AND status = 'pending' 
        ORDER BY created_at DESC LIMIT 1";

    $stmtLoan = $pdo->prepare($sqlLoan);
    $stmtLoan->execute([
        $loanAmount, $paymentFrequency, $dateStart, 
        $durationOfLoan, $dateEnd, $colateral, $clientID
    ]);


    // --- 8. Commit Transaction ---
    $pdo->commit();
    
    // --- 9. Fetch AFTER State and RETURN Data for client-side logging ---
    $afterStateData = fetch_client_data($pdo, $clientID);
    $afterState = $afterStateData ? json_encode($afterStateData) : 'Client data not found after update.';
    
    // The PHP must return all necessary log data for the JavaScript to send it to log_action.php
    echo json_encode([
        'success' => true, 
        'message' => 'Pending account details saved successfully. Logging initiated by client.',
        'audit_data' => [
            'client_id' => $clientID,
            'before_state' => $beforeState,
            'after_state' => $afterState,
            'target_table' => 'clients, client_requirements, guarantor, loan_applications'
        ]
    ]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Database Error (UPDATE): " . $e->getMessage());
        
    echo json_encode(['success' => false, 'error' => 'Database error: Failed to save changes.']);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("General Error (UPDATE): " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'An unexpected error occurred.']);
}
?>