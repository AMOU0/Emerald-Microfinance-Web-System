<?php
// Start the session to access the session variables
session_start();

// 1. INCLUDE THE AUDIT TRAIL FUNCTION
require_once 'audittrail_function.php'; 

// Database credentials
$servername = "localhost";
$username = "root"; // XAMPP default username
$password = "";     // XAMPP default password
$dbname = "emerald_microfinance";

// 2. ESTABLISH DATABASE CONNECTION
$conn = new mysqli($servername, $username, $password, $dbname);
// If connection fails, we log it, but proceed with session destruction/redirection
if ($conn->connect_error) {
    error_log("Logout database connection failed: " . $conn->connect_error);
    // We'll skip logging to DB but still log out the user
}

// 3. GET USER ID AND USERNAME BEFORE DESTROYING SESSION
$user_id = $_SESSION['user_id'] ?? 0;
$username = $_SESSION['username'] ?? 'Unknown User';

// 4. DESTROY THE SESSION
// Unset all session variables
$_SESSION = array();

// If the session uses cookies, destroy the session cookie.
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy the session data on the server
session_destroy();

// 5. LOG THE ACTION (Only if DB connection was successful)
if ($conn && !$conn->connect_error) {
    log_audit_trail($conn, $user_id, "User logged out: " . $username);
    $conn->close();
}


// Redirect the user back to the login page.
header("Location: ../login.html"); 
exit; // Always call exit after header redirection to ensure immediate termination
?>