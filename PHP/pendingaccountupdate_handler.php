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
$hasBarangayClearance = isset($_POST['barangayClearanceCheck']) && $_POST['barangayClearanceCheck'] === 'on' ? 1 : 0;
// If checkbox is checked AND a type is selected, use the type, otherwise '0'
$hasValidIdCheck = isset($_POST['hasValidIdCheck']) && $_POST['hasValidIdCheck'] === 'on';
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

try {
    // --- 3. Database Connection and Transaction Start ---
    $pdo = new PDO($dsn, $username, $password, $options);
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
    // UPSERT (INSERT OR UPDATE) to ensure a record exists
    $sqlRequirements = "INSERT INTO client_requirements (client_ID, has_barangay_clearance, has_valid_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        has_barangay_clearance = VALUES(has_barangay_clearance), has_valid_id = VALUES(has_valid_id)";

    $stmtRequirements = $pdo->prepare($sqlRequirements);
    $stmtRequirements->execute([
        $clientID, $hasBarangayClearance, $validIdType
    ]);
    
    // --- 6. Update guarantor Table (Guarantor Information) ---
    // UPSERT (INSERT OR UPDATE)
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
    // Update the most recent pending loan application for the client
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
    echo json_encode(['success' => true, 'message' => 'Pending account details saved successfully.']);

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