<?php
/*PHP\accountsreceivableselectsched_handle.php - FIXED*/
header('Content-Type: application/json');

// Assume your database connection details are included here
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

$response = [];

$client_id = $_GET['client_id'] ?? null;
$loan_id = $_GET['loan_id'] ?? null;

if (!$client_id || !$loan_id) {
    $response['error'] = 'Missing client ID or loan ID.';
    echo json_encode($response);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    // --- 1. Fetch Loan Details ---
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

    // FIX: Recalculate Total Repayment based on rounded installments to ensure accuracy
    // The last installment will adjust for any rounding difference.
    $calculated_repayment_sum = $installment_amount * $num_payments;


    // --- 3. Fetch Payments Made ---
    $payment_sql = "
        SELECT amount_paid, DATE(date_payed) AS date_payed 
        FROM payment 
        WHERE loan_application_id = ? 
        ORDER BY date_payed ASC
    ";
    $stmt = $pdo->prepare($payment_sql);
    $stmt->execute([$loan_id]);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $total_paid = array_sum(array_column($payments, 'amount_paid'));

    // Find the latest payment date
    $latest_payment_date = !empty($payments) ? end($payments)['date_payed'] : null;


    // --- 4. Generate Schedule and Apply Payments ---
    $schedule = [];
    $current_due_date = clone $start_date_obj;
    $current_due_date->modify("+$freq_days days"); // Start date is usually the day after disbursement or the first period
    
    // Track total amount paid remaining to be applied to installments
    $total_paid_remaining = $total_paid; 
    
    // The balance starts as the total repayment amount
    $running_balance = $total_repayment; 

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

        // Determine paid status based on `total_paid_remaining`
        if ($total_paid_remaining >= $current_installment) {
            // Fully paid
            $amount_paid_this_period = $current_installment;
            $total_paid_remaining -= $current_installment;
            $is_paid = true;
            $date_paid = $latest_payment_date; 
            
        } else if ($total_paid_remaining > 0) {
            // Partially paid (This applies the remaining balance to the current installment)
            $amount_paid_this_period = $total_paid_remaining;
            $total_paid_remaining = 0;
            $is_paid = false; // Mark as partially paid
            $date_paid = $latest_payment_date; 
        }

        // FIX: The running balance is the total repayment minus the total amount paid
        $running_balance = $total_repayment - ($total_paid - $total_paid_remaining);
        $running_balance = max(0, round($running_balance, 2));


        $schedule[] = [
            'due_date' => $current_due_date->format('Y-m-d'),
            'installment_amount' => $current_installment,
            'interest_component' => $installment_interest, // Interest component remains fixed
            'amount_paid' => round($amount_paid_this_period, 2),
            'date_paid' => $date_paid,
            'remaining_balance' => $running_balance,
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