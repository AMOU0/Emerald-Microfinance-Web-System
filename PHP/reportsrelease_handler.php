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
        
        // --- START TRANSACTION ---
        // Begin a transaction to ensure both INSERT and UPDATE operations are atomic.
        $pdo->beginTransaction();

        // 1. FETCH client_ID for the 'released' table entry
        $sql_fetch_client = "
            SELECT client_ID 
            FROM loan_applications 
            WHERE loan_application_id = :loan_id
        ";
        $stmt_fetch = $pdo->prepare($sql_fetch_client);
        $stmt_fetch->bindParam(':loan_id', $loan_id, PDO::PARAM_STR);
        $stmt_fetch->execute();
        $client_id = $stmt_fetch->fetchColumn();

        if (!$client_id) {
            throw new Exception("Loan application ID {$loan_id} not found.");
        }

        // 2. UPDATE loan_applications status and dates
        // Checks 'release_status <> 'Released'' to prevent double processing.
        $sql_update = "
            UPDATE loan_applications 
            SET 
                release_status = 'Released',
                date_start = CURDATE(), 
                date_end = DATE_ADD(CURDATE(), INTERVAL 100 DAY) 
            WHERE 
                loan_application_id = :loan_id 
                AND release_status = 'forrelease' -- Only release loans that are currently marked 'forrelease'
        ";
        
        $stmt_update = $pdo->prepare($sql_update);
        $stmt_update->bindParam(':loan_id', $loan_id, PDO::PARAM_STR);

        if ($stmt_update->execute()) {
            // Check if any row was actually updated
            if ($stmt_update->rowCount() === 0) {
                // If 0 rows updated, it means the loan was already released or not found/ready.
                throw new Exception("Loan ID {$loan_id} was not updated. It may have already been released or is not ready for release.");
            }
            
            // 3. INSERT record into the 'released' table
            // This is the action that saves the release audit trail.
            $sql_insert_release = "
                INSERT INTO released 
                    (client_ID, loan_application_id) 
                VALUES 
                    (:client_id, :loan_id)
            ";
            $stmt_insert = $pdo->prepare($sql_insert_release);
            $stmt_insert->bindParam(':client_id', $client_id, PDO::PARAM_STR);
            $stmt_insert->bindParam(':loan_id', $loan_id, PDO::PARAM_STR);
            $stmt_insert->execute();

            // --- COMMIT TRANSACTION ---
            // If both UPDATE and INSERT succeeded, commit the changes.
            $pdo->commit();

            $response['success'] = true;
            $response['message'] = "Report for Loan ID {$loan_id} successfully released. Record saved to 'released' table.";
            
        } else {
            // If update failed for other database reasons
            throw new Exception("Database Update failed on loan_applications table: " . implode(" ", $stmt_update->errorInfo()));
        }
    } else {
        $response['message'] = "Invalid request method or missing Loan ID.";
    }

} catch (Exception $e) {
    // --- ROLLBACK TRANSACTION ---
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Update the error message
    $response['message'] = "Release Failed: " . $e->getMessage();
    error_log("Release Loan Error: " . $e->getMessage());

} catch (PDOException $e) {
    // --- ROLLBACK TRANSACTION for PDO errors ---
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $response['message'] = "Database Connection or Query Error: " . $e->getMessage();
    error_log("PDO Error: " . $e->getMessage());
}

echo json_encode($response);
?>