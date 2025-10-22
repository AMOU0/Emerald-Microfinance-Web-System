<?php
// Start the session to be able to access the session variables
session_start();
header('Content-Type: application/json');

// Check if the 'logged_in' session variable is set and is true.
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    // ⭐ MODIFIED: Get the stored role
    $user_role = $_SESSION['role'] ?? 'guest'; 
    // Return status and the user's role
    echo json_encode(['status' => 'active', 'role' => $user_role]);
} else {
    // If the session is not active, return 'inactive'.
    echo json_encode(['status' => 'inactive', 'role' => 'none']);
}
?>