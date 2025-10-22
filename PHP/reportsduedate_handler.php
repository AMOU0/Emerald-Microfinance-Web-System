<?php
// PHP/reportsduedate_handler.php - FIX: Robust JSON handling with output buffering

error_reporting(0); // Supress all PHP errors/warnings from output
ob_start(); // Start output buffering immediately

// Include the centralized database connection function
// Assuming this file is in the same directory
include_once 'aadb_connect_handler.php'; 

// Function to handle errors and send a JSON response
function sendErrorResponse($message, $e = null) {
    http_response_code(500);
    if ($e) {
        error_log($message . ': ' . $e->getMessage());
    } else {
        error_log($message);
    }
    
    // Clean any prior output caught in the buffer
    ob_clean(); 
    header('Content-Type: application/json');
    echo json_encode(['error' => $message]);
    ob_end_flush();
    exit();
}

try {
    // 1. Database Connection Configuration
    $pdo = connectDB();
} catch (\PDOException $e) {
    sendErrorResponse('DATABASE CONNECTION ERROR: Could not connect to the database.', $e);
}

try {
    // Get filter date from GET request, default to today if not set
    $filterDateStr = $_GET['filter_date'] ?? date('Y-m-d');
    $today = new DateTime($filterDateStr);


    // 2. Core Logic to Calculate Next Due Date and Payment Amount
    function calculatePaymentDetails($pdo, $loan, $today) {
        $loanId = $loan['loan_application_id'];
        $principal = (float)$loan['loan_amount'];
        $interest_rate_decimal = (float)$loan['interest_rate'] / 100.0;
        $frequency = strtolower($loan['payment_frequency']);
        
        $startDate = new DateTime($loan['date_start']);
        $endDate = new DateTime($loan['date_end']);
        
        $total_interest = $principal * $interest_rate_decimal;
        $total_amount_due = $principal + $total_interest;
        
        $intervalSpec = '';
        $periods = 1; 
        $payment_amount = $total_amount_due; 
        $principal_due = $principal;
        $interest_due = $total_interest;
        
        $diff = $startDate->diff($endDate);
        $total_days = $diff->days;
        
        switch ($frequency) {
            case 'monthly': 
                $intervalSpec = 'P1M'; 
                $periods = max(1, round($total_days / 30.44)); 
                break; 
            case 'weekly': 
                $intervalSpec = 'P1W'; 
                $periods = max(1, round($total_days / 7)); 
                break;
            case 'daily': 
                $intervalSpec = 'P1D'; 
                $periods = max(1, $total_days); 
                break;
            default: 
                $nextDueDate = $endDate;
                break;
        }

        if (!empty($intervalSpec) && $periods > 0) {
            $payment_amount = $total_amount_due / $periods;
            $principal_due = $principal / $periods;
            $interest_due = $total_interest / $periods;

            // --- 2.2 Determine the Last Payment Date (LPD) ---
            try {
                $sqlLastPayment = "
                    SELECT 
                        MAX(payment_date) as last_payment_date 
                    FROM 
                        payment 
                    WHERE 
                        loan_application_id = :loan_id
                ";
                $stmt = $pdo->prepare($sqlLastPayment);
                $stmt->execute([':loan_id' => $loanId]);
                $lastPayment = $stmt->fetch();
            } catch (\PDOException $e) {
                error_log("Payment table query failed for loan $loanId: " . $e->getMessage());
                $lastPayment = ['last_payment_date' => null];
            }

            $lastDate = (isset($lastPayment['last_payment_date']) && $lastPayment['last_payment_date']) 
                         ? new DateTime($lastPayment['last_payment_date']) 
                         : $startDate;
            
            // --- 2.3 Find the Next Upcoming Due Date ---
            $interval = new DateInterval($intervalSpec);
            $nextDueDate = clone $startDate;

            // Find the due date *after* the last payment date
            while ($nextDueDate <= $lastDate) {
                $nextDueDate->add($interval);
            }
            
            // Now find the NEXT due date relative to $today (which might be the filter date)
            $currentDue = clone $nextDueDate;

            // Advance the due date until it is >= $today
            while ($currentDue < $today && $currentDue <= $endDate) {
                $currentDue->add($interval);
            }
            
            $nextDueDate = $currentDue;
            
            if ($nextDueDate > $endDate) {
                 $nextDueDate = $endDate; 
            }
        } else {
            $nextDueDate = $endDate;
        }

        // --- 2.4 Determine Status based on $today (Current Date or Filter Date) ---
        $status = 'Upcoming';
        
        // Check if the current due date has passed $today
        if ($nextDueDate < $today && $nextDueDate <= $endDate) {
            $status = 'Overdue';
        } elseif ($nextDueDate->format('Y-m-d') == $today->format('Y-m-d') && $nextDueDate <= $endDate) {
            $status = 'Due Today';
        } 
        
        
        // *** RELAXED FILTER: Only filter loans that are fully past their end date ***
        if ($nextDueDate > $endDate) {
            return null; 
        }
        
        // Return the calculated payment details
        return [
            'due_date' => $nextDueDate->format('Y-m-d'),
            'principal_due' => round($principal_due, 2),
            'interest_due' => round($interest_due, 2),
            'total_payment_due' => round($payment_amount, 2),
            'status' => $status
        ];
    }


    // 3. Main Query and Processing
    $sql = "
        SELECT
            la.loan_application_id,
            la.loan_amount,
            la.payment_frequency,
            la.date_start,
            la.date_end,
            la.interest_rate,
            la.paid, 
            la.colateral, 
            c.client_ID,
            c.first_name,
            c.last_name,
            c.middle_name,
            c.phone_number
        FROM 
            loan_applications la
        JOIN 
            clients c ON la.client_ID = c.client_ID
        WHERE 
            la.status = 'approved' AND la.paid != 'Paid'
    ";

    $stmt = $pdo->query($sql);
    $loans = $stmt->fetchAll();

    $duePayments = [];
    $totalDueToday = 0.00;
    $accountsDueToday = 0;
    $totalOverdueAmount = 0.00;

    foreach ($loans as $loan) {
        $details = calculatePaymentDetails($pdo, $loan, $today);
        
        if ($details !== null) {
            $clientName = trim("{$loan['last_name']}, {$loan['first_name']} {$loan['middle_name']}");
            
            $duePayments[] = [
                'client_name' => $clientName,
                'contact_number' => $loan['phone_number'],
                'loan_id' => $loan['loan_application_id'],
                'colateral' => $loan['colateral'], 
                'due_date' => $details['due_date'],
                'principal_due' => $details['principal_due'],
                'interest_due' => $details['interest_due'],
                'total_payment_due' => $details['total_payment_due'],
                'status' => $details['status']
            ];
            
            if ($details['status'] === 'Due Today') {
                $totalDueToday += $details['total_payment_due'];
                $accountsDueToday++;
            }
            if ($details['status'] === 'Overdue') {
                $totalOverdueAmount += $details['total_payment_due'];
            }
        }
    }

    // 4. Return Data as JSON
    ob_clean(); // Clean the buffer to remove any stray output (e.g., from includes)
    header('Content-Type: application/json');
    echo json_encode([
        'data' => $duePayments,
        'summary' => [
            'totalDueToday' => round($totalDueToday, 2),
            'accountsDueToday' => $accountsDueToday,
            'totalOverdueAmount' => round($totalOverdueAmount, 2)
        ]
    ]);

    ob_end_flush();
    exit();
    
} catch (\Exception $e) {
    // Catch any runtime errors during processing
    sendErrorResponse('An unexpected error occurred while processing the report data.', $e);
}