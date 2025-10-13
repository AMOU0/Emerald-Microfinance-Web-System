<?php
header('Content-Type: application/json');

// --- 1. Database Configuration (using mysqli) ---
$servername = "localhost";
$username = "root"; // Replace with your database username
$password = "";     // Replace with your database password
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed. Please try again later.']);
    exit();
}

// --- 2. Input Validation (Server-Side) ---
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    $conn->close();
    exit();
}

// Check for required fields
$required_fields = ['name', 'email', 'username', 'password', 'role'];
foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        $conn->close();
        exit();
    }
}

$name = trim($_POST['name']);
$email = trim($_POST['email']);
$username = trim($_POST['username']);
$password = $_POST['password']; // Password is now in plain text
$role = $_POST['role'];

// Validate role against allowed ENUM values
$allowed_roles = ['Admin', 'loan-officer', 'Recruiter'];
if (!in_array($role, $allowed_roles)) {
    echo json_encode(['success' => false, 'message' => 'Invalid role selected.']);
    $conn->close();
    exit();
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
    $conn->close();
    exit();
}

// --- 3. Check for Existing User (Email or Username) ---
$stmt = $conn->prepare("SELECT COUNT(*) FROM User_Accounts WHERE email = ? OR username = ?");
if ($stmt === false) {
    error_log("Prepare statement failed: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'An internal error occurred.']);
    $conn->close();
    exit();
}
$stmt->bind_param("ss", $email, $username);
$stmt->execute();
$stmt->bind_result($count);
$stmt->fetch();
$stmt->close();

if ($count > 0) {
    echo json_encode(['success' => false, 'message' => 'Email or username already exists.']);
    $conn->close();
    exit();
}
 
// --- 4. SQL Insertion with Prepared Statements ---
// Note: password_hash column name is still used but will store the plain text password
$sql = "INSERT INTO User_Accounts (name, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
if ($stmt === false) {
    error_log("Prepare statement failed: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'An internal error occurred.']);
    $conn->close();
    exit();
}

// The plain text password is now bound to the statement
$stmt->bind_param("sssss", $name, $email, $username, $password, $role);

if ($stmt->execute()) {
    // --- 5. Success Response ---
    echo json_encode(['success' => true, 'message' => 'Account created successfully!']);
} else {
    // --- 6. Error Handling ---
    error_log("User creation failed: " . $stmt->error);
    echo json_encode(['success' => false, 'message' => 'An error occurred during account creation.']);
}

// Close the statement and connection
$stmt->close();
$conn->close();
?>