<?php
//PHP\audittrail_function.php
/**
 * Logs an action to the audit_logs table.
 * @param mysqli $conn The database connection object.
 * @param int $userId The ID of the user performing the action (0 for system/unknown user).
 * @param string $action The description of the action (e.g., "Navigated to Dashboard").
 * @return bool True on successful execution, false on failure.
 */
function log_audit_trail($conn, $userId, $action) {
    // Ensure the action description is not too long for the database column
    $action = substr($action, 0, 255); 

    // Prepare the SQL statement to safely insert the data
    // The created_at column will automatically use the current timestamp
    $stmt = $conn->prepare("INSERT INTO audit_logs (user_id, action) VALUES (?, ?)");

    // 'i' for integer (user_id), 's' for string (action)
    $stmt->bind_param("is", $userId, $action);

    // Execute the statement
    $success = $stmt->execute();

    // Close the statement
    $stmt->close();

    return $success;
}

?>