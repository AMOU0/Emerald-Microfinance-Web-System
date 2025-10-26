<?php
// update_user.php - UPDATED to handle account status

require_once 'aadb_connect_handler.php'; // Include the database connection handler

// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Get JSON data from the request body
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// CORRECTION: Added 'status' to the required check
if (!isset($data['id']) || !isset($data['name']) || !isset($data['email']) || !isset($data['username']) || !isset($data['role']) || !isset($data['status'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing required fields (ID, Name, Email, Username, Role, or Status).']);
    exit;
}

$id = $data['id'];
$name = trim($data['name']);
$email = trim($data['email']);
$username = trim($data['username']);
$role = $data['role'];
// NEW: Status
$status = $data['status']; 
$new_password = isset($data['new_password']) ? $data['new_password'] : null;

// Basic validation for status value (ensure it's one of the expected values)
if (!in_array($status, ['Active', 'Deactivated'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid account status value. Must be Active or Deactivated.']);
    exit;
}

try {
    $pdo = connectDB(); // Establish database connection

    // CORRECTION: Added 'status = :status' to the initial SET clause
    $sql = "UPDATE user_accounts SET name = :name, email = :email, username = :username, role = :role, status = :status";
    $params = [
        ':id' => $id,
        ':name' => $name,
        ':email' => $email,
        ':username' => $username,
        ':role' => $role,
        ':status' => $status // NEW: Status parameter
    ];

    // If a new password is provided, include it in the update
    if (!empty($new_password)) {
        // Hash the new password
        $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
        $sql .= ", password_hash = :password_hash";
        $params[':password_hash'] = $password_hash;
    }

    $sql .= " WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    header('Content-Type: application/json');
    // Simplified success logic to handle both password update and non-password updates
    if ($stmt->rowCount() > 0 || empty($new_password)) { 
        echo json_encode(['success' => true, 'message' => 'User account updated successfully!']);
    } else {
        echo json_encode(['success' => true, 'message' => 'No changes detected or user already up to date.']);
    }

} catch (PDOException $e) {
    // Check for unique constraint violation (e.g., email or username already exists)
    if ($e->getCode() == '23000') {
        $error_message = 'The provided email or username is already in use by another account.';
    } else {
        $error_message = 'An error occurred during the update: ' . $e->getMessage();
        error_log("Error updating user: " . $e->getMessage());
        http_response_code(500); // Internal Server Error
    }

    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => $error_message]);
}
?>