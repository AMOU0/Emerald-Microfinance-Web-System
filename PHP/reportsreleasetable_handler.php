<?php
header('Content-Type: application/json');

// Include your database connection handler
require_once 'aadb_connect_handler.php'; 

$response = [
    'success' => false,
    'data' => [],
    'message' => 'Failed to fetch data.'
];

try {
    // Establish PDO connection
    $pdo = connectDB();

    // Corrected SQL Query: 
    // - Uses 'loan_applications' (aliased as 'l') and 'clients' (aliased as 'c').
    // - Uses 'l.loan_application_id' (to match the table schema).
    // - Uses 'l.loan_amount' (to match the table schema, assuming it serves as the amount due at this stage).
    // - Filters for 'release_status = 'forrelease'' (to show pending reports).
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
            l.release_status = 'forrelease'
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
    // If the connectDB() function fails, it exits with JSON error.
    // This catches other PDO errors (e.g., failed query execution).
    $response['message'] = "Database Query failed: " . $e->getMessage();
}

echo json_encode($response);
?>