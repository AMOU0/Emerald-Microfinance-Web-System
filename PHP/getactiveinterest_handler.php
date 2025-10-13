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
    echo json_encode(['status' => 'error', 'message' => "Connection failed: " . $conn->connect_error]);
    exit();
}

try {
    // Fetch the active interest rate from the 'interest_pecent' table
    $sql = "SELECT Interest_Pecent FROM interest_pecent WHERE status = 'activated'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo json_encode(['status' => 'success', 'interestRate' => (int)$row['Interest_Pecent']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => "No active interest rate found."]);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => "Query failed: " . $conn->error]);
} finally {
    $conn->close();
}
?>