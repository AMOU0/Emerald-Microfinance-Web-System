<?php
header('Content-Type: application/json');

// Database connection details
$servername = "localhost";
$username = "root"; // Replace with your actual database username
$password = ""; // Replace with your actual database password
$dbname = "emerald_microfinance"; // The name of your database

// Check if loan_application_id is provided via POST
if (!isset($_POST['loan_application_id']) || empty($_POST['loan_application_id'])) {
    echo json_encode(['success' => false, 'message' => 'Error: Loan Application ID is required.']);
    exit;
}

$loanApplicationId = $_POST['loan_application_id'];

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Database Connection failed: " . $conn->connect_error);
    }

    // --- 1. Fetch Guarantor Details ---
    // Note: A loan might have multiple guarantors over time, but we'll fetch the one associated
    // with the latest record for that loan (assuming higher guarantor_id means newer).
    // Or, more reliably, we fetch the one linked to the loan_application_id.
    $sqlGuarantor = "
        SELECT 
            g.guarantor_first_name, 
            g.guarantor_middle_name, 
            g.guarantor_last_name, 
            g.guarantor_street_address, 
            g.guarantor_phone_number
        FROM guarantor g
        WHERE g.loan_application_id = ?
        ORDER BY g.guarantor_id DESC
        LIMIT 1"; // Get the latest/most relevant guarantor for this loan

    $stmtGuarantor = $conn->prepare($sqlGuarantor);
    $stmtGuarantor->bind_param("s", $loanApplicationId);
    $stmtGuarantor->execute();
    $resultGuarantor = $stmtGuarantor->get_result();

    $guarantorData = null;
    if ($resultGuarantor->num_rows > 0) {
        $row = $resultGuarantor->fetch_assoc();
        $fullName = trim($row['guarantor_first_name'] . ' ' . $row['guarantor_middle_name'] . ' ' . $row['guarantor_last_name']);
        
        $guarantorData = [
            'guarantor_name' => $fullName,
            'guarantor_address' => $row['guarantor_street_address'],
            'guarantor_phone' => $row['guarantor_phone_number']
        ];
    }
    $stmtGuarantor->close();

    // --- 2. Fetch Basic Loan Details (to provide context like loan amount and client name) ---
    $sqlLoan = "
        SELECT 
            la.client_ID,
            la.loan_amount, 
            la.interest_rate, 
            la.date_start, 
            la.date_end, 
            la.payment_frequency,
            c.first_name AS client_first_name,
            c.middle_name AS client_middle_name,
            c.last_name AS client_last_name
        FROM loan_applications la
        JOIN clients c ON la.client_ID = c.client_ID
        WHERE la.loan_application_id = ?";

    $stmtLoan = $conn->prepare($sqlLoan);
    $stmtLoan->bind_param("s", $loanApplicationId);
    $stmtLoan->execute();
    $resultLoan = $stmtLoan->get_result();
    $loanData = $resultLoan->fetch_assoc();
    $stmtLoan->close();
    
    $conn->close();

    if (!$loanData) {
        echo json_encode(['success' => false, 'message' => 'Error: Loan not found or Client data missing.']);
        exit;
    }

    // Prepare combined result for the client-side
    $clientFullName = trim($loanData['client_first_name'] . ' ' . $loanData['client_middle_name'] . ' ' . $loanData['client_last_name']);
    
    $response = [
        'success' => true,
        'loan_application_id' => $loanApplicationId,
        'client_id' => $loanData['client_ID'],
        'client_name' => $clientFullName,
        'loan_amount_principal' => (float)$loanData['loan_amount'],
        'interest_rate' => (float)$loanData['interest_rate'] / 100, // Convert percentage to decimal
        'date_start' => $loanData['date_start'],
        'date_end' => $loanData['date_end'],
        'payment_frequency' => $loanData['payment_frequency'],
        'guarantor_name' => $guarantorData['guarantor_name'] ?? 'N/A',
        'guarantor_address' => $guarantorData['guarantor_address'] ?? 'N/A',
        'guarantor_phone' => $guarantorData['guarantor_phone'] ?? 'N/A'
    ];

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>