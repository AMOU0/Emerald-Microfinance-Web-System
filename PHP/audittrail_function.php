<?php
/**
 * Logs a user action into the audit_logs table.
 * @param mysqli $conn The database connection object.
 * @param int $userId The ID of the user performing the action.
 * @param string $action The description of the action.
 * @param string $targetTable Optional. The table affected by the action.
 * @param string $targetId Optional. The ID of the record affected.
 * @param string $beforeState Optional. JSON or text of the record state before change.
 * @param string $afterState Optional. JSON or text of the record state after change.
 * @return bool True on success, false on failure.
 */
function log_audit_trail($conn, $userId, $action, $targetTable = NULL, $targetId = NULL, $beforeState = NULL, $afterState = NULL) {
    // Get the user's IP address
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'N/A';

    // Prepare the SQL statement to prevent SQL injection
    $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, target_table, target_id, ip_address, before_state, after_state) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    // Check if preparation failed
    if ($stmt === false) {
        error_log('MySQL prepare statement failed: ' . $conn->error);
        return false; 
    }

    // Bind parameters: i for integer, s for string
    $stmt->bind_param("issssss", $userId, $action, $targetTable, $targetId, $ipAddress, $beforeState, $afterState);

    // Execute the statement
    if (!$stmt->execute()) {
        error_log('MySQL execute failed: ' . $stmt->error);
        $stmt->close();
        return false;
    }

    $stmt->close();
    return true;
}
?>