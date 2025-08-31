<?php
header('Content-Type: application/json');

// Database connection details
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Get the client ID from the GET request
$clientId = $_GET['client_id'] ?? null;

if (!$clientId) {
    echo json_encode(['status' => 'error', 'message' => 'Client ID not provided.']);
    exit();
}

// Prepare the SQL statement to prevent SQL injection
$sql = "SELECT * FROM loan_applications WHERE client_ID = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare SQL statement.']);
    $conn->close();
    exit();
}

$stmt->bind_param("s", $clientId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $loans = [];
    while ($row = $result->fetch_assoc()) {
        $loans[] = $row;
    }
    echo json_encode(['status' => 'success', 'data' => $loans]);
} else {
    echo json_encode(['status' => 'success', 'data' => [], 'message' => 'No loan applications found for this client.']);
}

$stmt->close();
$conn->close();
?>