<?php
// SET ERROR REPORTING FOR DEBUGGING (REMOVE IN PRODUCTION)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Include the PDO database connection handler
require_once 'aadb_connect_handler.php';

// Function to handle JSON response and exit
function send_json_response($data) {
    echo json_encode($data);
    exit();
}

// Create connection using PDO function from aadb_connect_handler.php
// The connectDB() function handles connection errors and exits on failure.
$pdo = connectDB();

// Check if a loan_application_id was provided
if (!isset($_GET['loan_id']) || empty($_GET['loan_id'])) {
    send_json_response(["error" => "No loan ID provided"]);
}

$loanId = $_GET['loan_id'];

// --- 1. Query to get loan details, including interest_rate ---
$loanSql = "SELECT loan_amount, payment_frequency, date_start, duration_of_loan, date_end, interest_rate FROM loan_applications WHERE loan_application_id = :loan_id";
$stmt = $pdo->prepare($loanSql);

if (!$stmt) {
    send_json_response(["error" => "Loan SQL preparation failed."]);
}

try {
    $stmt->execute([':loan_id' => $loanId]);
    $loanDetails = $stmt->fetch();
} catch (\PDOException $e) {
    error_log("Loan Details Query Error: " . $e->getMessage());
    send_json_response(["error" => "An error occurred while fetching loan details."]);
}

if (!$loanDetails) {
    send_json_response(["error" => "Loan not found with ID: " . $loanId]);
}

$loanAmount = (float)$loanDetails['loan_amount'];
$interestRate = (int)$loanDetails['interest_rate'];
$totalLoanWithInterest = $loanAmount * (1 + $interestRate / 100);

// --- 2. Query to get total payments for the loan ---
$paymentSql = "SELECT SUM(amount_paid) AS total_paid FROM payment WHERE loan_application_id = :loan_id";
$stmt = $pdo->prepare($paymentSql);

if (!$stmt) {
    send_json_response(["error" => "Payment SQL preparation failed."]);
}

try {
    $stmt->execute([':loan_id' => $loanId]);
    $paymentDetails = $stmt->fetch();
} catch (\PDOException $e) {
    error_log("Payment Query Error: " . $e->getMessage());
    send_json_response(["error" => "An error occurred while fetching payment details."]);
}

$totalPaid = $paymentDetails['total_paid'] ? (float)$paymentDetails['total_paid'] : 0;

// --- 3. Calculate the balance ---
$balance = $totalLoanWithInterest - $totalPaid;

// Prepare the final response
$response = [
    "loan_amount_with_interest" => number_format($totalLoanWithInterest, 2, '.', ''),
    "payment_frequency" => $loanDetails['payment_frequency'],
    "date_start" => $loanDetails['date_start'],
    "duration_of_loan" => $loanDetails['duration_of_loan'],
    "date_end" => $loanDetails['date_end'],
    "balance" => number_format($balance, 2, '.', '')
];

send_json_response($response);
?>