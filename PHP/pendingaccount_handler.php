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

// SQL query to fetch pending loan applications
// IMPORTANT: This query joins 'loan_applications' and 'clients' tables.
$sql = "SELECT 
            la.loan_application_id, 
            la.client_ID, 
            c.first_name, 
            c.last_name,
            la.loan_amount,
            la.created_at
        FROM loan_applications AS la
        JOIN clients AS c ON la.client_ID = c.client_ID
        WHERE la.status = 'pending' 
        ORDER BY la.created_at DESC";

$result = $conn->query($sql);

$pending_accounts = [];

if ($result->num_rows > 0) {
    // Fetch all rows and add to the array
    while($row = $result->fetch_assoc()) {
        $pending_accounts[] = [
            'loan_application_id' => $row['loan_application_id'],
            'client_ID' => $row['client_ID'],
            'first_name' => htmlspecialchars($row['first_name']),
            'last_name' => htmlspecialchars($row['last_name']),
            'loan_amount' => $row['loan_amount'],
            'created_at' => date("F j, Y, g:i a", strtotime($row['created_at']))
        ];
    }
}

// Return the data as a JSON object
echo json_encode($pending_accounts);

$conn->close();
?>