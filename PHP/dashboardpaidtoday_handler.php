<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'aadb_connect_handler.php'; 

header('Content-Type: application/json');

try {
    $pdo = connectDB();

    // CORRECTED: Using SUM(amount_paid) and WHERE date_payed
$sql = "SELECT SUM(amount_paid) AS total_collection FROM payment WHERE DATE(date_payed) = CURDATE()";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Safely default to '0.00' if SUM returns null
    $total_paid = $result['total_collection'] ?? '0.00';

    echo json_encode([
        'success' => true,
        'amount' => $total_paid
    ]);

} catch (\PDOException $e) {
    error_log("SQL Error in dashboardpaidtoday_handler.php: " . $e->getMessage()); 
    
    http_response_code(500);
    
    echo json_encode(['success' => false, 'message' => 'Database query failed. Please check server logs.']);
}