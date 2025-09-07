<?php
header('Content-Type: application/json');

// Dummy connection settings - REPLACE WITH YOUR ACTUAL DATABASE CREDENTIALS
$servername = "localhost";
$username = "root"; // Replace with your DB username
$password = "";     // Replace with your DB password
$dbname = "emerald_microfinance";

// 1. Check for client ID in the request
if (!isset($_GET['client_id']) || empty($_GET['client_id'])) {
    echo json_encode(["status" => "error", "message" => "Client ID not provided."]);
    exit;
}

$client_id = $_GET['client_id'];

// 2. Establish database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
    exit;
}

// 3. Prepare the SQL query using JOINs
// We join clients, client_requirements, AND loan_applications.
// Note: We use la.client_ID = c.client_ID AND la.status = 'pending' to try and get the current loan's collateral.
// If a client has multiple loans, this may not be precise, but it pulls the collateral data into the JSON.
$sql = "SELECT 
            c.*, 
            cr.has_valid_id, 
            cr.has_barangay_clearance,
            la.colateral AS cr  -- Aliased 'colateral' to 'cr' to match the HTML ID
        FROM 
            clients c 
        LEFT JOIN 
            client_requirements cr 
        ON 
            c.client_ID = cr.client_ID 
        LEFT JOIN
            loan_applications la
        ON
            c.client_ID = la.client_ID 
        WHERE 
            c.client_ID = ?
        ORDER BY 
            la.created_at DESC 
        LIMIT 1";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    echo json_encode(["status" => "error", "message" => "Failed to prepare statement: " . $conn->error]);
    $conn->close();
    exit;
}

// Bind the client ID parameter
$stmt->bind_param("s", $client_id); 

// 4. Execute the query
$stmt->execute();
$result = $stmt->get_result();

// 5. Fetch and return data
if ($result->num_rows > 0) {
    $clientData = $result->fetch_assoc();
    
    echo json_encode(["status" => "success", "data" => $clientData]);
} else {
    echo json_encode(["status" => "error", "message" => "Client not found."]);
}

// 6. Close connection
$stmt->close();
$conn->close();
?>