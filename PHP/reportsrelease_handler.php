<?php
header('Content-Type: application/json');

// Include your database connection handler
require_once 'aadb_connect_handler.php'; 

$response = [
    'success' => false,
    'message' => 'An unknown error occurred.'
];

try {
    // Check for POST request and Loan ID
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['loan_id'])) {
        $loan_id = trim($_POST['loan_id']);
        
        if (empty($loan_id)) {
            $response['message'] = "Loan ID is missing.";
            echo json_encode($response);
            exit;
        }

        // Establish PDO connection
        $pdo = connectDB();

        // Prepare SQL Statement for update
        // 1. Corrected column name to 'loan_application_id' (from reportsrelease_handler.php modification)
        // 2. Updated 'date_start' to the current date using CURDATE()
        // 3. Calculated 'date_end' by adding 100 days to the new 'date_start' using DATE_ADD()
        // 4. Also updated 'release_status' to 'Released'
 // In reportsrelease_handler.php

// Prepare SQL Statement for update
$sql = "
    UPDATE loan_applications 
    SET 
        release_status = 'Released',
        date_start = DATE_ADD(CURDATE(), INTERVAL 1 DAY), -- MODIFIED: Adds 1 day to the current date
        date_end = DATE_ADD(CURDATE(), INTERVAL 101 DAY)  -- MODIFIED: End date moves with the start date (100 days from start)
    WHERE 
        loan_application_id = :loan_id
";
        
        $stmt = $pdo->prepare($sql);
        // Note: The JavaScript passes the value as 'loan_id', but it corresponds to 'loan_application_id' in the DB.
        $stmt->bindParam(':loan_id', $loan_id, PDO::PARAM_STR);

        if ($stmt->execute()) {
            // Check if any row was actually updated
            if ($stmt->rowCount() > 0) {
                $response['success'] = true;
                $response['message'] = "Report for Loan ID {$loan_id} successfully released. Date start and end have been updated.";
            } else {
                $response['message'] = "Loan ID {$loan_id} not found or status already 'Released'.";
            }
        } else {
            $response['message'] = "Database Update failed.";
        }
    } else {
        $response['message'] = "Invalid request method or missing Loan ID.";
    }

} catch (PDOException $e) {
    $response['message'] = "Database Error: " . $e->getMessage();
}

echo json_encode($response);
?>