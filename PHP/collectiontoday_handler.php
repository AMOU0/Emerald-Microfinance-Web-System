<?php
// PHP/collectiontoday_handler.php

// Include the database connection handler
include 'aadb_connect_handler.php'; 

// Set the content type to JSON
header('Content-Type: application/json');

try {
    // 1. Establish database connection
    $pdo = connectDB(); // Uses the function from your aadb_connect_handler.php
} catch (\Exception $e) {
    exit();
}

// --- 2. Determine Date Range (Defaults to Today) ---

function getTodayDate() {
    return date('Y-m-d');
}

// Get dates from the URL query parameters (GET request from JavaScript)
// Default to today's date if no filter is provided (first load scenario)
$dateFrom = $_GET['date_from'] ?? getTodayDate();
$dateTo = $_GET['date_to'] ?? getTodayDate();

// --- 3. Prepare and Execute SQL Query ---

// p = payment table, c = clients table
$sql = "SELECT
            p.client_id,
            p.loan_application_id AS loan_id,
            -- Concatenate first, middle, and last name for the Name column
            CONCAT_WS(' ', c.last_name, c.first_name, c.middle_name) AS client_name,
            p.amount_paid AS payment_amount,
            '0.00' AS balance_after_payment,   /* PLACEHOLDER: Requires calculation logic */
            p.date_payed,
            p.processby
        FROM
            payment p 
        LEFT JOIN
            clients c ON p.client_id = c.client_ID /* Joining payment.client_id with clients.client_ID */
        WHERE
            p.date_payed BETWEEN :date_from AND :date_to
        ORDER BY
            p.date_payed DESC";

try {
    $stmt = $pdo->prepare($sql);
    
    // Bind parameters to query from the start of the 'from' day to the end of the 'to' day
    $stmt->execute([
        ':date_from' => $dateFrom . ' 00:00:00', // Start of the "From" day
        ':date_to'   => $dateTo . ' 23:59:59'    // End of the "To" day
    ]);
    
    $payments = $stmt->fetchAll();

    // --- 4. Return Data ---
    echo json_encode([
        "success" => true,
        "data" => $payments
    ]);

} catch (\PDOException $e) {
    error_log("SQL Query failed: " . $e->getMessage());
    http_response_code(500);
    // Return the specific SQL error for debugging
    echo json_encode(["success" => false, "message" => "SQL Error: " . $e->getMessage()]);
}
?>