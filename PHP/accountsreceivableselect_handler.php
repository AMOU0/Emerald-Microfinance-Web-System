<?php
// PHP/accountsreceivableselect_handler.php - CORRECTED
header('Content-Type: application/json');

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
    
    // Fetch client details
    $client_sql = "SELECT client_ID, CONCAT(last_name, ', ', first_name, ' ', middle_name) AS name FROM clients WHERE client_ID = ?";
    $stmt = $pdo->prepare($client_sql);
    $stmt->execute([$client_id]);
    $client_data = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$client_data) {
        $response['error'] = 'Client not found.';
        echo json_encode($response);
        exit;
    }

    // Fetch loan details based on reconstructID
    $loan_data = null;
    $total_repayable = 0;
    
    if ($reconstruct_id) {
        // Get loan data from the loan_reconstruct table
        $loan_sql = "
            SELECT 
                loan_reconstruct_id as id,
                reconstruct_amount as loan_amount, 
                interest_rate, 
                payment_frequency, 
                date_start, 
                date_end
            FROM loan_reconstruct 
            WHERE loan_reconstruct_id = ? AND loan_application_id = ?
        ";
        $stmt = $pdo->prepare($loan_sql);
        $stmt->execute([$reconstruct_id, $loan_id]);
        $loan_data = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        // Get loan data from the loan_applications table
        $loan_sql = "
            SELECT 
                loan_application_id as id,
                loan_amount, 
                interest_rate, 
                payment_frequency, 
                date_start, 
                date_end
            FROM loan_applications 
            WHERE loan_application_id = ? AND client_ID = ? AND status = 'approved'
        ";
        $stmt = $pdo->prepare($loan_sql);
        $stmt->execute([$loan_id, $client_id]);
        $loan_data = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$loan_data) {
        $response['error'] = 'Loan or Reconstructed Loan not found or not approved.';
        echo json_encode($response);
        exit;
    }

    $principal = floatval($loan_data['loan_amount']);
    $interest_rate = intval($loan_data['interest_rate']);
    $total_repayable = $principal + ($principal * $interest_rate / 100);

    // Fetch total payments made for this loan, considering if it's a reconstructed loan
    $payment_sql = "SELECT IFNULL(SUM(amount_paid), 0) FROM payment WHERE loan_application_id = ?";
    $params = [$loan_id];
    if ($reconstruct_id) {
        $payment_sql .= " AND loan_reconstruct_id = ?";
        $params[] = $reconstruct_id;
    }
    
    $stmt = $pdo->prepare($payment_sql);
    $stmt->execute($params);
    $total_paid = floatval($stmt->fetchColumn());
    
    // Calculate the current balance
    $current_balance = $total_repayable - $total_paid;

    // Determine the next due date and installment amount
    $freq = strtolower($loan_data['payment_frequency']);
    $start_date_obj = new DateTime($loan_data['date_start']);
    $end_date_obj = new DateTime($loan_data['date_end']);
    $interval = $start_date_obj->diff($end_date_obj);
    $total_days = (int)$interval->format('%a');

    $freq_days = match ($freq) {
        'weekly' => 7,
        'daily' => 1,
        'monthly' => 30, 
        default => 30,
    };
    
    $num_payments = max(1, floor($total_days / $freq_days));
    $installment_amount = round($total_repayable / $num_payments, 2);

    $current_due = 'N/A';
    $next_due = 'N/A';
    $amount_to_pay = 0;

    if ($current_balance > 0) {
        // Calculate the next due date
        $now = new DateTime();
        $due_date_obj = clone $start_date_obj;
        $due_date_obj->modify("+$freq_days days");

        while ($due_date_obj < $now) {
            $due_date_obj->modify("+$freq_days days");
        }
        
        $current_due = $due_date_obj->format('Y-m-d');
        $amount_to_pay = $installment_amount;

        // Calculate the next one
        $next_due_obj = clone $due_date_obj;
        $next_due_obj->modify("+$freq_days days");
        $next_due = $next_due_obj->format('Y-m-d');
    }
    
    // Prepare the final response
    $response['client'] = [
        'client_ID' => $client_data['client_ID'],
        'name' => $client_data['name']
    ];
    $response['loan'] = [
        'id' => $loan_data['id'],
        'balance' => $current_balance,
        'amount_to_pay' => $amount_to_pay,
        'current_due' => $current_due,
        'next_due' => $next_due
    ];
    
    echo json_encode($response);

} catch (PDOException $e) {
    $response['error'] = 'Database error: ' . $e->getMessage();
    echo json_encode($response);
}
?>