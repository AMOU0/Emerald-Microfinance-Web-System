<?php
header('Content-Type: application/json');

// --- 1. Database Configuration ---
$host = 'localhost';
$dbname = 'emerald_microfinance';
$username = 'root'; 
$password = ''; 
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// --- 2. Input Validation ---
if (!isset($_POST['client_id']) || empty($_POST['client_id'])) {
    echo json_encode(['error' => 'Client ID is missing.']);
    exit;
}

$client_id = $_POST['client_id'];

try {
    // 3. Database Connection
    $pdo = new PDO($dsn, $username, $password, $options);

    // 4. Combined SQL Query
    // Joins clients, client_requirements, guarantor, and loan_applications tables
    $sql = "
        SELECT
            c.*,
            cr.has_barangay_clearance,
            cr.has_valid_id,
            g.guarantor_last_name,
            g.guarantor_first_name,
            g.guarantor_middle_name,
            g.guarantor_street_address,
            g.guarantor_phone_number,
            la.loan_application_id,
            la.loan_amount,
            la.payment_frequency,
            la.date_start,
            la.duration_of_loan,
            la.date_end,
            la.colateral
        FROM
            clients c
        LEFT JOIN
            client_requirements cr ON c.client_ID = cr.client_ID
        LEFT JOIN
            guarantor g ON c.client_ID = g.client_ID
        LEFT JOIN
            loan_applications la ON c.client_ID = la.client_ID
        WHERE
            c.client_ID = ? AND la.status = 'pending'
        ORDER BY la.created_at DESC
        LIMIT 1;
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$client_id]);
    $data = $stmt->fetch();

    if ($data) {
        // Prepare data for JS consumption, especially for checkboxes/selects
        $data['has_barangay_clearance'] = (bool)$data['has_barangay_clearance'];
        // The JS expects 'hasValidIdCheck' to be true if 'has_valid_id' is not '0' or null/empty
        $data['hasValidIdCheck'] = !empty($data['has_valid_id']) && $data['has_valid_id'] !== '0';
        $data['validIdType'] = $data['has_valid_id'] === '0' ? '' : $data['has_valid_id'];
        
        // Use 'colateral' from the loan application table, since it can be different per loan
        $data['cr'] = $data['colateral']; 
        
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['error' => 'No pending account found for client ID: ' . $client_id]);
    }

} catch (PDOException $e) {
    error_log("Database Error (VIEW): " . $e->getMessage());
    echo json_encode(['error' => 'Database error occurred while fetching data.']);
}
catch (Exception $e) {
    error_log("General Error (VIEW): " . $e->getMessage());
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
?>