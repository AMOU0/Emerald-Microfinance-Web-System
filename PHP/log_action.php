<?php
// PHP/log_action.php

// 1. Include the PDO connection handler
require_once 'aadb_connect_handler.php'; // Assuming 'aadb_connect_handler.php' is in the same directory

// 2. Resume the session to access user data
session_start();

// 3. Define the log function (UPDATED for PDO)
/**
 * Logs a user action into the audit_logs table.
 * @param PDO $pdo The PDO database connection object (Replaced mysqli).
 * @param int $userId The ID of the user performing the action.
 * @param string $action The classification of the action (e.g., CREATED, NAVIGATION).
 * @param string $description The detailed description of the action.
 * @param string $targetTable Optional. The table affected by the action.
 * @param string $targetId Optional. The ID of the record affected.
 * @param string $beforeState Optional. JSON or text of the record state before change.
 * @param string $afterState Optional. JSON or text of the record state after change.
 */
function log_audit_trail($pdo, $userId, $action, $description, $targetTable = NULL, $targetId = NULL, $beforeState = NULL, $afterState = NULL) {
    // Get the user's IP address
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'N/A';

    // Prepare the SQL statement using PDO
    $sql = "INSERT INTO audit_logs (user_id, action, description, target_table, target_id, ip_address, before_state, after_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    try {
        $stmt = $pdo->prepare($sql);
        
        // Execute the statement, passing an array of parameters
        // PDO automatically handles type binding (no need for 'isssssss')
        if (!$stmt->execute([
            $userId, 
            $action, 
            $description,
            $targetTable, 
            $targetId, 
            $ipAddress, 
            $beforeState, 
            $afterState
        ])) {
            error_log('PDO execute failed for audit trail.');
            return false;
        }

        return true;
    } catch (\PDOException $e) {
        error_log('PDO prepare or execute failed: ' . $e->getMessage());
        return false;
    }
}


// --- Main Execution Block (UPDATED) ---

// Check prerequisites
if (!isset($_SESSION['user_id']) || !isset($_POST['action']) || !isset($_POST['description'])) {
    http_response_code(400); // Bad Request
    exit;
}

// Extract data
$userId = (int)$_SESSION['user_id']; 
$action = trim($_POST['action']);
$description = trim($_POST['description']);
// Optional parameters for DML logs (set to NULL for navigation logs)
$targetTable = $_POST['target_table'] ?? NULL;
$targetId = $_POST['target_id'] ?? NULL;
$beforeState = $_POST['before_state'] ?? NULL;
$afterState = $_POST['after_state'] ?? NULL;


// 4. Create the PDO connection using the function from aadb_connect_handler.php
// NOTE: connectDB() handles connection failure by exiting with a 500 response,
// so if the script continues, $pdo is guaranteed to be a valid connection object.
$pdo = connectDB(); 


// 5. Log the action (PDO object $pdo is passed)
if (log_audit_trail($pdo, $userId, $action, $description, $targetTable, $targetId, $beforeState, $afterState)) {
    http_response_code(200); // OK
} else {
    // If logging fails, still return a success code to the client 
    http_response_code(200); 
}

// In PDO, the connection (object $pdo) is automatically closed when the script ends,
// or you can set $pdo = null; but explicit close like mysqli is not strictly necessary.

?>