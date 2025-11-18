<?php
// Set the content type to application/json
header('Content-Type: application/json');

// Include the database connection function. Adjust the path if necessary.
require_once('aadb_connect_handler.php'); 

try {
    // Establish the PDO database connection
    $pdo = connectDB(); 

    // 1. Initialize variables for filters
    $where_clauses = [];
    $params = [];

    // --- Date Filter Logic ---
    if (isset($_GET['start_date']) && !empty($_GET['start_date'])) {
        // Filter by date_released greater than or equal to the start date
        $where_clauses[] = "DATE(r.created_at) >= :start_date";
        $params['start_date'] = $_GET['start_date'];
    }

    if (isset($_GET['end_date']) && !empty($_GET['end_date'])) {
        // Filter by date_released less than or equal to the end date
        $where_clauses[] = "DATE(r.created_at) <= :end_date";
        $params['end_date'] = $_GET['end_date'];
    }

    // --- Search Term Filter Logic ---
    // The search term logic block has been removed.

    // 2. Build the WHERE clause string
    // If there are clauses, join them with " AND " and prefix with " WHERE "
    $where_sql = count($where_clauses) > 0 ? " WHERE " . implode(" AND ", $where_clauses) : "";

    // 3. Main SQL Query
    $sql = "
        SELECT
            r.client_ID,
            r.loan_application_id,
            -- Concatenate client name for display
            CONCAT(c.first_name, ' ', c.middle_name, ' ', c.last_name) AS client_name,
            
            -- Use loan_applications.loan_amount as the Principal Amount 
            la.loan_amount AS principal_amount,
            
            -- Calculate Interest Amount: Principal * (Interest Rate / 100)
            (la.loan_amount * (la.interest_rate / 100)) AS interest_amount,
            
            -- Calculate Total Loan Amount: Principal + Interest
            (la.loan_amount + (la.loan_amount * (la.interest_rate / 100))) AS total_loan_amount,
            
            r.created_at AS date_released
        FROM
            released r
        JOIN
            clients c ON r.client_ID = c.client_ID
        JOIN
            loan_applications la ON r.loan_application_id = la.loan_application_id
        {$where_sql}
        ORDER BY
            r.created_at DESC
    ";

    // 4. Prepare and execute the statement
    $stmt = $pdo->prepare($sql);
    
    // Execute the statement, passing the parameters array
    if ($stmt->execute($params)) {
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC); 
    } else {
        // Log the error details
        error_log("SQL Execution Error: " . print_r($stmt->errorInfo(), true));
        throw new \Exception("Database query execution failed.");
    }

    // Return the data as a JSON object
    echo json_encode(['success' => true, 'data' => $data]);

} catch (\Exception $e) {
    // Log error and return a JSON error response
    error_log("Application Error in releasedloan_handler.php: " . $e->getMessage());
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>