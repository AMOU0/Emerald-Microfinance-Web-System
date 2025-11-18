<?php
// PHP/collectiontoday_handler.php

// Include the database connection handler
include 'aadb_connect_handler.php'; 

// Set the content type to JSON
header('Content-Type: application/json');

try {
    // 1. Establish database connection
    $pdo = connectDB(); 
} catch (\Exception $e) {
    exit();
}

// --- 2. Determine Date Range (Defaults to Today) ---

function getTodayDate() {
    return date('Y-m-d');
}

$dateFrom = $_GET['date_from'] ?? getTodayDate();
$dateTo = $_GET['date_to'] ?? getTodayDate();

// --- 3. Prepare and Execute SQL Query ---

// p = payment table, c = clients table, l = loan_applications table, lr = loan_reconstruct table
$sql = "SELECT
            p.client_id,
            p.loan_application_id AS loan_id,
            CONCAT_WS(' ', c.last_name, c.first_name, c.middle_name) AS client_name,
            p.amount_paid AS payment_amount,
            p.date_payed,
            p.processby,
            
            -- Determine the Total Repayment Due (Original or Reconstructed)
            -- This sets the total liability against which payments are measured.
            COALESCE(
                lr.reconstruct_amount * (1 + lr.interest_rate / 100),
                l.loan_amount * (1 + l.interest_rate / 100)
            ) AS total_repayment_due,
            
            -- ** FIXED: Cumulative Payments must ONLY include relevant payments **
            (
                SELECT SUM(p2.amount_paid)
                FROM payment p2
                WHERE 
                    p2.loan_application_id = p.loan_application_id
                AND p2.date_payed <= p.date_payed
                -- CRITICAL FIX: Only sum payments linked to the SAME loan status (original or reconstructed)
                AND (
                    -- If the current payment (p) is reconstructed, only count reconstructed payments (p2)
                    (p.loan_reconstruct_id IS NOT NULL AND p2.loan_reconstruct_id = p.loan_reconstruct_id)
                    -- If the current payment (p) is NOT reconstructed, only count original payments (p2)
                    OR (p.loan_reconstruct_id IS NULL AND p2.loan_reconstruct_id IS NULL)
                )
            ) AS cumulative_payment_amount,
            
            -- ** THE FINAL CALCULATION **
            (
                COALESCE(
                    lr.reconstruct_amount * (1 + lr.interest_rate / 100),
                    l.loan_amount * (1 + l.interest_rate / 100)
                ) - (
                    SELECT SUM(p3.amount_paid)
                    FROM payment p3
                    WHERE 
                        p3.loan_application_id = p.loan_application_id
                    AND p3.date_payed <= p.date_payed
                    -- CRITICAL FIX: Apply the same condition as above
                    AND (
                        (p.loan_reconstruct_id IS NOT NULL AND p3.loan_reconstruct_id = p.loan_reconstruct_id)
                        OR (p.loan_reconstruct_id IS NULL AND p3.loan_reconstruct_id IS NULL)
                    )
                )
            ) AS balance_after_payment

        FROM
            payment p 
        LEFT JOIN
            clients c ON p.client_id = c.client_ID
        LEFT JOIN
            loan_applications l ON p.loan_application_id = l.loan_application_id
        LEFT JOIN
            loan_reconstruct lr ON p.loan_reconstruct_id = lr.loan_reconstruct_id
        WHERE
            p.date_payed BETWEEN :date_from AND :date_to
        ORDER BY
            p.loan_application_id ASC, 
            p.date_payed ASC";

try {
    $stmt = $pdo->prepare($sql);
    
    // Bind parameters
    $stmt->execute([
        ':date_from' => $dateFrom . ' 00:00:00',
        ':date_to'   => $dateTo . ' 23:59:59'    
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
    echo json_encode(["success" => false, "message" => "SQL Error: " . $e->getMessage()]);
}
?>