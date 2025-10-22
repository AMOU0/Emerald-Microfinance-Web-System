<?php
//toolinterestactive_handler.php
// Include the PDO connection function
require_once 'aadb_connect_handler.php';

header('Content-Type: application/json');

$pdo = null;

try {
    // Establish Database Connection
    $pdo = connectDB(); 

    // Fetch the current active interest rate
    $sql = "SELECT Interest_Pecent FROM interest_pecent WHERE status = 'activated' ORDER BY date_created DESC LIMIT 1";
    $stmt = $pdo->query($sql);

    if ($stmt && $row = $stmt->fetch()) {
        echo json_encode(['success' => true, 'rate' => $row['Interest_Pecent']]);
    } else {
        // Default to 0 or a business-appropriate fallback if none is found
        echo json_encode(['success' => false, 'message' => 'No active interest rate found.']);
    }

} catch (Exception $e) {
    // Catch-all for PDO errors
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
}
?>