<?php
//PHP\toolsinterestupdate_handler.php
// Include the PDO connection function
require_once 'aadb_connect_handler.php';

/**
 * Generates the next sequential ID in the format IYYYYNNNN.
 * @param PDO $pdo The PDO database connection object.
 * @return string The new sequential interest ID.
 */
function getNextSequentialInterestID($pdo) {
    $currentYear = date('Y');
    $prefix = 'I' . $currentYear;
    $paddingLength = 4; // for 0001
    
    // 1. Find the highest existing sequence number for the current year
    $sql = "
        SELECT 
            MAX(CAST(SUBSTRING(interest_ID, 6) AS UNSIGNED)) AS max_sequence 
        FROM interest_pecent 
        WHERE interest_ID LIKE :prefix
    ";
    
    $stmt = $pdo->prepare($sql);
    $search_prefix = $prefix . '%';
    $stmt->bindParam(':prefix', $search_prefix);
    $stmt->execute();
    
    $row = $stmt->fetch();
    
    if ($row && $row['max_sequence'] !== null) {
        $nextSequence = (int)$row['max_sequence'] + 1;
    } else {
        // If no ID is found for the current year, start the sequence at 1
        $nextSequence = 1;
    }
    
    // 2. Combine the prefix and the padded sequence number
    $nextPaddedNumber = sprintf('%0' . $paddingLength . 'd', $nextSequence);
    
    return $prefix . $nextPaddedNumber;
}

// Handle AJAX request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['new_rate'])) {
    header('Content-Type: application/json');

    $pdo = null;

    try {
        // Establish Database Connection
        $pdo = connectDB(); 

        $new_rate = (int)$_POST['new_rate'];
        
        // --- Input Validation (You may expand this) ---
        if ($new_rate <= 0 || $new_rate > 100) {
            echo json_encode(['success' => false, 'message' => 'Invalid interest rate value.']);
            exit;
        }

        // 1. Deactivate current active rate (Start Transaction)
        $pdo->beginTransaction();
        
        // Deactivate all currently 'activated' rates
        $deactivate_sql = "UPDATE interest_pecent SET status = 'deactivated' WHERE status = 'activated'";
        $deactivate_stmt = $pdo->prepare($deactivate_sql);
        if (!$deactivate_stmt->execute()) {
            throw new Exception("Error deactivating old rate.");
        }

        // 2. Insert the new rate
        // *** MODIFIED: Call the new sequential ID function ***
        $interest_ID = getNextSequentialInterestID($pdo); 
        
        $insert_sql = "INSERT INTO interest_pecent (interest_ID, Interest_Pecent, status, date_created) 
                        VALUES (?, ?, 'activated', CURDATE())";
        
        $stmt = $pdo->prepare($insert_sql);

        if (!$stmt->execute([$interest_ID, $new_rate])) {
            throw new Exception("Error inserting new rate.");
        }

        // Commit transaction
        $pdo->commit();
        
        echo json_encode(['success' => true, 'new_rate' => $new_rate, 'message' => 'New interest rate activated successfully.']);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollback();
        }
        error_log("Transaction failed: " . $e->getMessage());
        // Use a generic message for the client
        echo json_encode(['success' => false, 'message' => 'Transaction failed: An error occurred during update.']);
    }
    
    exit;
}
?>