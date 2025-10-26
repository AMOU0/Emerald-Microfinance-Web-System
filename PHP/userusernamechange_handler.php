<?php
// Set headers for JSON response and cross-origin access (if needed)
header('Content-Type: application/json');
// header('Access-Control-Allow-Origin: *'); // Uncomment if testing locally without same-origin policy

// Include the database connection function
require 'aadb_connect_handler.php';

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Get the JSON data from the request body
$data = json_decode(file_get_contents("php://input"), true);

$oldUsername = trim($data['old_username'] ?? '');
$newUsername = trim($data['new_username'] ?? '');
// NOTE: We assume you have a way to securely identify the current user,
// usually via a session variable or a secure token (not implemented here).
// For this script, we'll rely only on the provided old_username.

if (empty($oldUsername) || empty($newUsername)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields.']);
    exit;
}

if (strlen($newUsername) < 4) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New username must be at least 4 characters long.']);
    exit;
}

try {
    $pdo = connectDB();
    $pdo->beginTransaction();

    // 1. Check if the old username exists and belongs to the user
    // In a real application, you would also check the password hash here for maximum security,
    // or use a secure session variable (e.g., $_SESSION['user_id']) instead of relying on $oldUsername.
    $stmt = $pdo->prepare("SELECT id FROM user_accounts WHERE username = :old_username");
    $stmt->execute(['old_username' => $oldUsername]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Current username is incorrect.']);
        exit;
    }
    
    $userId = $user['id'];

    // 2. Check if the new username is already taken by another user
    $stmt = $pdo->prepare("SELECT id FROM user_accounts WHERE username = :new_username AND id != :user_id");
    $stmt->execute(['new_username' => $newUsername, 'user_id' => $userId]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'message' => 'The new username is already taken.']);
        exit;
    }

    // 3. Update the username
    $stmt = $pdo->prepare("UPDATE user_accounts SET username = :new_username WHERE id = :user_id");
    $stmt->execute(['new_username' => $newUsername, 'user_id' => $userId]);

    $pdo->commit();

    // Success response
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Username successfully updated!']);

} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Check for unique constraint violation (username already taken) if the second check was somehow missed
    if ($e->getCode() === '23000') { // 23000 is the SQLSTATE for Integrity constraint violation
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Error: The new username is already taken.']);
    } else {
        error_log("Username Change Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'A server error occurred during the update.']);
    }

} catch (\Exception $e) {
    error_log("General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>
