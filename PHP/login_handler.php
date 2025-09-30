<?php
// Start the session at the very beginning
session_start(); 

header('Content-Type: application/json');

// 1. INCLUDE THE AUDIT TRAIL FUNCTION
require_once 'audittrail_function.php'; 

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

// NOTE: You are using plain text passwords. This is a MAJOR security vulnerability.
// You MUST use password_hash() for registration and password_verify() for login.
// I have used the correct table name 'user_accounts' as per your SQL dump.

$stmt = $conn->prepare("SELECT id, username, password_hash FROM user_accounts WHERE username = ?");
$stmt->bind_param("s", $user_username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $db_password = $row['password_hash'];
    $user_id = $row['id'];
    $username_logged_in = $row['username'];

    // WARNING: $user_password === $db_password means you are using plain text passwords.
    // Replace with a secure check like: if (password_verify($user_password, $db_password)) 
    if ($user_password === $db_password) {
        // Securely store user data in the session
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username_logged_in;
        $_SESSION['logged_in'] = true;
        
        // 2. LOG SUCCESSFUL LOGIN
        log_audit_trail($conn, $user_id, "User logged in successfully: " . $username_logged_in);

        echo json_encode(['success' => true, 'message' => 'Login successful!', 'redirect_url' => 'DashBoard.html']);
    } else {
        // 3. LOG FAILED LOGIN - INCORRECT PASSWORD
        // We still use the fetched user ID since we know the username exists
        log_audit_trail($conn, $user_id, "Failed login attempt (Incorrect Password) for user: " . $user_username); 
        
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
} else {
    // 4. LOG FAILED LOGIN - USERNAME NOT FOUND
    // Use user_id = 0 to signify an unknown or system-level event
    log_audit_trail($conn, 0, "Failed login attempt (Username Not Found) for username: " . $user_username); 
    
    echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
}

$stmt->close();
$conn->close();
?>