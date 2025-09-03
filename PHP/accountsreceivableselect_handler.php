<?php
// PHP/accountsreceivableselect_handler.php
header('Content-Type: application/json');
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

$client_id = $_GET['client_id'] ?? null;
$loan_id = $_GET['loan_id'] ?? null;

if (!$client_id || !$loan_id) {
    echo json_encode(['error' => 'Missing client_id or loan_id']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Fetch client info
    $stmt = $pdo->prepare("SELECT client_ID, CONCAT(last_name, ', ', first_name) AS name FROM clients WHERE client_ID = ?");
    $stmt->execute([$client_id]);
    $client = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$client) {
        echo json_encode(['error' => 'Client not found']);
        exit;
    }

    // Fetch loan info
    $stmt = $pdo->prepare("SELECT * FROM loan_applications WHERE loan_application_id = ? AND client_ID = ?");
    $stmt->execute([$loan_id, $client_id]);
    $loan = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$loan) {
        echo json_encode(['error' => 'Loan not found']);
        exit;
    }

    // Calculate total payable
    $principal = floatval($loan['loan_amount']);
    $interest_rate = intval($loan['interest_rate']);
    $interest_amount = ($principal * $interest_rate) / 100;
    $total_payable = $principal + $interest_amount;

    // Determine payment frequency days
    $freq = strtolower($loan['payment_frequency']);
    $freq_days = 30;
    if ($freq === 'weekly') $freq_days = 7;
    else if ($freq === 'daily') $freq_days = 1;

    // Calculate number of payments
    $start_date = new DateTime($loan['date_start']);
    $end_date = new DateTime($loan['date_end']);
    $interval = $start_date->diff($end_date);
    $total_days = (int)$interval->format('%a');
    $num_payments = max(1, floor($total_days / $freq_days));

    // Fixed installment amount
    $installment_amount = round($total_payable / $num_payments, 2);

    // Sum total payments made
    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount_paid),0) as total_paid FROM payment WHERE loan_application_id = ?");
    $stmt->execute([$loan_id]);
    $total_paid = floatval($stmt->fetchColumn());

    // Calculate current installment number (1-based)
    $current_installment = floor($total_paid / $installment_amount) + 1;
    if ($current_installment > $num_payments) {
        $current_installment = $num_payments; // all paid
    }

    // Calculate remaining due on current installment
    $paid_in_current = $total_paid % $installment_amount;
    $current_due_amount = $installment_amount - $paid_in_current;
    if ($current_due_amount < 0) $current_due_amount = 0;

    // Calculate balance remaining
    $balance = $total_payable - $total_paid;
    if ($balance < 0) $balance = 0;

    // Calculate due dates
    $current_due_date = clone $start_date;
    $current_due_date->modify('+'.($freq_days * ($current_installment - 1)).' days');
    $next_due_date = clone $current_due_date;
    $next_due_date->modify("+$freq_days days");

    echo json_encode([
        'client' => $client,
        'loan' => [
            'id' => $loan['loan_application_id'],
            'balance' => $balance,
            'amount_to_pay' => $current_due_amount,
            'current_due' => $current_due_date->format('Y-m-d'),
            'next_due' => $next_due_date->format('Y-m-d'),
            'interest_rate' => $interest_rate,
            'payment_frequency' => $loan['payment_frequency'],
            'start_date' => $loan['date_start'],
            'end_date' => $loan['date_end'],
            'principal' => $principal,
            'total_payable' => $total_payable,
            'num_payments' => $num_payments,
            'freq_days' => $freq_days,
            'current_installment' => $current_installment,
            'installment_amount' => $installment_amount
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
