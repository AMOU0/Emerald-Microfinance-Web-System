<?php
// PHP/dashboardduetoday_handler.php - REVISED

header('Content-Type: application/json');

// Include the database connection file
require_once 'aadb_connect_handler.php';

try {
    // Connect to the database
    $pdo = connectDB(); 

    // SQL Query to fetch loan data for ALL approved, ongoing loans
    $stmt = $pdo->prepare("
        SELECT
            date_start,
            date_end,
            payment_frequency
        FROM
            loan_applications
        WHERE
            status = 'approved' -- Filter for only APPROVED loans
            AND date_end >= CURDATE() -- Only process loans that are not yet finished
    ");
    $stmt->execute();
    $approved_loans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the raw list of loans as JSON for JS to process
    echo json_encode([
        'success' => true,
        // The key 'loans' will hold the array of loan data
        'loans' => $approved_loans 
    ]);

} catch (\PDOException $e) {
 
    echo json_encode([
        'success' => false,
        'message' => "Query error: " . $e->getMessage(),
        'loans' => [] // Return an empty array on error for consistency
    ]);
}
?>