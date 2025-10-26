<?php
header('Content-Type: application/json');

// Include the PDO connection function
require_once 'aadb_connect_handler.php';

$pdo = null;

try {
    // --- 1. Database Configuration (using PDO) ---
    $pdo = connectDB(); 

    // --- 2. Input Validation (Server-Side) ---
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405); // Method Not Allowed
        echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
        exit();
    }

    // Check for required fields
    $required_fields = ['name', 'email', 'username', 'password', 'role'];
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
            echo json_encode(['success' => false, 'message' => 'All fields are required.']);
            exit();
        }
    }

    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $username = trim($_POST['username']);
    $password = $_POST['password']; // Plain text password
    $role = $_POST['role'];

    // Validate role against allowed ENUM values
    $allowed_roles = ['Admin', 'Manager', 'Loan_Officer'];
    if (!in_array($role, $allowed_roles)) {
        echo json_encode(['success' => false, 'message' => 'Invalid role selected.']);
        exit();
    } 

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        exit();
    }

    // Add password strength validation (Recommended)
    if (strlen($password) < 8) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long.']);
        exit();
    }

    // --- 3. Check for Existing User (Email or Username) ---
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM User_Accounts WHERE email = ? OR username = ?");
    $stmt->execute([$email, $username]);
    $count = $stmt->fetchColumn();

    if ($count > 0) {
        echo json_encode(['success' => false, 'message' => 'Email or username already exists.']);
        exit();
    }

    // CRITICAL SECURITY FIX: Hash the password before storage
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Set the default status for a newly created account
    $status = 'Active'; 

    // --- 4. SQL Insertion with Prepared Statements ---
    // Added 'status' to the columns and a placeholder '?' for its value.
    $sql = "INSERT INTO User_Accounts (name, email, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);

    // Bind the HASHED password and status to the statement
    if ($stmt->execute([$name, $email, $username, $hashed_password, $role, $status])) {
        // --- 5. Success Response ---
        echo json_encode(['success' => true, 'message' => 'Account created successfully!']);
    } else {
        // --- 6. Error Handling (PDO will throw an exception on execution error, but good practice to check) ---
        error_log("User creation failed: " . json_encode($stmt->errorInfo()));
        echo json_encode(['success' => false, 'message' => 'An error occurred during account creation.']);
    }

} catch (PDOException $e) {
    error_log("PDO Error in usercreation: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An internal error occurred.']);
} catch (Exception $e) {
    error_log("General Error in usercreation: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An internal error occurred.']);
}
?>