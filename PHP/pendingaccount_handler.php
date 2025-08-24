<?php
header('Content-Type: application/json');

// Database credentials
$servername = "localhost";
$username = "root"; // XAMPP default username
$password = "";     // XAMPP default password
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// SQL query to fetch clients with pending loan applications
// This query joins the clients table with the loan_applications table
// to filter by the 'status' column which is in the loan_applications table.
$sql = "SELECT c.client_ID, c.last_name, c.first_name, c.created_at 
        FROM clients c
        INNER JOIN loan_applications l ON c.client_ID = l.client_ID
        WHERE l.status = 'pending'
        ORDER BY c.created_at DESC";

$result = $conn->query($sql);

$clients = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $clients[] = $row;
    }
}

// Close the database connection
$conn->close();

// Return the data as a JSON object
echo json_encode($clients);
?>
