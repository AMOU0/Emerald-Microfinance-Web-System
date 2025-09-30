<?php
// PHP/log_action.php

// 1. Resume the session to access user data
session_start();

// 2. Check prerequisites and include required files
if (!isset($_SESSION['user_id']) || !isset($_POST['action'])) {
    http_response_code(400); // Bad Request
    exit;
}

// Include your database connection and audit function
require_once 'audittrail_function.php'; 

// 3. Extract data
$userId = (int)$_SESSION['user_id']; 
$action = trim($_POST['action']);


$servername = "localhost";
$username = "root"; // Your database username
$password = ""; // Your database password
$dbname = "emerald_microfinance"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// 4. Log the action
log_audit_trail($conn, $userId, $action);

// 5. Close connection (optional, but good practice)
$conn->close();

// Return a success response
http_response_code(200); 
?>