<?php
header('Content-Type: application/json');

// Include the centralized database connection handler
require_once 'aadb_connect_handler.php';

// Use PDO connection from aadb_connect_handler.php
$pdo = connectDB();

// 🌟 REVISED SQL QUERY 🌟
// This query uses a Common Table Expression (CTE) to find the single latest active loan 
// or reconstruction for each client, and then uses correlated subqueries to calculate payments 
// based on the strict ID-linking rule.
$sql = "
-- 1. Find the single latest active loan/reconstruction for each client
WITH LatestActiveLoan AS (
    SELECT
        la.client_ID,
        la.loan_application_id,
        lr.loan_reconstruct_id,
        -- Effective Principal: Use reconstructed amount if active, otherwise use original loan amount
        COALESCE(lr.reconstruct_amount, la.loan_amount) AS effective_principal,
        COALESCE(lr.interest_rate, la.interest_rate) AS effective_rate,
        la.date_start,
        la.payment_frequency,
        -- Flag to identify if the effective loan is a reconstruction
        (lr.loan_reconstruct_id IS NOT NULL) AS is_reconstructed,
        -- Use ROW_NUMBER to rank and select only the single latest loan per client
        ROW_NUMBER() OVER (PARTITION BY la.client_ID ORDER BY la.loan_application_id DESC) as rn
    FROM
        loan_applications la
    LEFT JOIN
        -- Only consider 'active' reconstructions
        loan_reconstruct lr ON la.loan_application_id = lr.loan_application_id AND lr.status = 'active'
    WHERE
        -- 💡 UPDATED STATUS CHECK: Only include actively managed applications
        la.status IN ('Approved', 'Released', 'Unpaid') 
        -- 💡 CRITICAL FIX: Explicitly exclude any loan application marked as 'Paid'
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
    lal.loan_application_id, -- Used for payment filtering
    lal.loan_reconstruct_id, -- Used for payment filtering
    lal.is_reconstructed, -- Used for payment filtering
    lal.date_start,
    lal.payment_frequency,
    
    -- 2. CRITICAL SUBQUERY: Calculate total payments based on the strict ID-linking rule
    (
        SELECT COALESCE(SUM(p.amount_paid), 0)
        FROM payment p
        WHERE p.client_id = c.client_ID 
        AND p.loan_application_id = lal.loan_application_id 
        AND (
            -- RULE 1: If Reconstructed, only count payments linked to the RECONSTRUCTION ID
            (lal.is_reconstructed = 1 AND p.loan_reconstruct_id = lal.loan_reconstruct_id)
            -- RULE 2: If NOT Reconstructed, only count payments NOT linked to any reconstruction ID
            OR (lal.is_reconstructed = 0 AND p.loan_reconstruct_id IS NULL)
        )
    ) AS total_amount_paid,
    
    -- 3. Get the last payment date based on the *effective* payments
    (
        SELECT MAX(p.date_payed)
        FROM payment p
        WHERE p.client_id = c.client_ID 
        AND p.loan_application_id = lal.loan_application_id 
        AND (
            (lal.is_reconstructed = 1 AND p.loan_reconstruct_id = lal.loan_reconstruct_id)
            OR (lal.is_reconstructed = 0 AND p.loan_reconstruct_id IS NULL)
        )
    ) AS last_payment_date
    
FROM
    clients c
LEFT JOIN
    LatestActiveLoan lal ON c.client_ID = lal.client_ID AND lal.rn = 1 -- Only join the single latest active loan
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
        $total_principal = $row['principal_loan_amount'] ?? 0;
        $amount_paid = $row['total_amount_paid'] ?? 0;
        $interest_rate = $row['applicable_interest_rate'] ?? 0;
        
        // Calculation: (Principal * (1 + Rate)) - Payments
        // Formula: (Effective Principal * (1 + Effective Rate/100)) - Total Payments
        $total_debt = $total_principal * (1 + ($interest_rate / 100));
        $balance = $total_debt - $amount_paid;

        // **FINAL BALANCE LOGIC:** The JS file will filter out zero balances.
        if ($total_principal > 0 && $balance > 0.01) {
            // Active Loan: Display formatted balance
            $row['balance_display'] = "PHP " . number_format($balance, 2);
        } else {
            // Fully Paid, Overpaid, or No Loan: Display the requested status
            $row['balance_display'] = 'PHP 0.00';
            $row['date_start'] = null; // Clear date_start if no active balance
            $row['payment_frequency'] = null;
        }

        $row['balance'] = $balance; // Raw balance for JS logic
        
        // Cleanup columns
        unset($row['principal_loan_amount'], $row['total_amount_paid'], $row['applicable_interest_rate'], $row['loan_application_id'], $row['loan_reconstruct_id'], $row['is_reconstructed']);
        $data[] = $row;
    }
}

echo json_encode($data);
?>