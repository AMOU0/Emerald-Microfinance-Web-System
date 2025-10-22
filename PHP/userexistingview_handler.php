<?php
// PHP/userexistingview_handler.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
header('Content-Type: application/json');

// 1. LOCAL DATABASE CONNECTION FUNCTION (Replacing external file)
function connectDB() {
    // !! IMPORTANT !! Replace with your actual database connection details
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'emerald_microfinance'); 
    define('DB_USER', 'root'); // Your actual username
    define('DB_PASS', '');     // Your actual password (often empty or 'root' for XAMPP/MAMP)
    
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (\PDOException $e) {
        // Log the error (optional) and return a standard JSON error response
        error_log("DB Connection Error: " . $e->getMessage());
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed. Please check credentials.']);
        exit;
    }
}

// Start session (needed to retrieve the user's role)
session_start();

// Utility function to get the logged-in user's role
function getLoggedInUserRole() {
    // IMPORTANT: Ensure $_SESSION['user_role'] is set upon login.
    return $_SESSION['user_role'] ?? 'loan-officer'; 
}

try {
    $db = connectDB(); 
    $loggedInRole = getLoggedInUserRole();

    // =========================================================
    // 2. HANDLE GET REQUEST: Fetch User Data (Read)
    // =========================================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userIdToView = $_GET['user_id'] ?? null;

        if ($userIdToView) {
            // SECURITY: DO NOT select the password_hash field.
            // Assuming your users table is named 'users' based on field names
            $sql = "SELECT user_id, username, first_name, last_name, email, role FROM users WHERE user_id = :user_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':user_id', $userIdToView, PDO::PARAM_INT);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                $user['current_user_role'] = $loggedInRole;
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found.']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID is required.']);
        }
        exit;
    }

    // =========================================================
    // 3. HANDLE POST REQUEST: Update User Data (Admin Constraint)
    // =========================================================
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $userIdToUpdate = filter_input(INPUT_POST, 'user_id', FILTER_SANITIZE_NUMBER_INT);
        $newPassword = $_POST['password'] ?? '';
        $newRole = filter_input(INPUT_POST, 'role', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $newFirstName = filter_input(INPUT_POST, 'first_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS); // NEW
        $newLastName = filter_input(INPUT_POST, 'last_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);   // NEW
        $newEmail = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);                        // NEW
        $newUsername = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_FULL_SPECIAL_CHARS);    // NEW
        
        $updates = [];
        $params = [];
        $passwordChanged = false;

        // --- A. General User Info Update Constraint: Only Admin can change ---
        if ($loggedInRole === 'Admin') {
            if (!empty($newFirstName)) {
                $updates[] = 'first_name = :first_name';
                $params[':first_name'] = $newFirstName;
            }
            if (!empty($newLastName)) {
                $updates[] = 'last_name = :last_name';
                $params[':last_name'] = $newLastName;
            }
            if (!empty($newEmail)) {
                $updates[] = 'email = :email';
                $params[':email'] = $newEmail;
            }
            if (!empty($newUsername)) {
                $updates[] = 'username = :username';
                $params[':username'] = $newUsername;
            }
            if (!empty($newRole)) {
                $updates[] = 'role = :role';
                $params[':role'] = $newRole;
            }

            // --- Password Update (if an Admin is performing it) ---
            if (!empty($newPassword)) {
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $updates[] = 'password_hash = :password_hash'; 
                $params[':password_hash'] = $hashedPassword;
                $passwordChanged = true;
            }
        } else {
             // Non-Admin is not authorized to update any of these fields in this handler.
             if (!empty($newPassword) || !empty($newRole) || !empty($newFirstName) || !empty($newLastName) || !empty($newEmail) || !empty($newUsername)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden: Only an Admin can update this user\'s details.']);
                exit;
             }
        }

        if (empty($updates)) {
            echo json_encode(['success' => false, 'message' => 'No data provided for update or unauthorized changes.']);
            exit;
        }

        $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE user_id = :user_id";
        $params[':user_id'] = $userIdToUpdate;

        $stmt = $db->prepare($query);
        $stmt->execute($params);

        $message = 'User account updated successfully.';
        if ($passwordChanged) {
            $message .= ' Password was reset.';
        }
        echo json_encode(['success' => true, 'message' => $message]);
        
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);

} catch (Throwable $e) {
    error_log("Script Error: " . $e->getMessage() . " on line " . $e->getLine());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'A critical server error occurred. Check server logs.'
    ]);
    exit;
}
?>