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

// SQL query to fetch clients and their pending loan applications
// This query joins the clients table with the loan_applications table
// and includes both client_ID and loan_application_id in the result set.
$sql = "SELECT c.client_ID, c.last_name, c.first_name, c.created_at, l.loan_application_id
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