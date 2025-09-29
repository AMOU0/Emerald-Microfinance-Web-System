<?php
// Set the content type to JSON
header('Content-Type: application/json');

// --- 1. Database Configuration (Update with your actual credentials) ---
$servername = "localhost";
$username = "root"; // Your database username
$password = "";      // Your database password
$dbname = "emerald_microfinance";

// --- 2. Database Connection ---
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    // Return a JSON error message if connection fails
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit();
}

// --- 3. Input Validation ---
if (!isset($_POST['client_id']) || !is_numeric($_POST['client_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid or missing client ID.']);
    exit();
}

$client_id = $_POST['client_id'];

// --- 4. SQL Query to Fetch ALL Loans for the Client ---
$sql_loans = "
    SELECT
        la.loan_application_id,
        la.loan_amount AS principal_amount,
        la.payment_frequency,
        la.date_start,
        la.duration_of_loan,
        la.interest_rate,
        la.date_end,
        la.status,
        la.colateral
    FROM
        loan_applications la
    WHERE
        la.client_ID = ?
    ORDER BY
        la.date_start DESC;
";

$stmt_loans = $conn->prepare($sql_loans);
if (!$stmt_loans) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'SQL prepare failed (loans): ' . $conn->error]);
    exit();
}

$stmt_loans->bind_param("i", $client_id);
$stmt_loans->execute();
$result_loans = $stmt_loans->get_result();

$loans = [];

// --- 5. Process Results and Determine Loan/Reconstruct Details ---
while ($row = $result_loans->fetch_assoc()) {
    $loan_application_id = $row['loan_application_id'];
    $is_reconstruct_used = false;

    // --- 5a. Check for the LATEST reconstruct record for this loan ---
    $sql_reconstruct = "
        SELECT
            loan_reconstruct_id,
            reconstruct_amount,
            payment_frequency,
            interest_rate,
            date_start,
            duration,
            date_end,
            status
        FROM
            loan_reconstruct
        WHERE
            loan_application_id = ?
        ORDER BY
            date_created DESC
        LIMIT 1;
    ";
    $stmt_reconstruct = $conn->prepare($sql_reconstruct);
    $stmt_reconstruct->bind_param("i", $loan_application_id);
    $stmt_reconstruct->execute();
    $result_reconstruct = $stmt_reconstruct->get_result();
    $reconstruct = $result_reconstruct->fetch_assoc();
    $stmt_reconstruct->close();

    $active_loan_data = $row;
    $payment_reconstruct_id_filter = 0;    // Default: aggregate payments where loan_reconstruct_id = 0

    if ($reconstruct) {
        // If a reconstruct exists, use its terms for calculation and display
        $is_reconstruct_used = true;
        
        $active_loan_data['principal_amount'] = $reconstruct['reconstruct_amount'];
        $active_loan_data['payment_frequency'] = $reconstruct['payment_frequency'];
        $active_loan_data['interest_rate'] = $reconstruct['interest_rate'];
        $active_loan_data['date_start'] = $reconstruct['date_start'];
        $active_loan_data['duration_of_loan'] = $reconstruct['duration'];
        $active_loan_data['date_end'] = $reconstruct['date_end'];
        $active_loan_data['status'] = $reconstruct['status'];

        // If a reconstruct is used, payments should be aggregated for THAT reconstruct ID
        $payment_reconstruct_id_filter = $reconstruct['loan_reconstruct_id'];
    }

    // --- 5b. Get Total Paid amount (Only payments associated with the 'active' loan/reconstruct) ---
    $sql_payments = "
        SELECT
            COALESCE(SUM(amount_paid), 0.00) AS total_paid
        FROM
            payment
        WHERE
            loan_application_id = ?
            AND loan_reconstruct_id = ?;
    ";

    $stmt_payments = $conn->prepare($sql_payments);
    $stmt_payments->bind_param("ii", $loan_application_id, $payment_reconstruct_id_filter);
    $stmt_payments->execute();
    $result_payments = $stmt_payments->get_result();
    $payment_row = $result_payments->fetch_assoc();
    $total_paid = (float)$payment_row['total_paid'];
    $stmt_payments->close();

    // --- 5c. Calculation (Using the determined principal and terms) ---
    $base_loan_amount = (float)$active_loan_data['principal_amount'];
    $interest_rate = (float)$active_loan_data['interest_rate'] / 100;

    // Calculate the Total Loan Amount (Principal + Simple Interest)
    $total_loan_amount = $base_loan_amount * (1 + $interest_rate);

    // Calculate the Remaining Balance
    $amount_remaining = $total_loan_amount - $total_paid;
    
    // --- 5d. Prepare Final Array for JSON ---
    $final_row = [
        'loan_application_id' => $loan_application_id,
        // 'loan_amount' MUST contain the Total Repayable Amount (Principal + Interest) for the JS to work correctly
        'loan_amount' => number_format($total_loan_amount, 2, '.', ''), 
        'total_paid' => number_format($total_paid, 2, '.', ''),
        'amount_remaining' => number_format($amount_remaining, 2, '.', ''),
        'payment_frequency' => $active_loan_data['payment_frequency'],
        'date_start' => $active_loan_data['date_start'],
        'duration_of_loan' => $active_loan_data['duration_of_loan'],
        'date_end' => $active_loan_data['date_end'],
        'status' => $active_loan_data['status'],
        'colateral' => $active_loan_data['colateral'],
        'interest_rate' => $active_loan_data['interest_rate']
    ];

    $loans[] = $final_row;
}

$stmt_loans->close();
$conn->close();

echo json_encode(['success' => true, 'loans' => $loans]);
?>