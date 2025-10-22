<?php
// PHP/reportsdelinquentaccounts_fetch.php

header('Content-Type: application/json');

if (!file_exists('aadb_connect_handler.php')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal error: aadb_connect_handler.php not found.']);
    exit;
}
require_once 'aadb_connect_handler.php'; 

$response = [
    'success' => false,
    'message' => 'No data fetched.',
    'loans' => [] 
];

try {
    $pdo = connectDB(); 

    // Fetches loans that are approved and not marked as fully paid in the loan_applications table.
    $sql = "
        SELECT
            c.client_ID,
            c.first_name,
            c.last_name,
            la.loan_application_id AS loan_ID,
            la.loan_amount AS principal_amount,
            la.payment_frequency,
            la.date_start,
            la.date_end,
            la.interest_rate,
            IFNULL(SUM(p.amount_paid), 0) AS total_amount_paid
        FROM
            loan_applications la
        JOIN
            clients c ON la.client_ID = c.client_ID
        LEFT JOIN
            payment p ON la.loan_application_id = p.loan_application_id
        WHERE
            la.status = 'approved' 
            AND la.paid = 'Unpaid' 
        GROUP BY
            la.loan_application_id, c.client_ID, c.first_name, c.last_name, la.loan_amount, 
            la.payment_frequency, la.date_start, la.date_end, la.interest_rate
        ORDER BY
            la.date_start ASC;
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $loans = $stmt->fetchAll();

    $response['success'] = true;
    $response['loans'] = $loans;
    $response['message'] = 'Loan data fetched successfully. Ready for JS processing.';

} catch (\PDOException $e) {
    $response['message'] = 'Database query failed: ' . $e->getMessage();
    http_response_code(500);
}

echo json_encode($response);