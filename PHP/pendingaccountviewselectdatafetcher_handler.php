<?php
// FIX 1: session_start() MUST be the very first command to prevent "Headers already sent" errors.
session_start();

// Include the database connection function
require_once 'aadb_connect_handler.php'; 

// Set content type to application/json
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Invalid request method."]);
    exit();
}

if (!isset($_POST['type'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required parameter: 'type'."]);
    exit();
}

$request_type = $_POST['type'];
$data = [];
$pdo = null; 

try {
    // 1. Establish PDO Connection
    $pdo = connectDB(); 

    switch ($request_type) {
        case 'city':
            // CORRECT: philippine_cities has 'city_name'
            $sql = "SELECT city_name FROM philippine_cities ORDER BY city_name ASC";
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_COLUMN, 0); 
            break;

        case 'barangay':
            if (!isset($_POST['city']) || empty($_POST['city'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing required parameter: 'city' for barangay fetch."]);
                exit();
            }
            $city = $_POST['city'];
            // FIX 2: The philippine_barangays table links directly by 'city_name'. No JOIN is needed.
            $sql = "SELECT barangay_name FROM philippine_barangays WHERE city_name = ? ORDER BY barangay_name ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$city]);
            $data = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            break;
            
        case 'maritalStatus':
            // FIX 3: The marital_statuses table uses column 'status', not 'status_name'.
            $sql = "SELECT DISTINCT status FROM marital_statuses ORDER BY status ASC";
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            break;
            
        case 'gender':
            // CORRECT: genders table uses 'gender_type'
            $sql = "SELECT DISTINCT gender_type FROM genders ORDER BY gender_type ASC";
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            break;

        case 'incomeSalary':
            $sql = "SELECT income_range FROM income_salaries ORDER BY id ASC";
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            break;

        case 'validId':
            $sql = "SELECT id_name FROM philippine_valid_ids ORDER BY id_name ASC";
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            break;

        default:
            http_response_code(400);
            echo json_encode(["error" => "Invalid 'type' parameter provided."]);
            exit();
    }

    echo json_encode($data);

} catch (Exception $e) {
    // Catch PDO/General exceptions
    http_response_code(500);
    error_log("Data Fetcher Error: " . $e->getMessage());
    echo json_encode(["error" => "Server error: Failed to retrieve data for dropdowns."]);
}
?>