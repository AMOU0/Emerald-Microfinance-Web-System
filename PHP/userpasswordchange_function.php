<?php
// change_password.php
// This script assumes that user session management is in place and the user's identifier (like username or ID)
// is stored in a session variable. For this example, we'll assume a session is available and
// we are targeting the 'admin' user for demonstration, or we would retrieve the logged-in username from $_SESSION['username'].

// Start session to get user context (essential for a real application)
session_start();

// Include the database connection handler
require_once 'aadb_connect_handler.php'; 

header('Content-Type: application/json');

// Function to send a JSON response and exit
function sendResponse($success, $message, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// 1. Check for POST request and required inputs
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method.', 405);
}

$old_password = $_POST['old_password'] ?? '';
$new_password = $_POST['new_password'] ?? '';

if (empty($old_password) || empty($new_password)) {
    sendResponse(false, 'Missing required fields.');
}

// Basic server-side validation for the new password
if (strlen($new_password) < 6) {
    sendResponse(false, 'New password must be at least 6 characters long.');
}

// 2. Determine the user to update
// In a real application, you'd use the logged-in user's ID or username from the session.
// e.g., $username = $_SESSION['username'] ?? null;
// For demonstration, we'll hardcode a user that exists in 'user_accounts.sql' (admin)
$username = 'admin'; 

if (empty($username)) {
    sendResponse(false, 'User not authenticated.', 401);
}

try {
    $pdo = connectDB();

    // 3. Retrieve the current password hash from the database
    $stmt = $pdo->prepare("SELECT password_hash FROM user_accounts WHERE username = :username");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if (!$user) {
        // This case should not happen if the user is logged in, but good for security.
        sendResponse(false, 'User not found.', 404);
    }

    $current_hash = $user['password_hash'];

    // 4. Verify the old password
    // password_verify() is the standard and secure way to check against a hash.
    if (!password_verify($old_password, $current_hash)) {
        sendResponse(false, 'The old password you entered is incorrect.');
    }

    // Optional: Check if the new password is the same as the old one
    if ($old_password === $new_password) {
        sendResponse(false, 'New password cannot be the same as the old password.');
    }

    // 5. Hash the new password securely
    $new_password_hash = password_hash($new_password, PASSWORD_BCRYPT);
    
    // 6. Update the password hash in the database
    $update_stmt = $pdo->prepare("UPDATE user_accounts SET password_hash = :new_hash WHERE username = :username");
    $update_result = $update_stmt->execute([
        'new_hash' => $new_password_hash,
        'username' => $username
    ]);

    if ($update_result) {
        sendResponse(true, 'Password changed successfully!');
    } else {
        sendResponse(false, 'Failed to update password. Please try again.');
    }

} catch (PDOException $e) {
    // Log the error and return a generic message
    error_log("Password Change Error: " . $e->getMessage());
    sendResponse(false, 'A database error occurred.', 500);
}

?>