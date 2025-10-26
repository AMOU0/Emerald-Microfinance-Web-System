<?php
// fetch_user_details.php - UPDATED to include status

require_once 'aadb_connect_handler.php'; // Include the database connection handler

// Define all possible roles based on your application and existing database data
$all_available_roles = [
    'Admin', 
    'Manager', 
    'Loan Officer'
];

// Check for the 'id' parameter in the request
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid or missing user ID.', 'roles' => $all_available_roles]);
    exit;
}

$user_id = (int)$_GET['id'];

try {
    $pdo = connectDB(); // Establish database connection
    
    // CORRECTION: Include 'status' in the SELECT statement
    $sql = "SELECT id, name, email, username, role, password_hash, status FROM user_accounts WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    header('Content-Type: application/json');
    if ($user) {
        // User found, return data along with all available roles
        echo json_encode(['success' => true, 'user' => $user, 'roles' => $all_available_roles]);
    } else {
        // User not found
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'message' => 'User not found.', 'roles' => $all_available_roles]);
    }

} catch (PDOException $e) {
    // Database or query error
    error_log("Error fetching user details: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'An error occurred while fetching user data.', 'roles' => $all_available_roles]);
}
?>