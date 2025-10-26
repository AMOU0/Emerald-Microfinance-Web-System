<?php
// Enable detailed error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

// --- Include Database Connection Handler and Connect ---  
require_once 'aadb_connect_handler.php';
try {
    $pdo = connectDB(); // Get the PDO connection object
} catch (Exception $e) {
    // connectDB already handles JSON error response, but this catches if connectDB fails before that
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit();
}
// $pdo is now the active database connection object (PDO)

// --- Query to Fetch Client Data ---
// We select the client_ID, first_name, and last_name from the clients table.
$sql = "SELECT client_ID, first_name, middle_name, last_name FROM clients";

try {
    // Prepare the statement
    $stmt = $pdo->prepare($sql);

    // Execute the statement
    $stmt->execute();

    $clients = [];

    // Fetch all results
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if any rows were returned
    if (count($results) > 0) {
        // Loop through the results and create an array of client objects
        foreach ($results as $row) {
            $clients[] = [
                'id' => $row['client_ID'],
                'name' => trim($row['first_name'] . ' ' . $row['middle_name'] . ' ' . $row['last_name'])
            ];
        }
    }

    // --- Send the JSON Response ---
    // Return a JSON object containing the status and the array of clients.
    echo json_encode([
        'status' => 'success',
        'data' => $clients
    ]);

} catch (PDOException $e) {
    // Handle query execution error
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Query failed: ' . $e->getMessage()]);
}

// The PDO connection will automatically close when the script finishes.
exit();
?>