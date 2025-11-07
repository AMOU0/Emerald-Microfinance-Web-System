<?php
// Set the content type to application/json
header('Content-Type: application/json');

// Include the database connection function. Adjust the path if necessary.
require_once('aadb_connect_handler.php'); //

try {
    // Establish the PDO database connection
    $pdo = connectDB(); 

    // SQL Query to fetch the released loans, joining three tables:
    // released, clients, and loan_applications.
    $sql = "
        SELECT
            r.client_ID,
            r.loan_application_id,
            -- Concatenate client name for display
            CONCAT(c.first_name, ' ', c.middle_name, ' ', c.last_name) AS client_name,
            
            -- Use loan_applications.loan_amount as the Principal Amount (required for several columns and the total sum)
            la.loan_amount AS principal_amount,
            
            -- Calculate Interest Amount: Principal * (Interest Rate / 100)
            (la.loan_amount * (la.interest_rate / 100)) AS interest_amount,
            
            -- Calculate Total Loan Amount: Principal + Interest (required for the Loan Amount column)
            (la.loan_amount + (la.loan_amount * (la.interest_rate / 100))) AS total_loan_amount,
            
            r.created_at AS date_released
        FROM
            released r
        JOIN
            clients c ON r.client_ID = c.client_ID
        JOIN
            loan_applications la ON r.loan_application_id = la.loan_application_id
        ORDER BY
            r.created_at DESC
    ";

    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll();

    // Return the data as a JSON object
    echo json_encode(['success' => true, 'data' => $data]);

} catch (\Exception $e) {
    // Catch any remaining exceptions (e.g., query error)
    error_log("Query Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve loan data. Please check your SQL query and table names.']);
}
?>