<?php
header('Content-Type: application/json');

// Include the file with the connectDB function
require_once 'aadb_connect_handler.php';

// Establish the PDO connection
// connectDB() handles connection errors and exits on failure, returning a valid PDO object on success.
$pdo = connectDB();

// SQL query to fetch all approved AND UNPAID accounts
// MODIFIED: Added la.release_status to the SELECT list and the WHERE clause.
$sql = "SELECT 
            la.loan_application_id, 
            la.client_ID, 
            c.first_name, 
            c.last_name,
            la.loan_amount AS principal_amount,
            la.interest_rate,
            la.created_at,
            la.date_end,
            la.payment_frequency,
            la.release_status    -- Added to select list
        FROM loan_applications AS la
        JOIN clients AS c ON la.client_ID = c.client_ID
        WHERE la.status = 'approved' 
        AND la.paid = 'Unpaid' 
        AND la.release_status = 'released' -- Only show accounts that are 'released'
        ORDER BY la.created_at DESC";

$approved_accounts = [];

try {
    // Prepare and execute the main query
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($result) {
        // Prepare the statement for checking loan_reconstruct once outside the loop
        // FIX: Added ORDER BY and LIMIT 1 to retrieve the LATEST reconstruction record
        $reconstruct_sql = "SELECT 
                                lr.loan_reconstruct_id, 
                                lr.reconstruct_amount, 
                                lr.payment_frequency, 
                                lr.interest_rate, 
                                lr.date_end 
                            FROM loan_reconstruct AS lr
                            WHERE lr.loan_application_id = ?
                            ORDER BY lr.created_at DESC  
                            LIMIT 1";

        $reconstruct_stmt = $pdo->prepare($reconstruct_sql);

        foreach ($result as $row) {
            $loan_application_id = $row['loan_application_id'];
            $reconstruct_id = null; // Initialize to null for each loan

            // Check for a reconstruction record
            $reconstruct_stmt->execute([$loan_application_id]);
            $reconstruct_row = $reconstruct_stmt->fetch(PDO::FETCH_ASSOC);

            if ($reconstruct_row) {
                // If a reconstruction exists, overwrite the loan's details with the latest reconstruction details
                $reconstruct_id = $reconstruct_row['loan_reconstruct_id'];
                $principal_amount = $reconstruct_row['reconstruct_amount'];
                $payment_frequency = $reconstruct_row['payment_frequency'];
                $interest_rate = $reconstruct_row['interest_rate'];
                $date_end = $reconstruct_row['date_end'];
            } else {
                // If no reconstruction, use the original loan details
                $principal_amount = $row['principal_amount'];
                $payment_frequency = $row['payment_frequency'];
                $interest_rate = $row['interest_rate'];
                $date_end = $row['date_end'];
            }

            // Calculate Interest Amount: Principal * (Rate / 100)
            $interest_amount = $principal_amount * ($interest_rate / 100.0);
            
            // Calculate Total Loan Amount: Principal + Interest
            $total_loan_amount = $principal_amount + $interest_amount;

            // Check if the loan is overdue
            $is_overdue = (strtotime($date_end) < time());

            $approved_accounts[] = [
                'loan_application_id' => $loan_application_id,
                'client_ID' => $row['client_ID'],
                'first_name' => htmlspecialchars($row['first_name']),
                'last_name' => htmlspecialchars($row['last_name']),
                'principal_amount' => $principal_amount,
                'interest_amount' => $interest_amount,
                'total_loan_amount' => $total_loan_amount,
                'payment_frequency' => $payment_frequency,
                'date_end' => $date_end,
                'is_overdue' => $is_overdue,
                'reconstruct_id' => $reconstruct_id,
                'created_at' => $row['created_at']
            ];
        }
    }

    // Return the data as a JSON object
    echo json_encode($approved_accounts);

} catch (\PDOException $e) {
    // error_log is handled by connectDB(), but catch block ensures robust response
    http_response_code(500);
    echo json_encode(['error' => 'Database operation failed.']);
}
?>