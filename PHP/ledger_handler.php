<?php
header('Content-Type: application/json');

// Include the centralized database connection handler
require_once 'aadb_connect_handler.php';

// Use PDO connection from aadb_connect_handler.php
$pdo = connectDB();

// 検 REVISED SQL QUERY 検
// This query now uses the effective start date of the loan/reconstruction to filter payments correctly.
$sql = "
-- 1. Find the single latest active loan/reconstruction for each client
WITH LatestActiveLoan AS (
    SELECT
        la.client_ID,
        la.loan_application_id,
        lr.loan_reconstruct_id,
        
        -- Effective Principal: Uses reconstruct_amount if active reconstruction exists
        CASE
            WHEN lr.loan_reconstruct_id IS NOT NULL THEN COALESCE(lr.reconstruct_amount, 0)
            -- Otherwise, use the original loan amount.
            ELSE la.loan_amount
        END AS effective_principal,
        
        -- Effective Interest Rate: Fallback to original rate if reconstructed rate is NULL
        CASE
            WHEN lr.loan_reconstruct_id IS NOT NULL THEN COALESCE(lr.interest_rate, la.interest_rate) 
            -- If it's an original loan (no active reconstruction), use its rate.
            ELSE la.interest_rate
        END AS effective_rate,
        
        -- 庁 FIX 1: Determine the effective start date (Original or Reconstruction date)
        CASE
            WHEN lr.loan_reconstruct_id IS NOT NULL THEN lr.date_start
            ELSE la.date_start
        END AS effective_start_date,
        
        la.payment_frequency,
        (lr.loan_reconstruct_id IS NOT NULL) AS is_reconstructed,
        ROW_NUMBER() OVER (PARTITION BY la.client_ID ORDER BY la.loan_application_id DESC) as rn
    FROM
        loan_applications la
    LEFT JOIN
        -- Include status '1' in the active check
        loan_reconstruct lr ON la.loan_application_id = lr.loan_application_id AND lr.status IN ('active', '1')
    WHERE
        la.status IN ('Approved', 'Released', 'Unpaid') 
        AND (la.paid IS NULL OR la.paid != 'Paid')
)
SELECT
    c.client_ID,
    c.first_name,
    c.middle_name,
    c.last_name,
    c.phone_number,
    
    -- Effective Loan Details
    lal.effective_principal AS principal_loan_amount,
    lal.effective_rate AS applicable_interest_rate,
    lal.effective_start_date AS date_start, -- Use the effective date here
    
    lal.loan_application_id, 
    lal.loan_reconstruct_id, 
    lal.is_reconstructed, 
    lal.payment_frequency,
    
    -- 2. 庁 FIX 2: Calculate total payments made ON or AFTER the effective start date.
    (
        SELECT COALESCE(SUM(p.amount_paid), 0)
        FROM payment p
        WHERE p.client_id = c.client_ID 
        AND p.loan_application_id = lal.loan_application_id 
        -- CRITICAL: Only count payments made after the loan or reconstruction started
        AND p.date_payed >= lal.effective_start_date 
    ) AS total_amount_paid,
    
    -- 3. Get the last payment date based on filtered payments
    (
        SELECT MAX(p.date_payed)
        FROM payment p
        WHERE p.client_id = c.client_ID 
        AND p.loan_application_id = lal.loan_application_id 
        AND p.date_payed >= lal.effective_start_date 
    ) AS last_payment_date
    
FROM
    clients c
LEFT JOIN
    LatestActiveLoan lal ON c.client_ID = lal.client_ID AND lal.rn = 1 
ORDER BY
    c.last_name ASC;
";

$data = [];

try {
    // Execute query using PDO
    $result = $pdo->query($sql);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "SQL query failed: " . $e->getMessage()]);
    exit();
}

if ($result) {
    while($row = $result->fetch(PDO::FETCH_ASSOC)) {
        // Cast values to float for robust math
        $total_principal = (float)($row['principal_loan_amount'] ?? 0);
        $amount_paid = (float)($row['total_amount_paid'] ?? 0);
        $interest_rate = (float)($row['applicable_interest_rate'] ?? 0);
        
        // Calculation: (Principal * (1 + Rate)) - Payments
        // Example: (1000 * (1 + 20/100)) - Post-Reconstruction Payments
        $total_debt = $total_principal * (1 + ($interest_rate / 100));
        $balance = $total_debt - $amount_paid;

        // **FINAL BALANCE LOGIC:** The JS file will filter out zero balances.
        if ($total_principal > 0 && $balance > 0.01) {
            // Active Loan: Display formatted balance
            $row['balance_display'] = "PHP " . number_format($balance, 2);
        } else {
            // Fully Paid, Overpaid, or No Loan: Display the requested status
            $row['balance_display'] = 'PHP 0.00';
            $row['date_start'] = null; 
            $row['payment_frequency'] = null;
        }

        $row['balance'] = $balance; 
        
        // Cleanup columns
        unset($row['principal_loan_amount'], $row['total_amount_paid'], $row['applicable_interest_rate'], $row['loan_application_id'], $row['loan_reconstruct_id'], $row['is_reconstructed']);
        $data[] = $row;
    }
}

echo json_encode($data);
?>