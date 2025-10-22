<?php
header('Content-Type: application/json');

// Include the PDO connection function
require_once 'aadb_connect_handler.php';

$pdo = null;

try {
    // Establish Database Connection
    $pdo = connectDB(); 

    // SQL query to fetch all user accounts. 
    $sql = "SELECT id, name, username, role, status, created_at
            FROM user_accounts
            ORDER BY created_at DESC";

    $stmt = $pdo->query($sql);

    $users = [];
    if ($stmt) {
        // Use FETCH_ASSOC to get column names as keys
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC); 
    }

    // Return the data as a JSON object
    echo json_encode($users);

} catch (Exception $e) {
    // Catch-all for PDO errors
    http_response_code(500);
    echo json_encode(["error" => "An error occurred: " . $e->getMessage()]);
}
?>