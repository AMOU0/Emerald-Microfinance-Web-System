<?php
// PHP/accountsreceivableselectpay_handle.php - FIXED
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
    
    // FIX: Set reconstruct_id to NULL if it's missing or 0.
    // This allows payments for non-reconstructed loans to succeed without violating the foreign key constraint.
    $reconstruct_id_post = $_POST['reconstructID'] ?? 0;
    $reconstruct_id = ($reconstruct_id_post > 0) ? intval($reconstruct_id_post) : null; 

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

    // 1. Determine the Principal and Interest Rate of the *active* loan record
    $loan_table = ($reconstruct_id > 0) ? 'loan_reconstruct' : 'loan_applications';
    $loan_id_field = ($reconstruct_id > 0) ? 'loan_reconstruct_id' : 'loan_application_id';
    $principal_field = ($reconstruct_id > 0) ? 'reconstruct_amount' : 'loan_amount';

    // The original loan_sql only worked for loan_applications OR when reconstruct_id > 0.
    // We adjust the query for loan_reconstruct to use the correct ID for the WHERE clause.
    if ($reconstruct_id > 0) {
        $loan_sql = "SELECT {$principal_field}, interest_rate, status FROM {$loan_table} WHERE {$loan_id_field} = ?";
        $params = [$reconstruct_id];
    } else {
        $loan_sql = "SELECT {$principal_field}, interest_rate, status FROM {$loan_table} WHERE loan_application_id = ?";
        $params = [$loan_id];
    }


    // Crucial Check: Ensure the original loan hasn't been reconstructed
    // This check applies ONLY when paying the original loan (reconstruct_id is null/0)
    if (!$reconstruct_id) {
        $check_reconstruct = $pdo->prepare("SELECT COUNT(*) FROM loan_reconstruct WHERE loan_application_id = ? AND status != 'approved'");
        $check_reconstruct->execute([$loan_id]);
        if ($check_reconstruct->fetchColumn() > 0) {
             // This prevents paying the original loan when an active reconstruction exists
            $pdo->rollBack();
            echo json_encode(['error' => 'An active loan reconstruction exists. Payment must be applied to the reconstructed loan.']);
            exit;
        }
    }


    $stmt = $pdo->prepare($loan_sql);
    $stmt->execute($params);
    $loan_data = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$loan_data) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Loan not found or invalid.']);
        exit;
    }
    
    $principal = floatval($loan_data[$principal_field]);
    $interest_rate = intval($loan_data['interest_rate']);
    $loan_status = $loan_data['status'];
    
    // Calculate total repayable amount (Principal + Simple Interest)
    $total_repayable = $principal + ($principal * $interest_rate / 100);

    // 2. Sum total payments made against this specific loan/reconstruction
    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount_paid), 0) as total_paid 
                            FROM payment 
                            WHERE loan_application_id = ? 
                            AND IFNULL(loan_reconstruct_id, 0) = IFNULL(?, 0) -- Compare NULLs correctly
                            AND client_id = ?");
    // Use $reconstruct_id (which is either int or null) in the execute
    $stmt->execute([$loan_id, $reconstruct_id, $client_id]);
    $total_paid_before = floatval($stmt->fetchColumn());

    $remaining_balance_before = $total_repayable - $total_paid_before;

    // Check if loan is already fully paid
    if ($remaining_balance_before <= 0) {
        $pdo->rollBack();
        // Update the status if it wasn't marked as fully paid already due to prior logic errors
        if ($loan_status !== 'approved') {
            $update_sql = "UPDATE {$loan_table} SET status = 'approved', paid = 'Paid' WHERE {$loan_id_field} = ?";
            if ($reconstruct_id > 0) {
                $pdo->prepare($update_sql)->execute([$reconstruct_id]);
            } else {
                // If it's the main loan, we use loan_application_id
                $pdo->prepare($update_sql)->execute([$loan_id]);
            }
        }
        echo json_encode(['error' => 'Loan is already fully settled.']);
        exit;
    }

    // Validate and adjust payment amount against the remaining loan balance (prevents overpayment)
    $final_payment_amount = min($amount, $remaining_balance_before);

    // 3. Insert payment into the payment table
    // $reconstruct_id will be NULL for non-reconstructed loans, which is correctly handled by PDO.
    $insert_sql = "INSERT INTO payment (loan_reconstruct_id, loan_application_id, client_id, amount_paid, processby) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($insert_sql);
    $stmt->execute([$reconstruct_id, $loan_id, $client_id, $final_payment_amount, $processby]);

    // 4. Check if the loan is now fully paid
    $new_remaining_balance = $remaining_balance_before - $final_payment_amount;

    if ($new_remaining_balance <= 0) {
        $update_sql = "UPDATE {$loan_table} SET status = 'approved', paid = 'Paid' WHERE {$loan_id_field} = ?";
        
        if ($reconstruct_id > 0) {
            $pdo->prepare($update_sql)->execute([$reconstruct_id]);
        } else {
            $pdo->prepare($update_sql)->execute([$loan_id]);
        }

        $message = 'Payment recorded successfully! Loan is now fully paid.';
    } else {
        $message = 'Payment recorded successfully.';
    }
    
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => $message]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Database error: ' . $e->getMessage()); // Log error for debugging
    echo json_encode(['error' => 'An internal error occurred while processing the payment.']);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('General error: ' . $e->getMessage()); // Log general error
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
?>