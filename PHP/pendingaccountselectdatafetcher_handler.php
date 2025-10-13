<?php
// Database connection details
$servername = 'localhost';
$username = 'root';
$password = ''; // CHANGE THIS IF YOU HAVE A MYSQL PASSWORD
$dbname = 'emerald_microfinance';

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
$conn = null;

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    switch ($request_type) {
        case 'city':
            // 💡 CHANGE HERE: Use philippine_cities table instead of clients
            $sql = "SELECT city_name FROM philippine_cities ORDER BY city_name ASC";
            $result = $conn->query($sql);
            while ($row = $result->fetch_assoc()) {
                $data[] = $row['city_name'];
            }
            break;

        case 'barangay':
            if (!isset($_POST['city']) || empty($_POST['city'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing required parameter: 'city'."]);
                exit();
            }
            
            // FIX: Query the philippine_barangays table, which contains initial data
            $sql = "SELECT barangay_name FROM philippine_barangays WHERE city_name = ? ORDER BY barangay_name ASC";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $_POST['city']);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $data[] = $row['barangay_name'];
            }
            $stmt->close();
            break;

        case 'maritalStatus':
            $sql = "SELECT DISTINCT status FROM marital_statuses ORDER BY status ASC";
            $result = $conn->query($sql);
            while ($row = $result->fetch_assoc()) {
                $data[] = $row['status'];
            }
            break;
            
        case 'gender':
            $sql = "SELECT DISTINCT gender_type FROM genders ORDER BY gender_type ASC";
            $result = $conn->query($sql);
            while ($row = $result->fetch_assoc()) {
                $data[] = $row['gender_type'];
            }
            break;

        case 'incomeSalary':
            $sql = "SELECT income_range FROM income_salaries ORDER BY id ASC";
            $result = $conn->query($sql);
            while ($row = $result->fetch_assoc()) {
                $data[] = $row['income_range'];
            }
            break;

        case 'validId':
            $sql = "SELECT id_name FROM philippine_valid_ids ORDER BY id_name ASC";
            $result = $conn->query($sql);
            while ($row = $result->fetch_assoc()) {
                $data[] = $row['id_name'];
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(["error" => "Invalid 'type' parameter provided."]);
            exit();
    }

    echo json_encode($data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>