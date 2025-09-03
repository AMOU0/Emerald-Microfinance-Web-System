<?php
// PHP/accountsreceivableselectpay_handle.php
header('Content-Type: application/json');
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

$client_id = $_POST['client_id'] ?? null;
$loan_id = $_POST['loan_id'] ?? null;
$payment_amount = $_POST['amount'] ?? null;

if (!$client_id || !$loan_id || !$payment_amount) {
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

$payment_amount = floatval($payment_amount);
if ($payment_amount <= 0) {
    echo json_encode(['error' => 'Invalid payment amount']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Fetch loan info
    $stmt = $pdo->prepare("SELECT * FROM loan_applications WHERE loan_application_id = ? AND client_ID = ?");
    $stmt->execute([$loan_id, $client_id]);
    $loan = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$loan) {
        echo json_encode(['error' => 'Loan not found']);
        exit;
    }

    // Calculate total payable and installment amount
    $principal = floatval($loan['loan_amount']);
    $interest_rate = intval($loan['interest_rate']);
    $interest_amount = ($principal * $interest_rate) / 100;
    $total_payable = $principal + $interest_amount;

    $freq = strtolower($loan['payment_frequency']);
    $freq_days = 30;
    if ($freq === 'weekly') $freq_days = 7;
    else if ($freq === 'daily') $freq_days = 1;

    $start_date = new DateTime($loan['date_start']);
    $end_date = new DateTime($loan['date_end']);
    $interval = $start_date->diff($end_date);
    $total_days = (int)$interval->format('%a');
    $num_payments = max(1, floor($total_days / $freq_days));

    $installment_amount = round($total_payable / $num_payments, 2);

    // Sum total payments made
    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount_paid),0) as total_paid FROM payment WHERE loan_application_id = ?");
    $stmt->execute([$loan_id]);
    $total_paid = floatval($stmt->fetchColumn());

    // Calculate current installment and remaining due
    $current_installment = floor($total_paid / $installment_amount) + 1;
    if ($current_installment > $num_payments) {
        $current_installment = $num_payments;
    }
    $paid_in_current = $total_paid % $installment_amount;
    $current_due_amount = $installment_amount - $paid_in_current;
    if ($current_due_amount < 0) $current_due_amount = 0;

    // Validate payment amount does not exceed current due
    if ($payment_amount > $current_due_amount) {
        echo json_encode(['error' => 'Payment exceeds current installment due amount']);
        exit;
    }

    // Insert payment (no installment number stored)
    $stmt = $pdo->prepare("INSERT INTO payment (loan_application_id, client_id, amount_paid, date_payed, processby) VALUES (?, ?, ?, NOW(), ?)");
    $stmt->execute([$loan_id, $client_id, $payment_amount, 'system']);

    echo json_encode(['success' => true, 'message' => 'Payment recorded']);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}