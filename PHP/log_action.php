<?php
// PHP/log_action.php

// 1. Resume the session to access user data
session_start();

// 2. Define the log function (UPDATED)
/**
 * Logs a user action into the audit_logs table.
 * @param mysqli $conn The database connection object.
 * @param int $userId The ID of the user performing the action.
 * @param string $action The classification of the action (e.g., CREATED, NAVIGATION).
 * @param string $description The detailed description of the action. (NEW PARAMETER)
 * @param string $targetTable Optional. The table affected by the action.
 * @param string $targetId Optional. The ID of the record affected.
 * @param string $beforeState Optional. JSON or text of the record state before change.
 * @param string $afterState Optional. JSON or text of the record state after change.
 */
function log_audit_trail($conn, $userId, $action, $description, $targetTable = NULL, $targetId = NULL, $beforeState = NULL, $afterState = NULL) {
    // Get the user's IP address
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'N/A';

    // Prepare the SQL statement to prevent SQL injection (UPDATED TO INCLUDE 'description')
    $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, target_table, target_id, ip_address, before_state, after_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    // Check if preparation failed
    if ($stmt === false) {
        error_log('MySQL prepare statement failed: ' . $conn->error);
        return false; 
    }

    // Bind parameters (UPDATED: Added 's' for $description)
    $stmt->bind_param("isssssss", 
        $userId, 
        $action, 
        $description, // New binding for description
        $targetTable, 
        $targetId, 
        $ipAddress, 
        $beforeState, 
        $afterState
    );
    
    // Execute the statement
    if (!$stmt->execute()) {
        error_log('MySQL execute failed: ' . $stmt->error);
        $stmt->close();
        return false;
    }

    $stmt->close();
    return true;
}


// --- Main Execution Block (UPDATED) ---

// Check prerequisites (Now requires both 'action' and 'description')
if (!isset($_SESSION['user_id']) || !isset($_POST['action']) || !isset($_POST['description'])) {
    http_response_code(400); // Bad Request
    exit;
}

// Extract data
$userId = (int)$_SESSION['user_id']; 
$action = trim($_POST['action']);
$description = trim($_POST['description']); // NEW: Extract the description from POST
// Optional parameters for DML logs (set to NULL for navigation logs)
$targetTable = $_POST['target_table'] ?? NULL;
$targetId = $_POST['target_id'] ?? NULL;
$beforeState = $_POST['before_state'] ?? NULL;
$afterState = $_POST['after_state'] ?? NULL;


$servername = "localhost";
$username = "root"; // Your database username
$password = ""; // Your database password
$dbname = "emerald_microfinance"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    error_log("Database connection failed: " . $conn->connect_error);
    exit;
}

// 4. Log the action (UPDATED: $description is passed)
if (log_audit_trail($conn, $userId, $action, $description, $targetTable, $targetId, $beforeState, $afterState)) {
    http_response_code(200); // OK
} else {
    // If logging fails, still return a success code to the client 
    // to prevent the JS from erroring out, but log the failure server-side.
    // If you prefer the JS to see a warning/error, use: http_response_code(500);
    http_response_code(200); 
}

// Close the database connection
$conn->close();

?>