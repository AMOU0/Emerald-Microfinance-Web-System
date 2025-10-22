<?php
// loanapplicationcheckfirstloan_handler.php

header('Content-Type: application/json');

// --- Include Database Connection Handler and Connect ---
// ASSUMPTION: 'aadb_connect_handler.php' contains your connectDB() function
require_once 'aadb_connect_handler.php';
$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];

try {
    // Establish database connection
    $pdo = connectDB();
    
    // Get the client ID from the URL query string
    $clientID = trim($_GET['clientID'] ?? '');

    if (empty($clientID)) {
        throw new Exception("Client ID is missing.");
    }

    // Query the database to count the number of existing loans for the client
    // ASSUMPTION: Your loan application table is named 'loan_applications'
    $sql = "SELECT COUNT(*) as loan_count FROM loan_applications WHERE client_ID = :clientID";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(":clientID", $clientID);
    $stmt->execute();
    
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $loan_count = (int)$row['loan_count'];

    // Prepare the successful response
    $response['status'] = 'success';
    $response['loan_count'] = $loan_count;
    $response['is_first_loan'] = ($loan_count === 0);

} catch (Exception $e) {
    // Catch any database or logic errors
    $response['message'] = 'Failed to fetch loan history: ' . $e->getMessage();
}

echo json_encode($response);
?>