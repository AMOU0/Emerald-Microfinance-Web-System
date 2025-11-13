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

// p = payment table, c = clients table, l = loan_applications table
$sql = "SELECT
            p.client_id,
            p.loan_application_id AS loan_id,
            CONCAT_WS(' ', c.last_name, c.first_name, c.middle_name) AS client_name,
            p.amount_paid AS payment_amount,
            p.date_payed,
            p.processby,
            
            -- Subquery to calculate the total amount due (Principal + Flat Interest)
            (l.loan_amount * (1 + l.interest_rate / 100)) AS total_repayment_due,
            
            -- Subquery to calculate the SUM of ALL payments made for this specific loan (loan_application_id) 
            -- up to and including the date of THIS payment (p.date_payed)
            (
                SELECT SUM(p2.amount_paid)
                FROM payment p2
                WHERE 
                    p2.loan_application_id = p.loan_application_id
                AND p2.date_payed <= p.date_payed
            ) AS cumulative_payment_amount,
            
            -- ** THE CORE CALCULATION **
            -- Balance after THIS payment = Total Due - (Cumulative Payments Made Up To and Including This Payment)
            ((l.loan_amount * (1 + l.interest_rate / 100)) - (
                SELECT SUM(p3.amount_paid)
                FROM payment p3
                WHERE 
                    p3.loan_application_id = p.loan_application_id
                AND p3.date_payed <= p.date_payed
            )) AS balance_after_payment

        FROM
            payment p 
        LEFT JOIN
            clients c ON p.client_id = c.client_ID
        LEFT JOIN
            loan_applications l ON p.loan_application_id = l.loan_application_id
        WHERE
            p.date_payed BETWEEN :date_from AND :date_to
        ORDER BY
            p.loan_application_id ASC, -- Ensure payments for the same loan are ordered correctly
            p.date_payed ASC";

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