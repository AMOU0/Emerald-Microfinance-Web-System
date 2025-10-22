<?php
header('Content-Type: application/json');

// --- 1. Include the database connection function --- 
require_once 'aadb_connect_handler.php'; // Ensure this file establishes a PDO connection

// --- 2. Input Validation ---
if (!isset($_POST['client_id']) || empty($_POST['client_id'])) {
    echo json_encode(['error' => 'Client ID is missing.']);
    exit;
}

$client_id = $_POST['client_id'];

try {
    // 3. Database Connection
    $pdo = connectDB(); 

    // 4. Combined SQL Query
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
            la.loan_application_id,  -- <<< CRITICAL ID FOR UPDATE
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
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($data) {
        // Prepare data for JS consumption

        // has_barangay_clearance (1 or 0 -> true or false)
        $data['has_barangay_clearance'] = (bool)$data['has_barangay_clearance'];

        // hasValidIdCheck: true if has_valid_id is a valid ID name (not '0' or empty/null)
        $data['hasValidIdCheck'] = !empty($data['has_valid_id']) && $data['has_valid_id'] !== '0';
        
        // validIdType: The actual ID name, or an empty string if no valid ID is checked/found
        $data['validIdType'] = $data['hasValidIdCheck'] ? $data['has_valid_id'] : '';
        
        // 'cr' in JS is 'colateral' in DB
        $data['cr'] = $data['colateral']; 

        // Sanitize numeric fields for JS
        $data['years_in_job'] = (int)$data['years_in_job'];
        $data['loan_amount'] = (float)$data['loan_amount'];
        
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['error' => 'No pending account found for client ID: ' . $client_id]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database Error (FETCH): " . $e->getMessage());
    echo json_encode(['error' => 'Database error: Failed to retrieve client data.']);
} catch (Exception $e) {
    http_response_code(500);
    error_log("General Error (FETCH): " . $e->getMessage());
    echo json_encode(['error' => 'An unexpected error occurred during data retrieval.']);
}
?>