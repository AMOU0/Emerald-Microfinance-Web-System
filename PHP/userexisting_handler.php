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

// SQL query to fetch all user accounts. 
// You might need a "status" column in your user_accounts table
// to differentiate between pending and active users.
// For this example, we'll assume all users are shown.
$sql = "SELECT id, name, username, role, created_at
        FROM user_accounts
        ORDER BY created_at DESC";

$result = $conn->query($sql);

$users = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

// Close the database connection
$conn->close();

// Return the data as a JSON object
echo json_encode($users);
?>