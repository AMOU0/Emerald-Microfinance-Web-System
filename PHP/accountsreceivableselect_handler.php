<?php
header('Content-Type: application/json');

// Database connection details
$servername = "localhost";
$username = "root";
$password = ""; // Assuming no password for the root user
$dbname = "emerald_microfinance";

$response = array('success' => false, 'message' => '', 'loanDetails' => null);

// Get the GET data from the URL
$clientID = isset($_GET['clientID']) ? $_GET['clientID'] : null;
$loanID = isset($_GET['loanID']) ? $_GET['loanID'] : null;

if ($clientID && $loanID) {
    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Fetch all required details for the form and due date calculations
        $stmt = $conn->prepare("
            SELECT 
                c.last_name, 
                c.first_name,
                la.client_ID,
                la.loan_application_id,
                la.loan_amount AS original_loan_amount,
                la.date_start,
                la.date_end,
                la.payment_frequency,
                COALESCE(SUM(p.amount_paid), 0) AS total_paid
            FROM clients c
            JOIN loan_applications la ON c.client_ID = la.client_ID
            LEFT JOIN payment p ON la.loan_application_id = p.loanid
            WHERE la.loan_application_id = :loanID AND c.client_ID = :clientID
            GROUP BY c.last_name, c.first_name, la.client_ID, la.loan_application_id, la.loan_amount, la.date_start, la.date_end, la.payment_frequency
            LIMIT 1
        ");
        $stmt->bindParam(':loanID', $loanID);
        $stmt->bindParam(':clientID', $clientID);
        $stmt->execute();
        
        $loanDetails = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($loanDetails) {
            $response['success'] = true;
            
            // Calculate the current balance
            $currentBalance = $loanDetails['original_loan_amount'] - $loanDetails['total_paid'];
            
            $response['loanDetails'] = [
                'client_ID' => $loanDetails['client_ID'],
                'loan_ID' => $loanDetails['loan_application_id'],
                'client_name' => $loanDetails['first_name'] . ' ' . $loanDetails['last_name'],
                'current_balance' => $currentBalance,
                'date_start' => $loanDetails['date_start'],
                'date_end' => $loanDetails['date_end'],
                'payment_frequency' => $loanDetails['payment_frequency']
            ];
        } else {
            $response['message'] = 'Loan not found.';
        }
    } catch(PDOException $e) {
        $response['message'] = 'Database error: ' . $e->getMessage();
    } finally {
        $conn = null;
    }
} else {
    $response['message'] = 'Missing client or loan ID.';
}

echo json_encode($response);
?>
