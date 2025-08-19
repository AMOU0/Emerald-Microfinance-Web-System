<?php
header('Content-Type: application/json');

// Database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// SQL query to fetch pending clients
// This query assumes a 'status' column in the clients table.
// If you don't have a status, you can remove the WHERE clause to fetch all clients.
$sql = "SELECT client_ID, first_name, last_name, created_at FROM clients WHERE status = 'pending' ORDER BY created_at DESC";
$result = $conn->query($sql);

$pending_accounts = [];

if ($result->num_rows > 0) {
    // Fetch all rows and add to the array
    while($row = $result->fetch_assoc()) {
        $full_name = htmlspecialchars($row['first_name'] . ' ' . $row['last_name']);
        $created_date = date("F j, Y, g:i a", strtotime($row['created_at']));
        
        $pending_accounts[] = [
            'id' => $row['client_ID'],
            'name' => $full_name,
            'date_created' => $created_date
        ];
    }
}

// Return the data as a JSON object
echo json_encode($pending_accounts);

$conn->close();
?>