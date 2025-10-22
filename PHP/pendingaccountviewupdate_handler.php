<?php
header('Content-Type: application/json');

// --- 1. Include the database connection function --- 
require_once 'aadb_connect_handler.php'; 

// --- 1.1 Start Session ---
session_start();


/**
 * Function to fetch the combined client data for before/after state logging.
 * NOTE: This function MUST fetch the loan_application_id!
 */
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
            la.loan_application_id,
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
        ORDER BY la.created_at DESC
        LIMIT 1;
    ";
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$clientID]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        // Important: Transform data to reflect how it's stored for logging.
        if ($data) {
            $data['has_barangay_clearance'] = (int)$data['has_barangay_clearance'];
        }
        return $data;
    } catch (PDOException $e) {
        error_log("Fetch Client Data Error for Audit: " . $e->getMessage());
        return null;
    }
}

// --- 2. Input Validation and Sanitization ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
    exit;
}

if (!isset($_POST['client_id']) || empty($_POST['client_id'])) {
    echo json_encode(['success' => false, 'error' => 'Client ID is missing. Cannot save.']);
    exit;
}

// Sanitize and assign variables
$clientID = trim($_POST['client_id']);

// Personal Information (from clients table)
$lastName = trim($_POST['lastName']);
$firstName = trim($_POST['firstName']);
$middleName = trim($_POST['middleName']);
$maritalStatus = trim($_POST['maritalStatus']);
$gender = trim($_POST['gender']);
$dateOfBirth = trim($_POST['dateOfBirth']);
$city = trim($_POST['city']);
$barangay = trim($_POST['barangay']);
$streetAddress = trim($_POST['streetAddress']);
$phoneNumber = trim($_POST['phoneNumber']);
$employmentStatus = trim($_POST['employmentStatus']);
$occupation = trim($_POST['occupationPosition']);
$yearsInJob = (int)$_POST['yearsInJob'];
$income = trim($_POST['incomeSalary']);

// Requirements (from client_requirements table)
$hasBarangayClearance = isset($_POST['barangayClearanceCheck']) && $_POST['barangayClearanceCheck'] === 'on' ? 1 : 0;
// If the checkbox is checked, use the selected ID type, otherwise use '0' (for No Valid ID)
$hasValidId = isset($_POST['hasValidIdCheck']) && $_POST['hasValidIdCheck'] === 'on' ? trim($_POST['validIdType']) : '0'; 

// Guarantor Information (from guarantor table)
$guarantorLastName = trim($_POST['guarantorLastName']);
$guarantorFirstName = trim($_POST['guarantorFirstName']);
$guarantorMiddleName = trim($_POST['guarantorMiddleName']);
$guarantorStreetAddress = trim($_POST['guarantorStreetAddress']);
$guarantorPhoneNumber = trim($_POST['guarantorPhoneNumber']);

// Loan Details (from loan_applications table)
$loanAmount = (float)$_POST['loan-amount'];
$paymentFrequency = trim($_POST['payment-frequency']);
$dateStart = trim($_POST['date-start']);
$durationOfLoan = trim($_POST['duration-of-loan']); 
$dateEnd = trim($_POST['date-end']);
$colateral = trim($_POST['cr']); 

// Check for critical missing data (optional, but good practice)
if (empty($lastName) || empty($firstName) || empty($dateOfBirth) || empty($city) || empty($streetAddress) || empty($phoneNumber)) {
    echo json_encode(['success' => false, 'error' => 'Missing critical client information.']);
    exit;
}


try {
    // 3. Database Connection
    $pdo = connectDB(); 
    
    // --- 4. Fetch BEFORE State for Audit Log ---
    $beforeStateData = fetch_client_data($pdo, $clientID);
    if (!$beforeStateData) {
        throw new Exception('Pending loan application not found for audit log. Update aborted.');
    }
    $beforeState = json_encode($beforeStateData);
    $loanApplicationId = $beforeStateData['loan_application_id'];

    if (!$loanApplicationId) {
        throw new Exception('Loan application ID is missing for the pending account. Update aborted.');
    }

    // --- 5. Start Transaction ---
    $pdo->beginTransaction();

    // --- 6. Update CLIENTS Table (Prepared Statement) ---
    $sqlClients = "
        UPDATE clients SET
            last_name = ?, first_name = ?, middle_name = ?, marital_status = ?, gender = ?, 
            date_of_birth = ?, city = ?, barangay = ?, street_address = ?, phone_number = ?, 
            employment_status = ?, occupation = ?, years_in_job = ?, income = ?
        WHERE client_ID = ?
    ";
    $stmtClients = $pdo->prepare($sqlClients);
    $stmtClients->execute([
        $lastName, $firstName, $middleName, $maritalStatus, $gender, 
        $dateOfBirth, $city, $barangay, $streetAddress, $phoneNumber, 
        $employmentStatus, $occupation, $yearsInJob, $income, 
        $clientID
    ]);

    // --- 7. Update/Insert CLIENT_REQUIREMENTS Table (UPSERT) ---
    $sqlReqCheck = "SELECT client_ID FROM client_requirements WHERE client_ID = ?";
    $stmtReqCheck = $pdo->prepare($sqlReqCheck);
    $stmtReqCheck->execute([$clientID]);
    $reqExists = $stmtReqCheck->fetch();

    if ($reqExists) {
        $sqlRequirements = "
            UPDATE client_requirements SET
                has_barangay_clearance = ?, has_valid_id = ?
            WHERE client_ID = ?
        ";
        $stmtRequirements = $pdo->prepare($sqlRequirements);
        $stmtRequirements->execute([$hasBarangayClearance, $hasValidId, $clientID]);
    } else {
        $sqlRequirements = "
            INSERT INTO client_requirements (client_ID, has_barangay_clearance, has_valid_id)
            VALUES (?, ?, ?)
        ";
        $stmtRequirements = $pdo->prepare($sqlRequirements);
        $stmtRequirements->execute([$clientID, $hasBarangayClearance, $hasValidId]);
    }
    
    // --- 8. Update/Insert GUARANTOR Table (UPSERT) ---
    $sqlGuarantorCheck = "SELECT client_ID FROM guarantor WHERE client_ID = ?";
    $stmtGuarantorCheck = $pdo->prepare($sqlGuarantorCheck);
    $stmtGuarantorCheck->execute([$clientID]);
    $guarantorExists = $stmtGuarantorCheck->fetch();
    
    $guarantorFields = [
        $guarantorLastName, $guarantorFirstName, $guarantorMiddleName, 
        $guarantorStreetAddress, $guarantorPhoneNumber
    ];

    if ($guarantorExists) {
        $sqlGuarantor = "
            UPDATE guarantor SET
                guarantor_last_name = ?, guarantor_first_name = ?, guarantor_middle_name = ?, 
                guarantor_street_address = ?, guarantor_phone_number = ?
            WHERE client_ID = ?
        ";
        $stmtGuarantor = $pdo->prepare($sqlGuarantor);
        $stmtGuarantor->execute([...$guarantorFields, $clientID]);
    } else {
        $sqlGuarantor = "
            INSERT INTO guarantor (client_ID, guarantor_last_name, guarantor_first_name, guarantor_middle_name, guarantor_street_address, guarantor_phone_number)
            VALUES (?, ?, ?, ?, ?, ?)
        ";
        $stmtGuarantor = $pdo->prepare($sqlGuarantor);
        $stmtGuarantor->execute([$clientID, ...$guarantorFields]);
    }

    // --- 9. Update LOAN_APPLICATIONS Table (ONLY the PENDING loan) ---
    $sqlLoan = "
        UPDATE loan_applications SET
            loan_amount = ?, payment_frequency = ?, date_start = ?, 
            duration_of_loan = ?, date_end = ?, colateral = ?
        WHERE loan_application_id = ? AND client_ID = ?
    ";
    $stmtLoan = $pdo->prepare($sqlLoan);
    $stmtLoan->execute([
        $loanAmount, $paymentFrequency, $dateStart, 
        $durationOfLoan, $dateEnd, $colateral, 
        $loanApplicationId, $clientID
    ]);


    // --- 10. Commit Transaction ---
    $pdo->commit();
    
    // --- 11. Fetch AFTER State and RETURN Data for client-side logging ---
    $afterStateData = fetch_client_data($pdo, $clientID);
    $afterState = $afterStateData ? json_encode($afterStateData) : 'Client data not found after update.';
    
    // Return audit data for the JavaScript to log
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
    echo json_encode(['success' => false, 'error' => 'An unexpected error occurred during the save process.']);
}
?>