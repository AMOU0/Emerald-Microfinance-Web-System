<?php
// dashboardrelease_handler.php
// Fetches the total approved and unpaid loan amount scheduled for release 
// with a start date in the 7 days *starting from* the next Tuesday's date.

// 1. Include the database connection handler
require_once 'aadb_connect_handler.php'; 

// Initialize response data with default values
$responseData = [
    'date' => 'N/A', 
    'day' => '',     
    'amount' => '0.00',
    'currency' => 'PHP',
    'error' => null
];

try {
    // 2. Establish Database Connection
    $pdo = connectDB(); 

    // --- START: Calculation for SQL Query (MUST REMAIN) ---
    // 3. Calculate the date of the next Tuesday (This is the START date for the query window)
    $nextTuesday = new DateTime('next tuesday');
    
    // 4. Calculate the release WINDOW (7 days STARTING from next Tuesday)
    
    // The START DATE of the query window is the next Tuesday
    $queryStartDate = clone $nextTuesday;
    $queryStartDateSQL = $queryStartDate->format('Y-m-d'); 

    // The END DATE is 7 days from the start date.
    $queryEndDate = clone $nextTuesday;
    $queryEndDate->modify('+6 days'); // 7 days inclusive: Day 0 (Tuesday) + 6 more days
    $queryEndDateSQL = $queryEndDate->format('Y-m-d');
    // --- END: Calculation for SQL Query ---
    
    // 5. Construct the SQL Query - MODIFIED
    $sql = "
SELECT 
    SUM(loan_amount) AS release_total 
FROM 
    loan_applications
WHERE 
    status = 'approved' AND 
    paid = 'Unpaid' AND
    release_status = 'forrelease'
    ";

    // 6. Prepare and Execute the Query - MODIFIED
    $stmt = $pdo->prepare($sql);
    // The bindParam calls for :start_date and :end_date have been removed.
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // 7. Process the Result
    // If the sum is NULL (no approved loans), default to 0.
    $approvedAmount = (float)($result['release_total'] ?? 0);
    
    // Update response data 
    // Set 'day' to an empty string for the desired display format in the front-end.
    $responseData['day'] = ''; 
    
    // Construct the full desired string: "For Release (Month Day, Year)"
    $formattedDate = $queryStartDate->format('M j, Y');
    $responseData['date'] = 'For Release (' . $formattedDate . ')'; 
    
    $responseData['amount'] = number_format($approvedAmount, 2);
    
    // 8. Send the JSON response
    header('Content-Type: application/json');
    echo json_encode($responseData);

} catch (PDOException $e) {
    // Handle database connection or query errors
    $responseData['error'] = 'Database Error: ' . $e->getMessage();
    header('Content-Type: application/json');
    http_response_code(500); // Set response code to Internal Server Error
    echo json_encode($responseData);

} catch (Exception $e) {
    // Handle general errors
    $responseData['error'] = 'General Error: ' . $e->getMessage();
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode($responseData);
}
?>