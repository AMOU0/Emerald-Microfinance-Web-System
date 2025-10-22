<?php
// PHP/reportsexistingclient_handler.php - MODIFIED to use aadb_connect_handler.php
header('Content-Type: application/json');

// Include the centralized database connection function
include_once 'aadb_connect_handler.php'; // Assuming this file is in the same directory

try {
    // Use the function from aadb_connect_handler.php
    $pdo = connectDB();

    $sql = "SELECT * FROM clients";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $clients]);

} catch (PDOException $e) {
    // The connectDB function already handles connection errors and exits, 
    // this catch is for query execution errors.
    echo json_encode(['status' => 'error', 'message' => 'Query error: ' . $e->getMessage()]);
}
?>