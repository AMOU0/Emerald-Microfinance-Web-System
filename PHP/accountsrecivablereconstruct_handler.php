<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root"; // Your database username
$password = ""; // Your database password
$dbname = "emerald_microfinance"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Check if a loan_application_id was provided
if (isset($_GET['loan_id'])) {
    $loanId = $_GET['loan_id'];

    // Query to get loan details, including interest_rate
    $loanSql = "SELECT loan_amount, payment_frequency, date_start, duration_of_loan, date_end, interest_rate FROM loan_applications WHERE loan_application_id = ?";
    $stmt = $conn->prepare($loanSql);
    $stmt->bind_param("i", $loanId);
    $stmt->execute();
    $loanResult = $stmt->get_result();
    $loanDetails = $loanResult->fetch_assoc();
    $stmt->close();

    if ($loanDetails) {
        $loanAmount = (float)$loanDetails['loan_amount'];
        $interestRate = (int)$loanDetails['interest_rate'];
        
        // Calculate the total amount of the loan with the interest added
        $totalLoanWithInterest = $loanAmount * (1 + $interestRate / 100);

        // Query to get total payments for the loan
        $paymentSql = "SELECT SUM(amount_paid) AS total_paid FROM payment WHERE loan_application_id = ?";
        $stmt = $conn->prepare($paymentSql);
        $stmt->bind_param("i", $loanId);
        $stmt->execute();
        $paymentResult = $stmt->get_result();
        $paymentDetails = $paymentResult->fetch_assoc();
        $stmt->close();

        $totalPaid = $paymentDetails['total_paid'] ? (float)$paymentDetails['total_paid'] : 0;

        // Calculate the balance as the total loan with interest minus the total payments
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

        echo json_encode($response);
    } else {
        echo json_encode(["error" => "Loan not found"]);
    }
} else {
    echo json_encode(["error" => "No loan ID provided"]);
}

$conn->close();
?>