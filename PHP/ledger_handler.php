<?php
header('Content-Type: application/json');

// Database connection details
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

// 🌟 CRITICALLY REVISED SQL QUERY 🌟
// This query calculates the net balance across all loans and payments for each client.
$sql = "SELECT
    c.client_ID,
    c.first_name,
    c.middle_name,
    c.last_name,
    c.phone_number,
    
    -- Get the most recent date start and payment frequency for active loan context
    MAX(la.date_start) AS date_start,
    MAX(la.payment_frequency) AS payment_frequency,
    
    -- Calculate the total amount owed (Principal * (1 + Rate)) from all loan applications/reconstructions
    SUM(CASE 
        -- If an active reconstruction exists, use its total amount owed
        WHEN lr.status = 'active' THEN lr.reconstruct_amount * (1 + (lr.interest_rate / 100))
        -- Otherwise, use the original loan's total amount owed, but only if its status is 'approved' or 'unpaid'
        WHEN la.status = 'approved' OR la.status = 'Unpaid' THEN la.loan_amount * (1 + (la.interest_rate / 100))
        ELSE 0
    END) AS total_amount_owed_with_interest,
    
    -- Calculate the total amount paid across all payments
    SUM(p.amount_paid) AS total_amount_paid,
    
    MAX(p.date_payed) AS last_payment_date
FROM
    clients c
LEFT JOIN
    loan_applications la ON c.client_ID = la.client_ID
LEFT JOIN
    loan_reconstruct lr ON la.loan_application_id = lr.loan_application_id AND lr.status = 'active'
LEFT JOIN
    payment p ON c.client_ID = p.client_id AND la.loan_application_id = p.loan_application_id
GROUP BY
    c.client_ID
ORDER BY
    c.last_name ASC;";

$result = $conn->query($sql);

$data = [];

if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "SQL query failed: " . $conn->error]);
    exit();
}
else {
    while($row = $result->fetch_assoc()) {
        $total_owed = $row['total_amount_owed_with_interest'] ?? 0;
        $amount_paid = $row['total_amount_paid'] ?? 0;
        
        $balance = $total_owed - $amount_paid;

        // **FINAL BALANCE LOGIC:** Treat any balance <= 0.01 as fully paid.
        if ($balance > 0.01) {
            // Active Loan: Display formatted balance
            $row['balance_display'] = "PHP " . number_format($balance, 2);
        } else {
            // Fully Paid, Overpaid, or No Loan: Display the requested status
            $row['balance_display'] = 'Fully Paid'; // Changed from 'NO LOANS ACTIVE'
            $row['date_start'] = null; 
        }

        $row['balance'] = $balance; // Raw balance for JS logic
        
        // Cleanup columns
        unset($row['total_amount_owed_with_interest'], $row['total_amount_paid']);
        $data[] = $row;
    }
}

$conn->close();

echo json_encode($data);
?>