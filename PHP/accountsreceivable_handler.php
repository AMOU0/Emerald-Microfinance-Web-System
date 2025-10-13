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
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// SQL query to fetch all approved AND UNPAID accounts
// The ORDER BY la.created_at DESC ensures that the newest loan approved (most recently created) is at the top.
$sql = "SELECT 
            la.loan_application_id, 
            la.client_ID, 
            c.first_name, 
            c.last_name,
            la.loan_amount AS principal_amount,
            la.interest_rate,
            la.created_at,
            la.date_end,
            la.payment_frequency
        FROM loan_applications AS la
        JOIN clients AS c ON la.client_ID = c.client_ID
        WHERE la.status = 'approved' AND la.paid = 'Unpaid' 
        ORDER BY la.created_at DESC"; // This sorts by newest first

$result = $conn->query($sql);

$approved_accounts = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $loan_application_id = $row['loan_application_id'];
        $principal_amount = (float)$row['principal_amount'];
        $interest_rate = (int)$row['interest_rate'];
        $payment_frequency = $row['payment_frequency'];
        $date_end = $row['date_end'];

        // Check for a reconstructed loan and get the ID
        $reconstruct_sql = "SELECT loan_reconstruct_id, reconstruct_amount, payment_frequency, interest_rate, date_end 
                            FROM loan_reconstruct 
                            WHERE loan_application_id = ?";
        $stmt = $conn->prepare($reconstruct_sql);
        $stmt->bind_param("i", $loan_application_id);
        $stmt->execute();
        $reconstruct_result = $stmt->get_result();
        
        $reconstruct_id = null;
        if ($reconstruct_result->num_rows > 0) {
            // Use reconstructed loan details
            $reconstruct_row = $reconstruct_result->fetch_assoc();
            $principal_amount = (float)$reconstruct_row['reconstruct_amount'];
            $interest_rate = (int)$reconstruct_row['interest_rate'];
            $payment_frequency = $reconstruct_row['payment_frequency'];
            $date_end = $reconstruct_row['date_end'];
            $reconstruct_id = (int)$reconstruct_row['loan_reconstruct_id'];
        }
        $stmt->close();
        
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
            'created_at' => $row['created_at'] // Include for potential client-side sorting consistency
        ];
    }
}

// Return the filtered data as a JSON object
echo json_encode($approved_accounts);

$conn->close();
?>