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
$processby = $_POST['processby'] ?? 'system';

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
    $stmt = $pdo->prepare("SELECT loan_amount, interest_rate FROM loan_applications WHERE loan_application_id = ? AND client_ID = ?");
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

    // Sum total payments made *before* this payment
    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount_paid),0) as total_paid FROM payment WHERE loan_application_id = ?");
    $stmt->execute([$loan_id]);
    $total_paid_before = floatval($stmt->fetchColumn());

    // Calculate remaining balance before this payment
    $remaining_balance_before = $total_payable - $total_paid_before;

    // 1. Check if loan is already fully paid
    if ($remaining_balance_before <= 0.01) {
        echo json_encode(['error' => 'Loan is already fully settled.']);
        exit;
    }

    // 2. Validate and adjust payment amount against the remaining loan balance
    // This ensures we don't insert a payment larger than the amount required for settlement
    $final_payment_amount = min($payment_amount, $remaining_balance_before);

    // --- BEGIN TRANSACTION ---
    $pdo->beginTransaction();

    // 3. Insert payment
    $stmt = $pdo->prepare("INSERT INTO payment (loan_application_id, client_id, amount_paid, date_payed, processby) VALUES (?, ?, ?, NOW(), ?)");
    $stmt->execute([$loan_id, $client_id, $final_payment_amount, $processby]);

    // 4. Check if the loan is now fully paid
    $new_remaining_balance = $remaining_balance_before - $final_payment_amount;

    if ($new_remaining_balance <= 0.01) { 
        // Update ONLY the 'paid' column to 'fully paid'
        $stmt = $pdo->prepare("UPDATE loan_applications SET paid = '1' WHERE loan_application_id = ?");
        $stmt->execute([$loan_id]);
        
        $message = 'Payment recorded successfully! Loan is now fully paid.';
        
        if ($final_payment_amount < $payment_amount) {
            $message .= ' (Only $' . number_format($final_payment_amount, 2) . ' was applied as the final settlement amount).';
        }

    } else {
        $message = 'Payment recorded successfully.';
    }
    
    $pdo->commit();
    // --- END TRANSACTION ---

    echo json_encode(['success' => true, 'message' => $message]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>