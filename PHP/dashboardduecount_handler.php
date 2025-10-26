<?php
// ==========================================================
// TEMPORARILY ADD THESE LINES TO DIAGNOSE THE 500 ERROR
// REMOVE THEM ONCE THE ISSUE IS FIXED
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// ==========================================================

// Set the content type header to ensure the response is treated as JSON
header('Content-Type: application/json');

// Include the PDO database connection handler
require_once 'aadb_connect_handler.php'; // <--- VERIFY THIS PATH IS CORRECT

$pdo = null; 

try {
    $pdo = connectDB();

    // --- 1. Query for Loans Due Today ---
    $sql_due_today = "
        SELECT COUNT(*) AS due_today_count
        FROM loan_schedule
        WHERE due_date = CURDATE()
        AND is_paid = 0;
    ";
    
    $stmt_today = $pdo->query($sql_due_today);
    $due_today_count = (int)$stmt_today->fetchColumn();


    // --- 2. Query for Loans Due This Week (Today and remaining days of the week, Mon-Sun) ---
    $sql_due_week = "
        SELECT COUNT(*) AS due_this_week_count
        FROM loan_schedule
        WHERE YEARWEEK(due_date, 1) = YEARWEEK(CURDATE(), 1)
        AND due_date >= CURDATE()
        AND is_paid = 0;
    ";
    
    $stmt_week = $pdo->query($sql_due_week);
    $due_this_week_count = (int)$stmt_week->fetchColumn();


    // --- 3. Return Success JSON Response ---
    $response = [
        'success' => true,
        'counts' => [
            'due_today_count' => $due_today_count,
            'due_this_week_count' => $due_this_week_count
        ]
    ];
    echo json_encode($response);

} catch (\PDOException $e) {
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Database Query Error: ' . $e->getMessage()]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}

?>