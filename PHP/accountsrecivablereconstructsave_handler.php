<?php
// CRITICAL: Keep error display on until successfully tested
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// --- Include PDO Connection Handler ---
require_once 'aadb_connect_handler.php';
// --------------------------------------

/**
 * Sends a JSON response and exits the script.
 * Note: PDO does not need explicit $conn->close() if the connection object goes out of scope,
 * but the PDO object ($pdo) will be passed here. We remove explicit close for PDO.
 */
function send_json_response($data) {
    $httpCode = $data['http_code'] ?? 200;
    http_response_code($httpCode);
    if (isset($data['http_code'])) {
        unset($data['http_code']);
    }
    echo json_encode($data);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response(["success" => false, "error" => "Invalid request method. POST required.", "http_code" => 405]);
}

// Establish PDO connection
try {
    $pdo = connectDB(); // ConnectDB handles error logging and exit on failure
} catch (Exception $e) {
    // connectDB already handles the exit, but for completeness in case of logic changes
    send_json_response(["success" => false, "error" => "Database connection failed unexpectedly.", "http_code" => 500]);
}


// 1. Validate POST data
$required_fields = ['loanID', 'payment_frequency', 'date_start', 'duration_of_loan', 'date_end'];
foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        send_json_response(["success" => false, "error" => "Missing required field: {$field}", "http_code" => 400]);
    }
}

// Get input values (PDO uses prepared statements, so direct assignment is safer than real_escape_string)
$loanApplicationId = $_POST['loanID']; 
$paymentFrequency = $_POST['payment_frequency'];
$dateStart = $_POST['date_start'];
$duration = $_POST['duration_of_loan']; 
$dateEnd = $_POST['date_end'];

// --- 2. Generate new loan_reconstruct_id (e.g., 100001mmyyyy) ---
$currentSuffix = date('mY'); 
$newReconstructId = '';

// Query to find the last ID created this month, ensuring it starts with '1' and ends with the suffix
$idQuerySql = "SELECT loan_reconstruct_id FROM loan_reconstruct 
               WHERE loan_reconstruct_id LIKE CONCAT('1%', :suffix) 
               ORDER BY loan_reconstruct_id DESC LIMIT 1";

$stmt = $pdo->prepare($idQuerySql);
// Use named placeholders for PDO binding
$stmt->execute([':suffix' => $currentSuffix]);
$lastId = $stmt->fetch(PDO::FETCH_ASSOC);


if ($lastId) {
    // If an ID exists (e.g., '100005102025'), extract and increment the 6-digit prefix
    $lastIdString = $lastId['loan_reconstruct_id'];
    
    // Extract the 6-digit prefix (e.g., '100005')
    $sequencePrefix = substr($lastIdString, 0, 6); 
    
    // Increment the sequence number as a whole: 100005 + 1 = 100006
    $newSequence = (int)$sequencePrefix + 1;
} else {
    // If no ID exists for this month/year, start at 100001
    $newSequence = 100001;
}

// Format the new ID 
$newIdPrefix = str_pad($newSequence, 6, '0', STR_PAD_LEFT); // Ensures 6 digits, e.g., '100006'
$newReconstructId = $newIdPrefix . $currentSuffix;
// -------------------------------------------------------------


// --- 3. Fetch necessary values (reconstruct_amount, interest_rate) ---
$loanSql = "SELECT loan_amount, interest_rate FROM loan_applications WHERE loan_application_id = :loan_app_id";
$stmt = $pdo->prepare($loanSql);
if (!$stmt) {
    send_json_response(["success" => false, "error" => "Loan detail SQL preparation failed.", "http_code" => 500]);
}
$stmt->execute([':loan_app_id' => $loanApplicationId]);
$loanDetails = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$loanDetails) {
    send_json_response(["success" => false, "error" => "Loan not found.", "http_code" => 404]);
}

// Calculate the reconstruct_amount (balance)
$loanAmount = (float)$loanDetails['loan_amount'];
$interestRate = (int)$loanDetails['interest_rate'];
$totalLoanWithInterest = $loanAmount * (1 + $interestRate / 100);

$paymentSql = "SELECT SUM(amount_paid) AS total_paid FROM payment WHERE loan_application_id = :loan_app_id";
$stmt = $pdo->prepare($paymentSql);
if (!$stmt) {
    send_json_response(["success" => false, "error" => "Payment SQL preparation failed.", "http_code" => 500]);
}
$stmt->execute([':loan_app_id' => $loanApplicationId]);
$paymentDetails = $stmt->fetch(PDO::FETCH_ASSOC);

$totalPaid = $paymentDetails['total_paid'] ? (float)$paymentDetails['total_paid'] : 0;
$reconstructAmount = $totalLoanWithInterest - $totalPaid;
// -----------------------------------------------------------------


// 4. FINAL CORRECTED SQL INSERT (Including the ID)
$insertSql = "INSERT INTO loan_reconstruct (
                loan_reconstruct_id, 
                loan_application_id, 
                reconstruct_amount, 
                payment_frequency, 
                interest_rate, 
                date_start, 
                duration, 
                date_end, 
                status,
                date_created
              ) VALUES (
                :new_id, 
                :app_id, 
                :amount, 
                :frequency, 
                :rate, 
                :date_start, 
                :duration, 
                :date_end, 
                :status, 
                NOW()
              )"; 

$stmt = $pdo->prepare($insertSql);

if (!$stmt) {
    // In PDO, prepare failures usually throw exceptions if ATTR_ERRMODE is set to EXCEPTION,
    // but checking for robustness is still good.
    send_json_response(["success" => false, "error" => "Insert SQL preparation failed: " . implode(" ", $pdo->errorInfo()), "http_code" => 500]);
}

// Bind parameters and execute
$status = '1'; 
$bindings = [
    ':new_id'       => $newReconstructId,
    ':app_id'       => $loanApplicationId,
    ':amount'       => $reconstructAmount,
    ':frequency'    => $paymentFrequency,
    ':rate'         => $interestRate,
    ':date_start'   => $dateStart,
    ':duration'     => $duration,
    ':date_end'     => $dateEnd,
    ':status'       => $status,
];

try {
    if ($stmt->execute($bindings)) {
        // Return the generated ID
        send_json_response(["success" => true, "message" => "Loan reconstruction saved successfully.", "loan_reconstruct_id" => $newReconstructId]);
    } else {
        // Use errorInfo for detailed PDO error
        $error_message = implode(" ", $stmt->errorInfo());
        send_json_response(["success" => false, "error" => "Database insert failed: " . $error_message, "http_code" => 500]);
    }
} catch (PDOException $e) {
    send_json_response(["success" => false, "error" => "Database insert failed: " . $e->getMessage(), "http_code" => 500]);
}

// PDO connections are automatically closed when the script finishes or the object is unset/out of scope.
?>