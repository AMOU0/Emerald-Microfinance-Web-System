<?php
// backup.php

// 1. Include the connection handler to get credentials
require_once 'aadb_connect_handler.php';

// Set headers for file download
header('Content-Type: application/sql');
header('Content-Disposition: attachment; filename="' . DB_NAME . '_' . date('Y-m-d_H-i-s') . '.sql"');

// 2. Define the output stream as STDOUT to stream the dump directly
$output_path = 'php://output';

// 3. Construct the mysqldump command
$command = sprintf(
    // Added --single-transaction and --skip-lock-tables for consistent backups with InnoDB
    'mysqldump --opt --single-transaction --skip-lock-tables -h%s -u%s -p%s %s > %s',
    escapeshellarg(DB_HOST),
    escapeshellarg(DB_USER),
    // NOTE: -p without a space is required for the password argument in mysqldump
    escapeshellarg(DB_PASS),
    escapeshellarg(DB_NAME),
    escapeshellarg($output_path)
);

// 4. Execute the command and stream output
// 'passthru' is used to execute the command and immediately stream the output to the browser
passthru($command, $worked);

// 5. Handle potential errors
if ($worked !== 0) {
    // Log the error for server diagnosis
    error_log("MySQL Dump Error. Return code: " . $worked);
    die('Database backup failed. Check server logs for details and ensure mysqldump is in your PATH.');
}
?>