<?php
// Start the session to be able to access the session variables
session_start();
header('Content-Type: application/json');

// Check if the 'logged_in' session variable is set and is true.
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    // ⭐ MODIFIED: Get the stored role and name
    $user_role = $_SESSION['role'] ?? 'guest';
    $user_name = $_SESSION['name'] ?? 'Unknown User'; 
    
    // Return status, role, and the user's name
    echo json_encode([
        'status' => 'active', 
        'role' => $user_role,
        'user_name' => $user_name // ⭐ NEW: Return user_name for JavaScript
    ]);
} else {
    // If the session is not active, return 'inactive' and a default name.
    echo json_encode(['status' => 'inactive', 'role' => 'none', 'user_name' => 'Guest']);
}
?>