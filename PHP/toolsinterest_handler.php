<?php
// PHP/toolsinterest_function.php

// Include the PDO connection function
require_once 'aadb_connect_handler.php';

// Set JSON header for the response
header('Content-Type: application/json');

$pdo = null;

try {
    // Connect to the database
    $pdo = connectDB(); 

    // --- Fetch Data from interest_pecent Table ---
    // MODIFIED: Added secondary sort by interest_ID DESC to handle same-day insertions.
    $sql = "SELECT interest_ID, Interest_Pecent, status, date_created 
            FROM interest_pecent 
            ORDER BY date_created DESC, interest_ID DESC";

    $stmt = $pdo->query($sql);

    if ($stmt) {
        $interest_rates = $stmt->fetchAll();
        
        if (!empty($interest_rates)) {
            // Return success with the fetched data
            echo json_encode([
                'success' => true, 
                'data' => $interest_rates
            ]);
        } else {
            // ... (Empty data handling remains the same)
            echo json_encode([
                'success' => true, 
                'data' => [], 
                'message' => 'No interest rates found in the database.'
            ]);
        }
    } else {
        // This case should be rare with PDO's error mode but included for completeness.
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'data' => [], 
            'message' => 'SQL query failed.'
        ]);
    }

} catch (Exception $e) {
    // Catch-all for PDO errors
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'data' => [], 
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>