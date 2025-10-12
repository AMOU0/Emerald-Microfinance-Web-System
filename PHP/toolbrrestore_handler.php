<?php
// restore.php
header('Content-Type: application/json');

// 1. Include the connection handler to get credentials
require_once 'aadb_connect_handler.php';

// Check for file upload
if (empty($_FILES['restore_file'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No file uploaded.']);
    exit;
}

$file = $_FILES['restore_file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'File upload failed with error code ' . $file['error'] . '.']);
    exit;
}

// ===================================================================
// **ATTENTION: FIXED PATH using the user-provided XAMPP path**
// We use forward slashes for better compatibility across systems, 
// even though it's Windows.
$mysql_path = 'E:/APPLICATIONS/XAMPP/mysql/bin/mysql.exe'; 
// ===================================================================

$temp_file = $file['tmp_name'];

// 3. Construct the mysql import command
// Note: On Windows, you might need to wrap the command in 'cmd /c ""...' 
// but using escapeshellarg() on the full path often suffices.
$command = sprintf(
    // Now uses the explicit path ($mysql_path) instead of just 'mysql'
    '"%s" -h%s -u%s -p%s %s < %s', // Added quotes around the path for safety
    escapeshellarg($mysql_path),
    escapeshellarg(DB_HOST),
    escapeshellarg(DB_USER),
    escapeshellarg(DB_PASS),
    escapeshellarg(DB_NAME),
    escapeshellarg($temp_file)
);

// 4. Execute the command
// Note: We use the third argument ($worked) to capture the return code.
exec($command, $output, $worked);

// 5. Check the result and output a JSON response
if ($worked === 0) {
    echo json_encode(['success' => true, 'message' => 'Database successfully restored from ' . basename($file['name']) . '.']);
} else {
    http_response_code(500);
    $errorMessage = "Database restore failed (code: {$worked}). Verify credentials in aadb_connect_handler.php and ensure XAMPP is running.";
    
    if (!empty($output)) {
        // Output from the shell (might contain MySQL error message)
        $errorMessage .= ' Details: ' . implode(' | ', $output);
    }
    error_log("Restore failure details: " . $errorMessage);
    echo json_encode(['success' => false, 'message' => $errorMessage]);
}
?>