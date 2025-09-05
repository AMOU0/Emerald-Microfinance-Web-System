<?php
header('Content-Type: application/json');

// Database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    // Send HTTP 500 status and JSON error message
    http_response_code(500); 
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// SQL query to fetch all approved AND UNPAID accounts
// We specifically filter by status = 'approved' AND paid = '0'
$sql = "SELECT 
            la.loan_application_id, 
            la.client_ID, 
            c.first_name, 
            c.last_name,
            la.loan_amount AS principal_amount,
            la.interest_rate,
            la.created_at
        FROM loan_applications AS la
        JOIN clients AS c ON la.client_ID = c.client_ID
        WHERE la.status = 'approved' AND la.paid = '0' 
        ORDER BY la.created_at DESC";

$result = $conn->query($sql);

$approved_accounts = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $principal_amount = (float)$row['principal_amount'];
        $interest_rate = (int)$row['interest_rate'];
        
        // Calculate Interest Amount: Principal * (Rate / 100)
        $interest_amount = $principal_amount * ($interest_rate / 100.0);
        
        // Calculate Total Loan Amount: Principal + Interest
        $total_loan_amount = $principal_amount + $interest_amount;

        $approved_accounts[] = [
            'loan_application_id' => $row['loan_application_id'],
            'client_ID' => $row['client_ID'],
            'first_name' => htmlspecialchars($row['first_name']),
            'last_name' => htmlspecialchars($row['last_name']),
            'principal_amount' => $principal_amount,
            'interest_amount' => $interest_amount,
            'total_loan_amount' => $total_loan_amount,
            'created_at' => date("F j, Y, g:i a", strtotime($row['created_at']))
        ];
    }
}

// Return the filtered data as a JSON object
echo json_encode($approved_accounts);

$conn->close();
?>