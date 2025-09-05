<?php
// Start the session to access the session variables
session_start();

// Unset all session variables
$_SESSION = array();

// If the session uses cookies, destroy the session cookie.
// This will destroy the session, and not just the session data!
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy the session data on the server
session_destroy();

// Redirect the user back to the login page.
// Since logout.php is in the PHP/ folder, "../" moves one directory up 
// to the root where login.html/index.html is assumed to be located.
header("Location: ../login.html"); 
exit; // Always call exit after header redirection to ensure immediate termination
?>