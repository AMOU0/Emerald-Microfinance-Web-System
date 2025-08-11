<?php
header('Content-Type: application/json');

// Database credentials
$servername = "localhost";
$username = "root"; // XAMPP default username
$password = "";     // XAMPP default password
$dbname = "emerald_microfinance";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => "Connection failed: " . $conn->connect_error]));
}

$input_data = file_get_contents('php://input');
$data = json_decode($input_data, true);

$user_username = $data['username'] ?? '';
$user_password = $data['password'] ?? '';

if (empty($user_username) || empty($user_password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit();
}

$stmt = $conn->prepare("SELECT password FROM users WHERE username = ?");
$stmt->bind_param("s", $user_username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $db_password = $row['password'];

    if ($user_password === $db_password) {
        echo json_encode(['success' => true, 'message' => 'Login successful!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
}

$stmt->close();
$conn->close();
?>