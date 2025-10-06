<?php
//PHP\toolsinterestupdate_handler.php
// Configuration for Database Connection (remains the same)
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root'); 
define('DB_PASSWORD', ''); 
define('DB_NAME', 'emerald_microfinance'); 

// Establish Database Connection
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
    // ... (Error handling remains the same)
    die("Connection failed: " . $conn->connect_error);
}

/**
 * Generates the next sequential ID in the format IYYYYNNNN.
 * @param mysqli $conn The database connection object.
 * @return string The new sequential interest ID.
 */
function getNextSequentialInterestID($conn) {
    $currentYear = date('Y');
    $prefix = 'I' . $currentYear;
    $paddingLength = 4; // for 0001
    
    // 1. Find the highest existing sequence number for the current year
    // We search for IDs starting with 'I' + Current Year and extract the 
    // numerical part to find the maximum.
    $sql = "
        SELECT 
            MAX(CAST(SUBSTRING(interest_ID, 6) AS UNSIGNED)) AS max_sequence 
        FROM interest_pecent 
        WHERE interest_ID LIKE '{$prefix}%'
    ";
    
    $result = $conn->query($sql);
    
    if ($result && $row = $result->fetch_assoc()) {
        $nextSequence = (int)$row['max_sequence'] + 1;
    } else {
        // If no ID is found for the current year, start the sequence at 1
        $nextSequence = 1;
    }
    
    // 2. Combine the prefix and the padded sequence number
    // sprintf('%04d', $nextSequence) ensures it's padded with leading zeros (e.g., 1 -> 0001)
    $nextPaddedNumber = sprintf('%0' . $paddingLength . 'd', $nextSequence);
    
    return $prefix . $nextPaddedNumber;
}

// Handle AJAX request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['new_rate'])) {
    header('Content-Type: application/json');

    $new_rate = (int)$_POST['new_rate'];
    
    // ... (Validation remains the same)

    // 1. Deactivate current active rate (Start Transaction)
    $conn->begin_transaction();
    
    try {
        // Deactivate all currently 'activated' rates (remains the same)
        $deactivate_sql = "UPDATE interest_pecent SET status = 'deactivated' WHERE status = 'activated'";
        if (!$conn->query($deactivate_sql)) {
            throw new Exception("Error deactivating old rate: " . $conn->error);
        }

        // 2. Insert the new rate
        // *** MODIFIED: Call the new sequential ID function ***
        $interest_ID = getNextSequentialInterestID($conn); 
        
        $insert_sql = "INSERT INTO interest_pecent (interest_ID, Interest_Pecent, status, date_created) 
                        VALUES (?, ?, 'activated', CURDATE())";
        
        $stmt = $conn->prepare($insert_sql);
        $stmt->bind_param("si", $interest_ID, $new_rate);

        if (!$stmt->execute()) {
            throw new Exception("Error inserting new rate: " . $stmt->error);
        }

        // Commit transaction
        $conn->commit();
        
        echo json_encode(['success' => true, 'new_rate' => $new_rate, 'message' => 'New interest rate activated successfully.']);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Transaction failed: ' . $e->getMessage()]);
    }
    
    $conn->close();
    exit;
}
// ... (The rest of the file remains the same)
?>