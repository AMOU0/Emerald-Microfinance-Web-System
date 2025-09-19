<?php
// PHP/accountsreceivableselectpay_handle.php - CORRECTED
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Get data from POST request
    $client_id = $_POST['client_id'] ?? null;
    $loan_id = $_POST['loan_id'] ?? null;
    $amount = $_POST['amount'] ?? null;
    $processby = $_POST['processby'] ?? 'system';
    $reconstruct_id = $_POST['reconstructID'] ?? 0;

    if (!$client_id || !$loan_id || !$amount || !$processby) {
        echo json_encode(['error' => 'Missing required data']);
        exit;
    }

    $amount = floatval($amount);
    
    $pdo->beginTransaction();

    // Determine the total repayable amount based on whether it's a reconstructed loan or not
    $total_repayable = 0;
    if ($reconstruct_id > 0) {
        $loan_sql = "SELECT reconstruct_amount, interest_rate FROM loan_reconstruct WHERE loan_reconstruct_id = ? AND loan_application_id = ?";
        $stmt = $pdo->prepare($loan_sql);
        $stmt->execute([$reconstruct_id, $loan_id]);
        $loan_data = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($loan_data) {
            $principal = floatval($loan_data['reconstruct_amount']);
            $interest_rate = intval($loan_data['interest_rate']);
            $total_repayable = $principal + ($principal * $interest_rate / 100);
        }
    } else {
        $loan_sql = "SELECT loan_amount, interest_rate FROM loan_applications WHERE loan_application_id = ? AND client_ID = ?";
        $stmt = $pdo->prepare($loan_sql);
        $stmt->execute([$loan_id, $client_id]);
        $loan_data = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($loan_data) {
            $principal = floatval($loan_data['loan_amount']);
            $interest_rate = intval($loan_data['interest_rate']);
            $total_repayable = $principal + ($principal * $interest_rate / 100);
        }
    }
    
    if ($total_repayable == 0) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Loan not found or invalid.']);
        exit;
    }

    // Sum total payments made *before* this payment
    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount_paid), 0) as total_paid FROM payment WHERE loan_application_id = ? AND loan_reconstruct_id = ?");
    $stmt->execute([$loan_id, $reconstruct_id]);
    $total_paid_before = floatval($stmt->fetchColumn());

    $remaining_balance_before = $total_repayable - $total_paid_before;

    // Check if loan is already fully paid
    if ($remaining_balance_before <= 0.01) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Loan is already fully settled.']);
        exit;
    }

    // Validate and adjust payment amount against the remaining loan balance
    $final_payment_amount = min($amount, $remaining_balance_before);

    // Insert payment into the payment table with the reconstruct_id
    $insert_sql = "INSERT INTO payment (loan_reconstruct_id, loan_application_id, client_id, amount_paid, processby) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($insert_sql);
    $stmt->execute([$reconstruct_id, $loan_id, $client_id, $final_payment_amount, $processby]);

    // Check if the loan is now fully paid
    $new_remaining_balance = $remaining_balance_before - $final_payment_amount;

    if ($new_remaining_balance <= 0.01) {
        // If it's a reconstructed loan, update the reconstruct table status
        if ($reconstruct_id > 0) {
            $update_sql = "UPDATE loan_reconstruct SET status = 'fully_paid' WHERE loan_reconstruct_id = ? AND loan_application_id = ?";
            $stmt = $pdo->prepare($update_sql);
            $stmt->execute([$reconstruct_id, $loan_id]);
        }
        
        // Always update the original loan application status
        $update_sql = "UPDATE loan_applications SET status = 'fully_paid' WHERE loan_application_id = ?";
        $stmt = $pdo->prepare($update_sql);
        $stmt->execute([$loan_id]);
        
        $message = 'Payment recorded successfully! Loan is now fully paid.';
    } else {
        $message = 'Payment recorded successfully.';
    }
    
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => $message]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>