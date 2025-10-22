<?php
// Include the PDO connection handler
require_once 'aadb_connect_handler.php'; // Ensure this path is correct

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

// --- Refactored Database Connection ---
try {
    // connectDB() should return the PDO instance or handle the error itself
    $pdo = connectDB(); 
} catch (\PDOException $e) { 
    // Fallback error handling if connectDB throws an exception
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Database connection error: " . $e->getMessage()]));
}
// ------------------------------------


// Check if data was sent via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Use null coalescing operator to safely retrieve POST parameters
    $loan_application_id = $_POST['loan_application_id'] ?? null;
    $status = $_POST['status'] ?? null;

    if (!$loan_application_id || !$status) {
        http_response_code(400); // Bad Request
        echo json_encode(["success" => false, "message" => "Missing required POST parameters (loan_application_id or status)."]);
        exit;
    }

    // --- Conditional SQL Statement based on Status ---
    $sql = "";
    $update_message = "";

    if ($status === 'approved') {
        // When approved, update status and set release_status to the STRING 'forrelease'.
        $sql = "UPDATE loan_applications SET status = :status, release_status = 'forrelease' WHERE loan_application_id = :id";
        $update_message = "Loan status updated to 'approved' and 'release status' is set to 'forrelease'.";
    } elseif ($status === 'denied') {
        // When denied, update status and set release_status to NULL.
        $sql = "UPDATE loan_applications SET status = :status, release_status = NULL WHERE loan_application_id = :id";
        $update_message = "Loan status updated to 'denied' and 'release status' is set to NULL.";
    } else {
        // For any other status, only update the status column and set release_status to NULL (as a safeguard).
        $sql = "UPDATE loan_applications SET status = :status, release_status = NULL WHERE loan_application_id = :id";
        $update_message = "Loan status updated successfully to '{$status}'.";
    }

    // --- Execute Prepared Statement ---
    try {
        $stmt = $pdo->prepare($sql);
        
        // Bind parameters
        $stmt->bindParam(':status', $status);
        // Assuming loan_application_id is an integer
        $stmt->bindParam(':id', $loan_application_id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            // Check if any rows were actually affected
            if ($stmt->rowCount() > 0) {
                 // Echo the specific message based on the update
                echo json_encode(["success" => true, "message" => $update_message]);
            } else {
                // No rows affected (e.g., ID not found or status was already the same)
                 echo json_encode(["success" => false, "message" => "Loan application ID not found or status was already set."]);
            }
        } else {
            // Generic error 
            echo json_encode(["success" => false, "message" => "Error executing update statement."]);
        }
        
    } catch (\PDOException $e) {
        // Handle database execution error
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }

} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}

?>