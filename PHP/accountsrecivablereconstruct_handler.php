<?php
// SET ERROR REPORTING FOR DEBUGGING (REMOVE IN PRODUCTION)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

$servername = "localhost";
$username = "root"; // CHECK THIS
$password = ""; // CHECK THIS
$dbname = "emerald_microfinance"; // CHECK THIS

// Function to handle JSON response and exit
function send_json_response($data, $conn = null) {
    if ($conn) $conn->close();
    echo json_encode($data);
    exit();
}

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    send_json_response(["error" => "Connection failed: " . $conn->connect_error]);
}

// Check if a loan_application_id was provided
if (!isset($_GET['loan_id']) || empty($_GET['loan_id'])) {
    send_json_response(["error" => "No loan ID provided"], $conn);
}

$loanId = $_GET['loan_id'];

// --- 1. Query to get loan details, including interest_rate ---
$loanSql = "SELECT loan_amount, payment_frequency, date_start, duration_of_loan, date_end, interest_rate FROM loan_applications WHERE loan_application_id = ?";
$stmt = $conn->prepare($loanSql);

if (!$stmt) {
    send_json_response(["error" => "Loan SQL preparation failed: " . $conn->error], $conn);
}

$stmt->bind_param("i", $loanId);
$stmt->execute();
$loanResult = $stmt->get_result();
$loanDetails = $loanResult->fetch_assoc();
$stmt->close();

if (!$loanDetails) {
    send_json_response(["error" => "Loan not found with ID: " . $loanId], $conn);
}

$loanAmount = (float)$loanDetails['loan_amount'];
$interestRate = (int)$loanDetails['interest_rate'];
$totalLoanWithInterest = $loanAmount * (1 + $interestRate / 100);

// --- 2. Query to get total payments for the loan ---
$paymentSql = "SELECT SUM(amount_paid) AS total_paid FROM payment WHERE loan_application_id = ?";
$stmt = $conn->prepare($paymentSql);

if (!$stmt) {
    send_json_response(["error" => "Payment SQL preparation failed: " . $conn->error], $conn);
}

$stmt->bind_param("i", $loanId);
$stmt->execute();
$paymentResult = $stmt->get_result();
$paymentDetails = $paymentResult->fetch_assoc();
$stmt->close();

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

send_json_response($response, $conn);

// Note: The send_json_response function closes the connection and exits.
?>