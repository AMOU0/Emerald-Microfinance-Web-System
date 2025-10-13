<?php
// === START DEBUGGING CODE ===
// These lines force PHP to display all errors, which helps debug a blank page
error_reporting(E_ALL);
ini_set('display_errors', 1);
// === END DEBUGGING CODE ===

// PHP/toolsbr_log.php

// NOTE: We assume aadb_connect_handler.php is in the PARENT directory (../)
// FIX: Changed the path to match the comment (../)
require_once 'aadb_connect_handler.php';

// Set the response header to JSON format immediately
header('Content-Type: application/json');

try {
    // Establish PDO connection using function from aadb_connect_handler.php
    $pdo = connectDB();

    // The actions to filter by
    $action_created = 'CREATED_BR'; 
    $action_updated = 'UPDATED_BR'; 

    // SQL Query: Using LEFT JOIN and IFNULL to ensure no logs are missed
    $sql = "SELECT al.created_at AS timestamp, 
                  IFNULL(ua.username, 'Unknown User') AS username, 
                  al.action, 
                  al.description 
            FROM audit_logs al
            LEFT JOIN user_accounts ua ON al.user_id = ua.id
            WHERE al.action IN (?, ?)
            ORDER BY al.created_at DESC";

    // Prepare and execute the statement securely
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$action_created, $action_updated]);
    $logs = $stmt->fetchAll();

    // Output success response with data
    echo json_encode([
        'success' => true,
        'logs' => $logs
    ]);

} catch (PDOException $e) {
    // This catches database-related errors (query failure, etc.)
    http_response_code(500);
    error_log("toolsbr_log.php PDO Error: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Database query failed. Please check server logs for details.'
    ]);
} catch (Exception $e) {
    // This catches general errors (like file not found for require_once)
    http_response_code(500);
    error_log("toolsbr_log.php General Error: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'An internal server error occurred during log loading.'
    ]);
}
?>