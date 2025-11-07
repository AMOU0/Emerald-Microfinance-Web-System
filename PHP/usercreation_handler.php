<?php
header('Content-Type: application/json');

// Include the PDO connection function
require_once 'aadb_connect_handler.php'; // Assuming this file establishes the $pdo connection

$pdo = null;

try {
    // --- 1. Database Configuration (using PDO) ---
    // Establish PDO connection
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
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Invalid role specified.']);
        exit();
    }
    
    // --- 3. Data Preparation ---
    // Hash the password before storage
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Set the default status for a newly created account
    $status = 'Active'; 

    // --- 4. SQL Insertion with Prepared Statements ---
    $sql = "INSERT INTO User_Accounts (name, email, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);

    // Bind the HASHED password and status to the statement
    if ($stmt->execute([$name, $email, $username, $hashed_password, $role, $status])) {
        
        // --- 5. Success Response ---
        // ✅ CRITICAL FIX: Get the ID of the last inserted row
        $newUserId = $pdo->lastInsertId();

        // ✅ CRITICAL FIX: Include the new ID in the JSON response as 'userId'
        echo json_encode(['success' => true, 'message' => 'Account created successfully!', 'userId' => $newUserId]);
        
    } else {
        // --- 6. Error Handling ---
        // Log the PDO error info for debugging
        error_log("User creation failed: " . json_encode($stmt->errorInfo()));
        echo json_encode(['success' => false, 'message' => 'An error occurred during account creation.']);
    }

} catch (PDOException $e) {
    // Log the specific PDO exception
    error_log("PDO Error in usercreation: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An internal error occurred. Please check logs.']);
} catch (Exception $e) {
    // Log other unexpected errors
    error_log("General Error in usercreation: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}
?>