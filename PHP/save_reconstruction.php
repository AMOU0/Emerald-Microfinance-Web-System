<?php

header('Content-Type: application/json');

// Database connection parameters
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

// Create a new MySQLi connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => "Connection failed: " . $conn->connect_error]);
    exit();
}

// Check if the request method is POST and if required data is set
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['loan_application_id'])) {
    
    // Sanitize and validate input data
    $loan_application_id = $_POST['loan_application_id'];
    $reconstruct_amount = $_POST['reconstruct_amount'];
    $payment_frequency = $_POST['payment_frequency'];
    $interest_rate = $_POST['interest_rate'];
    $date_start = $_POST['date_start'];
    $duration = $_POST['duration'];
    $date_end = $_POST['date_end'];

    // Prepare the SQL statement to insert data into loan_reconstruct table
    $stmt = $conn->prepare("INSERT INTO loan_reconstruct (loan_application_id, reconstruct_amount, payment_frequency, interest_rate, date_start, duration, date_end) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
        exit();
    }

    // Corrected bind_param: The type specifier for 'payment_frequency' must be 's' (string)
    $stmt->bind_param("sdsisss", 
        $loan_application_id, 
        $reconstruct_amount, 
        $payment_frequency, 
        $interest_rate,
        $date_start, 
        $duration, 
        $date_end
    );
    
    // Execute the statement
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }

    // Close the statement
    $stmt->close();

} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method or missing data.']);
}

// Close the database connection
$conn->close();

?>