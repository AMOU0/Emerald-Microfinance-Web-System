<?php
header('Content-Type: application/json');

// Include your database connection handler
require_once 'aadb_connect_handler.php'; // Corrected to use the same file as reportsrelease_handler.php

$response = [
    'success' => false,
    'data' => [],
    'message' => 'Failed to fetch data.'
];

try {
    // Establish PDO connection
    $pdo = connectDB();

    // SQL Query to fetch loans ready for release.
    // Filters for 'release_status = 'forrelease'' (to show pending reports).
    $sql = "
        SELECT 
            l.loan_application_id AS loan_id,
            l.loan_amount AS amount_due,
            l.release_status,
            c.client_ID AS client_id,
            CONCAT(c.first_name, ' ', c.last_name) AS client_name
        FROM 
            loan_applications l
        JOIN 
            clients c ON l.client_ID = c.client_ID
        WHERE 
            l.release_status = 'forrelease' -- Only fetch loans pending release
        ORDER BY 
            l.loan_application_id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($reports) > 0) {
        $response['success'] = true;
        $response['data'] = $reports;
        $response['message'] = "Data fetched successfully.";
    } else {
        $response['success'] = true;
        $response['message'] = "No reports pending release found.";
    }

} catch (PDOException $e) {
    $response['message'] = "Database Query failed: " . $e->getMessage();
}

echo json_encode($response);
?>