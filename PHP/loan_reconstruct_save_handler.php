<?php
// CRITICAL: Keep error display on until successfully tested
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// --- Database Configuration (Verify these) ---
$servername = "localhost";
$username = "root"; 
$password = ""; 
$dbname = "emerald_microfinance"; 
// ----------------------------------------------

function send_json_response($data, $conn = null) {
    if ($conn && $conn->ping()) { 
        $conn->close();
    }
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

$conn = @new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    send_json_response(["success" => false, "error" => "Database connection failed. Please check credentials.", "db_error" => $conn->connect_error, "http_code" => 503]);
}

// 1. Validate and Sanitize POST data
$required_fields = ['loanID', 'payment_frequency', 'date_start', 'duration_of_loan', 'date_end'];
foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        send_json_response(["success" => false, "error" => "Missing required field: {$field}", "http_code" => 400], $conn);
    }
}

// Sanitize and get input values
$loanApplicationId = $conn->real_escape_string($_POST['loanID']); 
$paymentFrequency = $conn->real_escape_string($_POST['payment_frequency']);
$dateStart = $conn->real_escape_string($_POST['date_start']);
$duration = $conn->real_escape_string($_POST['duration_of_loan']); 
$dateEnd = $conn->real_escape_string($_POST['date_end']);

// --- 2. Generate new loan_reconstruct_id (e.g., 100001mmyyyy) ---
$currentSuffix = date('mY'); 
$newReconstructId = '';

// Query to find the last ID created this month, ensuring it starts with '1' and ends with the suffix
$idQuerySql = "SELECT loan_reconstruct_id FROM loan_reconstruct 
               WHERE loan_reconstruct_id LIKE CONCAT('1%', ?) 
               ORDER BY loan_reconstruct_id DESC LIMIT 1";

$stmt = $conn->prepare($idQuerySql);
$stmt->bind_param("s", $currentSuffix);
$stmt->execute();
$result = $stmt->get_result();
$lastId = $result->fetch_assoc();
$stmt->close();

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
// ... (The loan details and payment calculation logic is unchanged and assumes 'loan_applications' and 'payment' tables exist) ...
$loanSql = "SELECT loan_amount, interest_rate FROM loan_applications WHERE loan_application_id = ?";
$stmt = $conn->prepare($loanSql);
if (!$stmt) {
    send_json_response(["success" => false, "error" => "Loan detail SQL preparation failed: " . $conn->error, "http_code" => 500], $conn);
}
$stmt->bind_param("s", $loanApplicationId);
$stmt->execute();
$loanResult = $stmt->get_result();
$loanDetails = $loanResult->fetch_assoc();
$stmt->close();

if (!$loanDetails) {
    send_json_response(["success" => false, "error" => "Loan not found.", "http_code" => 404], $conn);
}

// Calculate the reconstruct_amount (balance)
$loanAmount = (float)$loanDetails['loan_amount'];
$interestRate = (int)$loanDetails['interest_rate'];
$totalLoanWithInterest = $loanAmount * (1 + $interestRate / 100);

$paymentSql = "SELECT SUM(amount_paid) AS total_paid FROM payment WHERE loan_application_id = ?";
$stmt = $conn->prepare($paymentSql);
if (!$stmt) {
    send_json_response(["success" => false, "error" => "Payment SQL preparation failed: " . $conn->error, "http_code" => 500], $conn);
}
$stmt->bind_param("s", $loanApplicationId);
$stmt->execute();
$paymentResult = $stmt->get_result();
$paymentDetails = $paymentResult->fetch_assoc();
$stmt->close();

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
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"; 

$stmt = $conn->prepare($insertSql);

if (!$stmt) {
    send_json_response(["success" => false, "error" => "Insert SQL preparation failed: " . $conn->error, "http_code" => 500], $conn);
}

// Bind parameters: (s)ID, (s)AppID, (d)Amount, (s)Freq, (i)Rate, (s)DateStart, (s)Duration, (s)DateEnd, (s)Status
$status = '1'; 
$stmt->bind_param(
    "ssdsissss", 
    $newReconstructId,      // 1. loan_reconstruct_id (s)
    $loanApplicationId,     // 2. loan_application_id (s)
    $reconstructAmount,     // 3. reconstruct_amount (d)
    $paymentFrequency,      // 4. payment_frequency (s)
    $interestRate,          // 5. interest_rate (i)
    $dateStart,             // 6. date_start (s)
    $duration,              // 7. duration (s)
    $dateEnd,               // 8. date_end (s)
    $status                 // 9. status (s)
);

if ($stmt->execute()) {
    // Return the generated ID
    send_json_response(["success" => true, "message" => "Loan reconstruction saved successfully.", "loan_reconstruct_id" => $newReconstructId]);
} else {
    $error_message = $stmt->error;
    $stmt->close();
    send_json_response(["success" => false, "error" => "Database insert failed: " . $error_message, "http_code" => 500], $conn);
}
?>