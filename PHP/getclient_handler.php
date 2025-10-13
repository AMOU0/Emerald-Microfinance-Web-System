<?php
// Enable detailed error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

// --- Database Credentials ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    // Return a JSON error message if the connection fails
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    // Exit the script to prevent further execution
    exit();
}

// --- Query to Fetch Client Data ---
// It's a good practice to use prepared statements to prevent SQL injection.
// We select the client_ID, first_name, and last_name from the clients table.
$sql = "SELECT client_ID, first_name, middle_name, last_name FROM clients";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    // Handle prepare error
    echo json_encode(['status' => 'error', 'message' => 'Prepare failed: ' . $conn->error]);
    exit();
}

// Execute the statement
if (!$stmt->execute()) {
    // Handle execute error
    echo json_encode(['status' => 'error', 'message' => 'Execute failed: ' . $stmt->error]);
    exit();
}

// Get the result set
$result = $stmt->get_result();
$clients = [];

// Check if any rows were returned
if ($result->num_rows > 0) {
    // Loop through the results and create an array of client objects
    while ($row = $result->fetch_assoc()) {
        $clients[] = [
            'id' => $row['client_ID'],
            'name' => trim($row['first_name'] . ' ' . $row['middle_name'] . ' ' . $row['last_name'])
        ];
    }
}

// Close the statement and connection
$stmt->close();
$conn->close();

// --- Send the JSON Response ---
// Return a JSON object containing the status and the array of clients.
echo json_encode([
    'status' => 'success',
    'data' => $clients
]);

// Exit the script
exit();

?>
