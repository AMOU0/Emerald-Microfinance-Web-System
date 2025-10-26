<?php
// Set headers for JSON response
header('Content-Type: application/json');

// Include the database connection function
require 'aadb_connect_handler.php';

// In a real application, you would start a session and verify the user's ID:
// session_start();
// $userId = $_SESSION['user_id'] ?? null;

// --- PLACEHOLDER LOGIC ---
// Since we don't have session management, we'll use a placeholder user ID (e.g., User ID 1)
// to demonstrate the concept. You MUST replace this with secure session retrieval.
$placeholderUserId = 1; // Assuming 'admin' user has id 1 based on user_accounts.sql
$userId = $placeholderUserId;
// -------------------------

if (empty($userId)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

try {
    $pdo = connectDB();
    
    $stmt = $pdo->prepare("SELECT username FROM user_accounts WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $user = $stmt->fetch();

    if ($user) {
        http_response_code(200);
        echo json_encode(['success' => true, 'username' => $user['username']]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
    }

} catch (\PDOException $e) {
    error_log("Fetch Username Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error.']);

} catch (\Exception $e) {
    error_log("General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>
