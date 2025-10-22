<?php
// Start the session to access the session variables
session_start();

// 1. INCLUDE THE AUDIT TRAIL FUNCTION (MUST BE THE PDO VERSION)
require_once 'loginaudittrail_function.php'; // Requires PDO-compatible version

// 2. INCLUDE THE AADB CONNECTION HANDLER
require_once 'aadb_connect_handler.php'; 

// --- DATABASE CONNECTION (AADB/PDO INTEGRATION) ---
// Note: connectDB() handles connection failure by exiting with a JSON error.
// We wrap this in a try-catch to allow the script to continue with logout even on DB failure.
$pdo_conn = null;
$db_connection_successful = false;
try {
    $pdo_conn = connectDB();
    // If connectDB() succeeds, the $pdo_conn object is returned.
    $db_connection_successful = true;
} catch (\PDOException $e) {
    // connectDB() should handle the exit, but if an internal error occurs here, log it
    error_log("Logout DB connection failed: " . $e->getMessage());
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

// 5. LOG THE ACTION (Only if PDO connection was successful)
if ($db_connection_successful && $pdo_conn) {
    // CRITICAL: log_audit_trail MUST be updated to accept a PDO connection object
    log_audit_trail($pdo_conn, $user_id, "User logged out: " . $username);
    
    // Explicitly close the PDO connection resources
    $pdo_conn = null;
}


// Redirect the user back to the login page.
header("Location: ../LogIn.html"); 
exit; // Always call exit after header redirection to ensure immediate termination
?>