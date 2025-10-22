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

// 🛑 MODIFICATION: The WHERE clause now filters by la.client_ID to get all loans.
// Note: Client ID and Loan ID share the same value (202500001) in your sample, 
// but we explicitly use la.client_ID in the WHERE clause here.
$sql = "
SELECT
    c.client_ID AS `Client ID`,
    CONCAT(c.first_name, ' ', c.middle_name, ' ', c.last_name) AS `Client Name`,
    la.loan_application_id AS `Loan ID`,
    (la.loan_amount * (1 + la.interest_rate / 100)) AS `Amount (w/ Interest)`,
    COALESCE(SUM(p.amount_paid), 0.00) AS `Total Paid`,
    (la.loan_amount * (1 + la.interest_rate / 100)) - COALESCE(SUM(p.amount_paid), 0.00) AS `Remaining Balance`,
    CONCAT(la.duration_of_loan, ' (', la.payment_frequency, ')') AS `Term (Duration / Freq.)`,
    la.date_start AS `Start Date`,
    la.date_end AS `End Date`
FROM
    loan_applications la
JOIN
    clients c ON la.client_ID = c.client_ID
LEFT JOIN
    payment p ON la.loan_application_id = p.loan_application_id
WHERE
    la.client_ID = ?  -- 🛑 CRUCIAL CHANGE: Filter by client_ID
GROUP BY
    la.loan_application_id, la.loan_amount, la.interest_rate, la.duration_of_loan, la.payment_frequency, la.date_start, la.date_end, c.client_ID, c.first_name, c.middle_name, c.last_name
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