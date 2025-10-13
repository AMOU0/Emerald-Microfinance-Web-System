<?php
// toolbrbackup_handler.php (Final and Robust Fix for Backup)

// 1. Include the connection handler to get credentials
require_once 'aadb_connect_handler.php';

// ===================================================================
// CRITICAL FIX 1: Define the explicit path to the mysqldump executable.
// The executable's name is usually 'mysqldump.exe'.
// You may need to verify this path is correct for your XAMPP installation.
$mysqldump_path = 'E:\APPLICATIONS\xampp\mysql\bin\mysqldump.exe'; 
// ===================================================================

// Set headers for file download (Uses the DB_NAME constant)
header('Content-Type: application/sql');
header('Content-Disposition: attachment; filename="' . DB_NAME . '_' . date('Y-m-d_H-i-s') . '.sql"');

// 2. Build the password part of the command conditionally
// CRITICAL FIX 2: Only include the -p flag if the password is NOT empty.
$password_part = '';
if (!empty(DB_PASS)) {
    // -p without a space is required for the password argument in mysqldump
    $password_part = '-p' . escapeshellarg(DB_PASS);
}

// 3. Construct the full mysqldump command
$mysql_command = sprintf(
    // Command template: %s (path) -h%s -u%s %s (password_part) %s (db_name) ...
    '%s -h%s -u%s %s %s --opt --single-transaction --skip-lock-tables',
    escapeshellarg($mysqldump_path), // Use the full path here
    escapeshellarg(DB_HOST),
    escapeshellarg(DB_USER),
    $password_part, // Includes -pPASSWORD or is empty
    escapeshellarg(DB_NAME)
);

// 4. Wrap the command in 'cmd /c ""...' for robust execution on Windows
$command = 'cmd /c "' . $mysql_command . '"';

// 5. Execute the command and stream output
// 'passthru' executes the command and immediately streams the output to the browser
passthru($command, $worked);

// 6. Handle potential errors
if ($worked !== 0) {
    // Log the error for server diagnosis
    error_log("MySQL Dump Error. Return code: " . $worked . " Command: " . $command);
    // Output a simple error message to the browser
    die('Database backup failed. Check server logs for details and ensure mysqldump.exe path is correct in toolbrbackup_handler.php.');
}
?>