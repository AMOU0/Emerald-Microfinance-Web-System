<?php
// PHP/dashboardoverdue_handler.php

// Include the database connection handler
require_once 'aadb_connect_handler.php'; // Adjust path if 'aadb_connect_handler.php' is in a different location relative to this file

header('Content-Type: application/json');

try {
    // 1. Establish database connection
    $pdo = connectDB();

    // 2. SQL Query to fetch necessary loan and payment data
    // We select all approved and released loans and LEFT JOIN with the payment table
    // to get the sum of all payments made for each loan.
    $sql = "
        SELECT
            la.loan_application_id,
            la.loan_amount AS principal_amount,
            la.payment_frequency,
            la.date_start,
            la.date_end,
            la.interest_rate,
            COALESCE(SUM(p.amount_paid), 0) AS total_amount_paid
        FROM
            loan_applications la
        LEFT JOIN
            payment p ON la.loan_application_id = p.loan_application_id
        WHERE
            la.status = 'approved' AND la.release_status = 'Released'
        GROUP BY
            la.loan_application_id, la.loan_amount, la.payment_frequency, la.date_start, la.date_end, la.interest_rate
    ";

    // 3. Prepare and execute the statement
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    // 4. Fetch all results
    $loans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Return success response with loan data
    echo json_encode([
        'success' => true,
        'loans' => $loans,
        'message' => 'Loan data fetched successfully.'
    ]);

} catch (\PDOException $e) {
    // 6. Handle SQL or connection errors
    error_log("SQL Error: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch loan data from the database.'
    ]);
} catch (\Exception $e) {
    // 7. Handle other general errors (e.g., if aadb_connect_handler.php is not found)
    error_log("General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred on the server.'
    ]);
}
?>