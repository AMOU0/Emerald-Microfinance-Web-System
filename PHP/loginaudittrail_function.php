<?php
// loginaudittrail_function.php - PDO Version

/**
 * Logs an action to the audit_logs table using a PDO connection.
 * * NOTE: The first parameter $conn MUST be a valid PDO connection object.
 *
 * @param PDO $conn The PDO database connection object.
 * @param int $userId The ID of the user performing the action (0 for system/unknown).
 * @param string $action A description of the action.
 * @param string|null $targetTable The table affected by the action.
 * @param int|null $targetId The ID of the record affected.
 * @param string|null $beforeState JSON string of data before the change.
 * @param string|null $afterState JSON string of data after the change.
 * @return bool True on success, false on failure.
 */
function log_audit_trail($conn, $userId, $action, $targetTable = NULL, $targetId = NULL, $beforeState = NULL, $afterState = NULL) {
    // Get the user's IP address
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'N/A';

    // Prepare the SQL statement with question mark placeholders (?) for PDO
    $sql = "INSERT INTO audit_logs (user_id, action, target_table, target_id, ip_address, before_state, after_state) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    try {
        $stmt = $conn->prepare($sql);
    } catch (\PDOException $e) {
        // Log preparation failure
        error_log('PDO prepare statement failed: ' . $e->getMessage());
        return false; 
    }

    // Create an array of parameters to pass to the execute method
    $params = [
        $userId,
        $action,
        $targetTable,
        $targetId,
        $ipAddress,
        $beforeState,
        $afterState
    ];

    // Execute the statement. PDO binds the parameters automatically based on their position.
    if (!$stmt->execute($params)) { 
        // Log execution failure
        error_log('PDO execute failed: ' . implode(" ", $stmt->errorInfo()));
        return false;
    }

    // Closing the statement is often implicit or done by setting it to null in PDO
    // For clarity, we can explicitly set it to null.
    $stmt = null; 
    
    return true;
}
?>