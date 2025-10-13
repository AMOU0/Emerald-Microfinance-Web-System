<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
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
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// Check if data was sent via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $loan_application_id = $_POST['loan_application_id'];
    $status = $_POST['status'];

    // Use a prepared statement to prevent SQL injection
    $sql = "UPDATE loan_applications SET status = ? WHERE loan_application_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $status, $loan_application_id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Loan status updated successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Error updating record: " . $conn->error]);
    }

    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}

$conn->close();
?>