<?php
// PHP/accountsreceivableselectpay_handle.php - FINAL FIX (Handling large IDs)
header('Content-Type: application/json');

// 1. Include the centralized connection file
require_once 'aadb_connect_handler.php';

try {
    $pdo = connectDB();

    // Get data from POST request
    $client_id = $_POST['client_id'] ?? null;
    $loan_id = $_POST['loan_id'] ?? null;
    $amount = $_POST['amount'] ?? null;
    $processby = $_POST['processby'] ?? 'system';
    
    // FIX: Safely handle potentially large reconstructID as a string/number-string.
    $reconstruct_id_post = $_POST['reconstructID'] ?? 0;
    // Only assign if it's a numeric value greater than zero, keeping its original type (string or float/string).
    $reconstruct_id = (is_numeric($reconstruct_id_post) && $reconstruct_id_post > 0) ? $reconstruct_id_post : null; 

    if (!$client_id || !$loan_id || !$amount || !$processby) {
        echo json_encode(['error' => 'Missing required data']);
        exit;
    }

    $amount = floatval($amount);
    
    if ($amount <= 0) {
        echo json_encode(['error' => 'Payment amount must be greater than zero.']);
        exit;
    }

    $pdo->beginTransaction();

    // --- 1. Determine Loan Parameters ---
    $loan_table = ($reconstruct_id > 0) ? 'loan_reconstruct' : 'loan_applications';
    $principal_field = ($reconstruct_id > 0) ? 'reconstruct_amount' : 'loan_amount';
    // Use the ID variable directly for querying
    $target_id_field = ($reconstruct_id > 0) ? 'loan_reconstruct_id' : 'loan_application_id';
    $target_id_value = ($reconstruct_id > 0) ? $reconstruct_id : $loan_id;


    $loan_sql = "SELECT {$principal_field}, interest_rate, status FROM {$loan_table} WHERE {$target_id_field} = ?";
    $stmt = $pdo->prepare($loan_sql);
    $stmt->execute([$target_id_value]);
    $loan_data = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$loan_data) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Loan not found or invalid.']);
        exit;
    }
    
    $principal = floatval($loan_data[$principal_field]);
    $interest_rate = intval($loan_data['interest_rate']);
    $loan_status = $loan_data['status'];

    // CRITICAL: Ensure correct calculation using rounding
    $total_repayable = round($principal + ($principal * $interest_rate / 100), 2); 

    // 2. Sum total payments
    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount_paid), 0) as total_paid 
                            FROM payment 
                            WHERE loan_application_id = ? 
                            AND IFNULL(loan_reconstruct_id, 0) = IFNULL(?, 0)
                            AND client_id = ?");
    // Ensure both $loan_id and $reconstruct_id are passed correctly to SUM query
    $stmt->execute([$loan_id, $reconstruct_id, $client_id]);
    $total_paid_before = round(floatval($stmt->fetchColumn()), 2); 

    $remaining_balance_before = round($total_repayable - $total_paid_before, 2); 

    // Check if loan is already fully paid
    if ($remaining_balance_before <= 0.00 || $loan_status === 'Paid') { 
        $pdo->rollBack();
        
        // Ensure status is 'Paid' (using explicit table names)
        if ($loan_status !== 'Paid') {
             if ($reconstruct_id > 0) {
                // Use $reconstruct_id (string/number-string)
                $pdo->prepare("UPDATE loan_reconstruct SET status = 'Paid' WHERE loan_reconstruct_id = ?")->execute([$reconstruct_id]);
            } else {
                // Use $loan_id (original)
                $pdo->prepare("UPDATE loan_applications SET status = 'Approved', paid = 'Paid' WHERE loan_application_id = ?")->execute([$loan_id]);
            }
        }
        echo json_encode(['error' => 'Loan is already fully settled.']);
        exit;
    }

    // Validate and adjust payment amount
    $final_payment_amount = round(min($amount, $remaining_balance_before), 2); 

    // 3. Insert payment
    $insert_sql = "INSERT INTO payment (loan_reconstruct_id, loan_application_id, client_id, amount_paid, processby) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($insert_sql);
    // Use $reconstruct_id (which is null or the string ID) in the insert
    $stmt->execute([$reconstruct_id, $loan_id, $client_id, $final_payment_amount, $processby]);

    // 4. Check for full settlement and update status
    $new_remaining_balance = round($remaining_balance_before - $final_payment_amount, 2); 

    if ($new_remaining_balance <= 0.00) { 
        // --- SEPARATE LOGIC: Update status to 'Paid' upon settlement (using explicit table names) ---
        if ($reconstruct_id > 0) {
            // Use $reconstruct_id (string/number-string)
            $pdo->prepare("UPDATE loan_reconstruct SET status = 'Paid' WHERE loan_reconstruct_id = ?")->execute([$reconstruct_id]);
            $pdo->prepare("UPDATE loan_applications SET status = 'Approved', paid = 'Paid' WHERE loan_application_id = ?")->execute([$loan_id]);
            $message = 'Payment recorded successfully! Reconstructed Loan is now fully paid.';
        } else {
            // Use $loan_id (original)
            $pdo->prepare("UPDATE loan_applications SET status = 'Approved', paid = 'Paid' WHERE loan_application_id = ?")->execute([$loan_id]);
            $message = 'Payment recorded successfully! Original Loan is now fully paid.';
        }
    } else {
        $message = 'Payment recorded successfully.';
    }
    
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => $message]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Database error: ' . $e->getMessage()); 
    // This detailed message helps diagnose the issue if it still persists
    echo json_encode(['error' => 'An internal error occurred while processing the payment. Details: ' . $e->getMessage()]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('General error: ' . $e->getMessage()); 
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
?>