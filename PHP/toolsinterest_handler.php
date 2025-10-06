<?php
// PHP/toolsinterest_function.php

// Define the connection details (omitted for brevity)
$servername = "localhost";
$username = "root"; 
$password = "";
$dbname = "emerald_microfinance";

// Set JSON header for the response
header('Content-Type: application/json');

// Connect to the database
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    // ... (Error handling remains the same)
    echo json_encode([
        'success' => false, 
        'data' => [], 
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit(); 
}

// --- Fetch Data from interest_pecent Table ---
// MODIFIED: Added secondary sort by interest_ID DESC to handle same-day insertions.
$sql = "SELECT interest_ID, Interest_Pecent, status, date_created 
        FROM interest_pecent 
        ORDER BY date_created DESC, interest_ID DESC";
        
$result = $conn->query($sql);

$interest_rates = [];

if ($result) {
    if ($result->num_rows > 0) {
        // Fetch all rows into an array
        while($row = $result->fetch_assoc()) {
            $interest_rates[] = $row;
        }
        // Return success with the fetched data
        echo json_encode([
            'success' => true, 
            'data' => $interest_rates
        ]);
    } else {
        // ... (Empty data handling remains the same)
        echo json_encode([
            'success' => true, 
            'data' => [], 
            'message' => 'No interest rates found in the database.'
        ]);
    }
} else {
    // ... (SQL failure handling remains the same)
    echo json_encode([
        'success' => false, 
        'data' => [], 
        'message' => 'SQL query failed: ' . $conn->error
    ]);
}

// Close the database connection
$conn->close();
?>