<?php
// ledgersviewschedule_handler.php

// Include the centralized database connection handler
require_once 'aadb_connect_handler.php';

// 🛑 IMPORTANT: The URL parameter 'clientId' is used to find ALL loans for that client.
$client_id = isset($_GET['clientId']) ? $_GET['clientId'] : null;

// Ensure a client ID is provided
if (empty($client_id)) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Client ID is required in the query parameter \'clientId\'.']);
    exit;
}

// Use PDO connection from aadb_connect_handler.php
try {
    $pdo = connectDB();
} catch (\PDOException $e) {
    // connectDB already handles error response, but we re-exit just in case
    exit;
}

// 🛑 CORRECTED SQL QUERY: Total Paid and Remaining Balance are now conditional
$sql = "
SELECT
    c.client_ID AS `Client ID`,
    CONCAT(c.first_name, ' ', c.middle_name, ' ', c.last_name) AS `Client Name`,
    la.loan_application_id AS `Loan ID`,
    (la.loan_amount * (1 + la.interest_rate / 100)) AS `Amount (w/ Interest)`,

    -- 1. Total Paid: Conditional based on whether a reconstruction is present.
    -- Uses the total payments for the latest reconstruction, or the total payments for the original loan.
    COALESCE(
        lrb.TotalReconPayments,
        COALESCE(SUM(p_orig.amount_paid), 0.00)
    ) AS `Total Paid`,

    -- 2. Remaining Balance: Prioritize Recon Balance if available, otherwise Original Balance
    COALESCE(
        lrb.RemainingReconBalance,
        (la.loan_amount * (1 + la.interest_rate / 100)) - COALESCE(SUM(p_orig.amount_paid), 0.00)
    ) AS `Remaining Balance`,

    CONCAT(la.duration_of_loan, ' (', la.payment_frequency, ')') AS `Term (Duration / Freq.)`,
    la.date_start AS `Start Date`,
    la.date_end AS `End Date`
FROM
    loan_applications la
JOIN
    clients c ON la.client_ID = c.client_ID
-- p_orig is used for Total Paid (Original) fallback and Original Remaining Balance calculation
LEFT JOIN
    payment p_orig ON la.loan_application_id = p_orig.loan_application_id AND p_orig.loan_reconstruct_id IS NULL
LEFT JOIN
    (
        -- Derived Table: Calculates the Remaining Balance AND Total Payments for the LATEST Reconstruction per Loan
        SELECT
            lr.loan_application_id,
            -- Remaining Recon Balance: (Recon Amount + Interest) - Total Payments for this Recon ID
            (lr.reconstruct_amount * (1 + lr.interest_rate / 100)) - COALESCE(SUM(rp.amount_paid), 0.00) AS RemainingReconBalance,
            COALESCE(SUM(rp.amount_paid), 0.00) AS TotalReconPayments -- Sum of payments for this specific reconstruction
        FROM
            loan_reconstruct lr
        LEFT JOIN
            payment rp ON lr.loan_reconstruct_id = rp.loan_reconstruct_id
        WHERE
            -- Find the latest loan_reconstruct_id for this loan_application_id
            lr.loan_reconstruct_id = (
                SELECT lr2.loan_reconstruct_id
                FROM loan_reconstruct lr2
                WHERE lr2.loan_application_id = lr.loan_application_id
                ORDER BY lr2.date_created DESC
                LIMIT 1
            )
        GROUP BY
            lr.loan_application_id, lr.reconstruct_amount, lr.interest_rate
    ) AS lrb ON la.loan_application_id = lrb.loan_application_id
WHERE
    la.client_ID = ?
GROUP BY
    la.loan_application_id, la.loan_amount, la.interest_rate, la.duration_of_loan, la.payment_frequency, la.date_start, la.date_end, c.client_ID, c.first_name, c.middle_name, c.last_name, lrb.RemainingReconBalance, lrb.TotalReconPayments
ORDER BY
    la.loan_application_id DESC
";

// Prepare and execute the PDO statement
$stmt = $pdo->prepare($sql);
$stmt->execute([$client_id]); // Bind the client_id here
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Set header to JSON and output the data
header('Content-Type: application/json');
echo json_encode($data);
?>