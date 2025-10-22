<?php
// Include the PDO connection handler
require_once 'aadb_connect_handler.php'; // Ensure this path is correct

header('Content-Type: application/json');

// --- Refactored Database Connection ---
try {
    $pdo = connectDB();
} catch (\PDOException $e) {
    // connectDB already handles error response and exits, but this is a fallback
    die(json_encode(["error" => "Database connection error."]));
}
// ------------------------------------

// SQL query to fetch pending loan applications
// IMPORTANT: This query joins 'loan_applications' and 'clients' tables.
$sql = "SELECT 
            la.loan_application_id, 
            la.client_ID, 
            c.first_name, 
            c.last_name,
            la.loan_amount,
            la.created_at
        FROM loan_applications AS la
        JOIN clients AS c ON la.client_ID = c.client_ID
        WHERE la.status = 'pending' 
        ORDER BY la.created_at DESC";

$pending_accounts = [];

try {
    // Use PDO to prepare and execute the statement
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    // Fetch all results as an associative array
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($results) > 0) {
        // Format the data
        foreach ($results as $row) {
            $pending_accounts[] = [
                'loan_application_id' => $row['loan_application_id'],
                'client_ID' => $row['client_ID'],
                // Use htmlspecialchars for output sanitization (though less critical for JSON output, it's good practice)
                'first_name' => htmlspecialchars($row['first_name']),
                'last_name' => htmlspecialchars($row['last_name']),
                'loan_amount' => $row['loan_amount'],
                'created_at' => date("F j, Y, g:i a", strtotime($row['created_at']))
            ];
        }
    }
} catch (\PDOException $e) {
    // Handle query execution error
    http_response_code(500);
    die(json_encode(["error" => "Query failed: " . $e->getMessage()]));
}

// Return the data as a JSON object
echo json_encode($pending_accounts);

// PDO connection will be closed when the script finishes or $pdo is unset
// $pdo = null;
?>