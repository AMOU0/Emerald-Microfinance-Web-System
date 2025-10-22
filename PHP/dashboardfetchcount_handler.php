<?php
// Set response header to JSON
header('Content-Type: application/json');

// Include the connection handler
require_once 'aadb_connect_handler.php';

$counts = [
    'pending_loans_count' => 0,
    'active_loans_count' => 0
];

try {
    // 1. Establish database connection
    $pdo = connectDB();

    // 2. Query for Pending Loans
    // CRITERIA: status is 'pending' AND paid is 'unpaid'. Counts all loans that meet this criteria.
    $pending_sql = "
        SELECT COUNT(loan_application_id) AS pending_count
        FROM loan_applications
        WHERE status = 'pending' AND paid = 'unpaid'
    ";
    $stmt_pending = $pdo->query($pending_sql);
    $pending_result = $stmt_pending->fetch(PDO::FETCH_ASSOC);

    if ($pending_result) {
        $counts['pending_loans_count'] = $pending_result['pending_count'];
    }

    // 3. Query for Active Loans
    // CRITERIA: status is 'approved' AND paid is 'unpaid'. Counts all loans that meet this criteria.
    $active_sql = "
        SELECT COUNT(loan_application_id) AS active_count
        FROM loan_applications
        WHERE status = 'approved' AND paid = 'unpaid'
    ";
    $stmt_active = $pdo->query($active_sql);
    $active_result = $stmt_active->fetch(PDO::FETCH_ASSOC);

    if ($active_result) {
        $counts['active_loans_count'] = $active_result['active_count'];
    }

    // 4. Output the successful results as JSON
    echo json_encode(['success' => true, 'counts' => $counts]);

} catch (\PDOException $e) {
    // Log the error and return an error response
    error_log("Query Error: " . $e->getMessage());
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve data due to a database query error.']);
}
?>