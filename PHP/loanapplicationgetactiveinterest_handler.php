<?php
header('Content-Type: application/json');

// --- Include Database Connection Handler and Connect ---
require_once 'aadb_connect_handler.php';
$pdo = null;

try {
    // Establish database connection 
    $pdo = connectDB(); // Get the PDO connection object

    // Fetch the active interest rate from the 'interest_pecent' table
    $sql = "SELECT Interest_Pecent FROM interest_pecent WHERE status = 'activated'";
    
    // Execute query directly since no user input is involved, or use prepare for consistency
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        // Cast to int as the original MySQLi code did
        echo json_encode(['status' => 'success', 'interestRate' => (int)$row['Interest_Pecent']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => "No active interest rate found."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => "Query failed: " . $e->getMessage()]);
}

// The PDO connection will automatically close when the script finishes.
?>