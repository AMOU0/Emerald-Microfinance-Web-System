<?php
// Start the session at the very beginning
session_start();

header('Content-Type: application/json');

// 1. INCLUDE THE AUDIT TRAIL FUNCTION
require_once 'loginaudittrail_function.php'; // Requires PDO-compatible version

// INCLUDE THE DATABASE CONNECTION HANDLER
require_once 'aadb_connect_handler.php'; // Include the file with connectDB()

// Establish PDO connection
try {
    $pdo = connectDB();
} catch (\PDOException $e) {
    exit;
}

$input_data = file_get_contents('php://input');
$data = json_decode($input_data, true);

$user_username = $data['username'] ?? '';
$user_password = $data['password'] ?? '';

if (empty($user_username) || empty($user_password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit();
}

// ⭐ MODIFIED: Select the 'status' AND 'role' column from the database
$stmt = $pdo->prepare("SELECT id, username, password_hash, status, role FROM user_accounts WHERE username = :username");
$stmt->bindParam(':username', $user_username);
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC); 

if ($row) {
    $db_hashed_password = $row['password_hash'];
    $user_id = $row['id'];
    $username_logged_in = $row['username'];
    $account_status = $row['status']; // Get the account status
    $user_role = $row['role']; // ⭐ NEW: Get the user role

    // ⭐ NEW: Check if the account is deactivated
    if (strtolower($account_status) === 'deactive') {
        log_audit_trail($pdo, $user_id, "Failed login attempt (Account Deactivated) for user: " . $user_username);
        // Do not disclose the specific reason to the user for security
        echo json_encode(['success' => false, 'message' => 'Your account is currently inactive. Please contact support.']);
        exit();
    }

    // SECURITY: VERIFY THE PASSWORD AGAINST THE HASH
    if (password_verify($user_password, $db_hashed_password)) {
        // Success! Password and status are both valid.
        
        // Securely store user data in the session
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username_logged_in;
        $_SESSION['logged_in'] = true;
        $_SESSION['role'] = $user_role; // ⭐ NEW: Store the user role

        // 2. LOG SUCCESSFUL LOGIN
        log_audit_trail($pdo, $user_id, "User logged in successfully: " . $username_logged_in . " with role: " . $user_role);

        // ⭐ NEW: Determine redirect URL based on role
        $redirect_page = '';
        switch (strtolower($user_role)) {
            case 'admin':
                $redirect_page = 'DashBoard.html';
                break;
            case 'manager':
                $redirect_page = 'DashBoard.html';
                break;
            case 'loan officer':
                $redirect_page = 'DashBoard.html';
                break;
            default:
                $redirect_page = '404.html'; // Fallback
                break;
        }

        echo json_encode(['success' => true, 'message' => 'Login successful!', 'redirect_url' => $redirect_page]);
    } else {
        // 3. LOG FAILED LOGIN - INCORRECT PASSWORD
        log_audit_trail($pdo, $user_id, "Failed login attempt (Incorrect Password) for user: " . $user_username);

        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
} else {
    // 4. LOG FAILED LOGIN - USERNAME NOT FOUND
    log_audit_trail($pdo, 0, "Failed login attempt (Username Not Found) for username: " . $user_username);

    echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
}
?>