<?php
// Set the content type to JSON
header('Content-Type: application/json');

// Include your database connection handler
require_once 'aadb_connect_handler.php'; 

try {
    // Connect to the database
    $pdo = connectDB();

    // Prepare a statement to count the total number of entries in the 'clients' table
    $stmt = $pdo->prepare("SELECT COUNT(client_ID) AS totalClients FROM clients");

    // Execute the statement
    $stmt->execute();

    // Fetch the result
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Send a success response with the client count
    echo json_encode([
        'success' => true,
        'totalClients' => (int)$result['totalClients'] // Cast to integer for safety
    ]);

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>