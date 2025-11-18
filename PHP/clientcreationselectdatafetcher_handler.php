<?php
// Include the PDO connection function
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
    $pdo = connectDB(); // Establish PDO connection

    switch ($request_type) {
        case 'city':
            $sql = "SELECT city_name FROM philippine_cities ORDER BY city_name ASC";
            $stmt = $pdo->query($sql);
            while ($row = $stmt->fetch()) {
                $data[] = $row['city_name'];
            }
            break;

        case 'barangay':
            if (!isset($_POST['city']) || empty($_POST['city'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing required parameter: 'city'."]);
                exit();
            }

            $sql = "SELECT barangay_name FROM philippine_barangays WHERE city_name = :city ORDER BY barangay_name ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':city', $_POST['city']);
            $stmt->execute();
            while ($row = $stmt->fetch()) {
                $data[] = $row['barangay_name'];
            }
            break;

        case 'maritalStatus':
            $sql = "SELECT DISTINCT status FROM marital_statuses ORDER BY status ASC";
            $stmt = $pdo->query($sql);
            while ($row = $stmt->fetch()) {
                $data[] = $row['status'];
            }
            break;

        case 'gender':
            $sql = "SELECT DISTINCT gender_type FROM genders ORDER BY gender_type ASC";
            $stmt = $pdo->query($sql);
            while ($row = $stmt->fetch()) {
                $data[] = $row['gender_type'];
            }
            break;

        case 'incomeSalary':
            $sql = "SELECT income_range FROM income_salaries ORDER BY id ASC";
            $stmt = $pdo->query($sql);
            while ($row = $stmt->fetch()) {
                $data[] = $row['income_range'];
            }
            break;

        case 'validId':
            $sql = "SELECT id_name FROM philippine_valid_ids ORDER BY id_name ASC";
            $stmt = $pdo->query($sql);
            while ($row = $stmt->fetch()) {
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
    // The connectDB function already handles connection errors and exits.
    // This catch is mainly for PDO execution errors, which are thrown as PDOExceptions, 
    // but we catch Exception to be safe.
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
// The PDO connection is closed when the script finishes or by setting $pdo = null (optional)
?>