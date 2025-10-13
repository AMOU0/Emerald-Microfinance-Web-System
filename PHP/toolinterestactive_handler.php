<?php
//toolinterestactive_handler.php
// Configuration for Database Connection (Same as in update_interest.php)
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root'); 
define('DB_PASSWORD', '');     
define('DB_NAME', 'emerald_microfinance'); 

// Establish Database Connection
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Fetch the current active interest rate
$sql = "SELECT Interest_Pecent FROM interest_pecent WHERE status = 'activated' ORDER BY date_created DESC LIMIT 1";
$result = $conn->query($sql);
$conn->close();

header('Content-Type: application/json');

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode(['success' => true, 'rate' => $row['Interest_Pecent']]);
} else {
    // Default to 0 or a business-appropriate fallback if none is found
    echo json_encode(['success' => false, 'message' => 'No active interest rate found.']);
}
?>