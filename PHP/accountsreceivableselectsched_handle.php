<?php
/*PHP/accountsreceivableselectsched_handle.php - FIXED*/
header('Content-Type: application/json');

// Assume your database connection details are included here
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

$response = [];

$client_id = $_GET['client_id'] ?? null;
$loan_id = $_GET['loan_id'] ?? null;
$reconstruct_id = $_GET['reconstructID'] ?? null;

if (!$client_id || !$loan_id) {
    $response['error'] = 'Missing client ID or loan ID.';
    echo json_encode($response);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $loan = null;

    // --- 1. Fetch Loan Details (from reconstruct or original table) ---
    if ($reconstruct_id) {
        $loan_sql = "
            SELECT 
                reconstruct_amount AS loan_amount, interest_rate, payment_frequency, date_start, date_end
            FROM loan_reconstruct 
            WHERE loan_reconstruct_id = ? AND loan_application_id = ?
        ";
        $stmt = $pdo->prepare($loan_sql);
        $stmt->execute([$reconstruct_id, $loan_id]);
        $loan = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$loan) {
            $response['error'] = 'Reconstructed loan not found.';
            echo json_encode($response);
            exit;
        }

    } else {
        $loan_sql = "
            SELECT 
                loan_amount, interest_rate, payment_frequency, date_start, date_end
            FROM loan_applications 
            WHERE loan_application_id = ? AND client_ID = ? AND status = 'approved'
        ";
        $stmt = $pdo->prepare($loan_sql);
        $stmt->execute([$loan_id, $client_id]);
        $loan = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$loan) {
            $response['error'] = 'Loan not found or not approved.';
            echo json_encode($response);
            exit;
        }
    }

    // --- 2. Calculate Loan Parameters (Simple Interest) ---
    $principal = floatval($loan['loan_amount']);
    $interest_rate = intval($loan['interest_rate']); 
    $freq = strtolower($loan['payment_frequency']);
    
    $total_interest = ($principal * $interest_rate) / 100;
    $total_repayment = $principal + $total_interest;

    // Calculate total number of payment periods
    $start_date_obj = new DateTime($loan['date_start']);
    $end_date_obj = new DateTime($loan['date_end']);
    $interval = $start_date_obj->diff($end_date_obj);
    $total_days = (int)$interval->format('%a');

    $freq_days = match ($freq) {
        'weekly' => 7,
        'daily' => 1,
        'monthly' => 30, 
        default => 30, // Fallback
    };
    
    $num_payments = max(1, floor($total_days / $freq_days));
    
    // Installment components are fixed amounts based on total repayment/periods
    $installment_amount = round($total_repayment / $num_payments, 2);
    $installment_interest = round($total_interest / $num_payments, 2);
    $installment_principal = round($principal / $num_payments, 2);

    // --- 3. Fetch Payments Made ---
    $payment_sql = "
        SELECT amount_paid, DATE(date_payed) AS date_payed 
        FROM payment 
        WHERE loan_application_id = ? AND loan_reconstruct_id = ?
        ORDER BY date_payed ASC
    ";
    $stmt = $pdo->prepare($payment_sql);
    $stmt->execute([$loan_id, $reconstruct_id]);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $total_paid = array_sum(array_column($payments, 'amount_paid'));

    // --- 4. Generate Schedule and Apply Payments ---
    $schedule = [];
    $current_due_date = clone $start_date_obj;
    $current_due_date->modify("+$freq_days days");
    
    // MODIFIED: Use a running balance that is decremented for each installment
    $running_balance = $total_repayment; 
    
    // MODIFIED: Track payments applied to each installment individually
    $payments_to_apply = $payments;
    $current_payment_index = 0;

    for ($i = 1; $i <= $num_payments; $i++) {
        $amount_paid_this_period = 0;
        $is_paid = false;
        $date_paid = null;
        $current_installment = $installment_amount;

        // Apply rounding difference to the last installment
        if ($i === $num_payments) {
            $current_installment = $total_repayment - (($num_payments - 1) * $installment_amount);
            $current_installment = round($current_installment, 2);
        }

        // Apply payments from the payments array
        while ($current_payment_index < count($payments_to_apply) && $running_balance > 0) {
            $current_payment = $payments_to_apply[$current_payment_index];
            $amount_from_payment = $current_payment['amount_paid'];
            
            $applied_amount = min($amount_from_payment, $running_balance);
            $amount_paid_this_period += $applied_amount;
            $running_balance -= $applied_amount;
            
            // Mark the date paid if any amount was applied
            if ($applied_amount > 0) {
                $date_paid = $current_payment['date_payed'];
            }
            
            // If the current payment is fully used, move to the next one
            $payments_to_apply[$current_payment_index]['amount_paid'] -= $applied_amount;
            if ($payments_to_apply[$current_payment_index]['amount_paid'] <= 0) {
                $current_payment_index++;
            }
        }
        
        // Determine if the installment is fully paid
        if ($amount_paid_this_period >= $current_installment) {
            $is_paid = true;
        }

        $schedule[] = [
            'due_date' => $current_due_date->format('Y-m-d'),
            'installment_amount' => $current_installment,
            'interest_component' => $installment_interest,
            'amount_paid' => round($amount_paid_this_period, 2),
            'date_paid' => $date_paid,
            'remaining_balance' => round($running_balance, 2),
            'is_paid' => $is_paid
        ];
        
        // Move to the next due date
        $current_due_date->modify("+$freq_days days");
    }

    echo json_encode($schedule);

} catch (PDOException $e) {
    $response['error'] = 'Database error: ' . $e->getMessage();
    echo json_encode($response);
}
?>