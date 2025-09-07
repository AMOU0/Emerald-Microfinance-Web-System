<?php
// Set content type to JSON
header('Content-Type: application/json');

// Database connection parameters
$servername = "localhost";
$username = "root"; // Replace with your actual database username
$password = ""; // Replace with your actual database password
$dbname = "emerald_microfinance";

// Initialize response array
$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];
$conn = null;

try {
    // 1. Receive and decode the JSON data from the request body
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    // Validate incoming data
    if ($data === null) {
        throw new Exception("Invalid JSON data received.");
    }

    // Required fields check, matching the JS validation
    $required_fields = [
        'clientID', 'colateral', 'guarantorLastName', 'guarantorFirstName', 
        'guarantorMiddleName', 'guarantorStreetAddress', 'guarantorPhoneNumber', 
        'loan-amount', 'payment-frequency', 'date-start', 'duration-of-loan', 
        'date-end', 'interest-rate'
    ];

    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
            throw new Exception("Missing or empty required field: " . $field);
        }
    }

    // Sanitize and prepare data
    $clientID = intval($data['clientID']);
    $colateral = htmlspecialchars(trim($data['colateral']));
    $loan_amount = floatval($data['loan-amount']);
    $payment_frequency = htmlspecialchars(trim($data['payment-frequency']));
    $date_start = htmlspecialchars(trim($data['date-start']));
    $duration_of_loan = htmlspecialchars(trim($data['duration-of-loan']));
    $interest_rate = intval($data['interest-rate']);
    $date_end = htmlspecialchars(trim($data['date-end']));

    $guarantorLastName = htmlspecialchars(trim($data['guarantorLastName']));
    $guarantorFirstName = htmlspecialchars(trim($data['guarantorFirstName']));
    $guarantorMiddleName = htmlspecialchars(trim($data['guarantorMiddleName']));
    $guarantorStreetAddress = htmlspecialchars(trim($data['guarantorStreetAddress']));
    $guarantorPhoneNumber = htmlspecialchars(trim($data['guarantorPhoneNumber']));

    // 2. Connect to the database
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Start transaction for atomicity
    $conn->begin_transaction();

    // 3. Generate new loan_application_id (simple logic based on date + sequence)
    // A more robust method should be used in production, potentially utilizing a sequence table or auto-increment with specific formatting rules.
    $today_prefix = date('Ymd');
    
    // Get the highest loan_application_id for today's date
    $stmt_max_id = $conn->prepare("SELECT MAX(loan_application_id) AS max_id FROM loan_applications WHERE loan_application_id LIKE ?");
    $search_pattern = $today_prefix . '%';
    $stmt_max_id->bind_param("s", $search_pattern);
    $stmt_max_id->execute();
    $result_max_id = $stmt_max_id->get_result()->fetch_assoc();
    $stmt_max_id->close();

    $new_sequence = 1;
    if ($result_max_id['max_id']) {
        // Extract the sequence number part and increment
        $current_max_id = $result_max_id['max_id'];
        $current_sequence = substr($current_max_id, 8); // Assumes YYYYMMDD part is 8 digits
        $new_sequence = intval($current_sequence) + 1;
    }
    // Format the new loan ID (YYYYMMDD + 5-digit zero-padded sequence)
    $new_loan_application_id = $today_prefix . str_pad($new_sequence, 5, '0', STR_PAD_LEFT);


    // 4. Insert into loan_applications table
    $sql_loan = "INSERT INTO loan_applications (loan_application_id, colateral, loan_amount, payment_frequency, date_start, duration_of_loan, interest_rate, date_end, client_ID, status, paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '0')";
    $stmt_loan = $conn->prepare($sql_loan);
    $stmt_loan->bind_param(
        "isdsssisd", // i: integer (loan_id, client_id, interest_rate), s: string, d: decimal/double (loan_amount)
        $new_loan_application_id,
        $colateral,
        $loan_amount,
        $payment_frequency,
        $date_start,
        $duration_of_loan,
        $interest_rate,
        $date_end,
        $clientID
    );

    if (!$stmt_loan->execute()) {
        throw new Exception("Error inserting loan application: " . $stmt_loan->error);
    }
    $stmt_loan->close();

    // 5. Insert into guarantor table
    $sql_guarantor = "INSERT INTO guarantor (guarantor_last_name, guarantor_first_name, guarantor_middle_name, guarantor_street_address, guarantor_phone_number, loan_application_id, client_ID, colateral) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt_guarantor = $conn->prepare($sql_guarantor);
    $stmt_guarantor->bind_param(
        "sssssisd", // s: string, i: integer (loan_application_id, client_ID), s: string, d: decimal/double (colateral is varchar, so s)
        $guarantorLastName,
        $guarantorFirstName,
        $guarantorMiddleName,
        $guarantorStreetAddress,
        $guarantorPhoneNumber,
        $new_loan_application_id,
        $clientID,
        $colateral
    );
    // Note: The colateral field in the 'guarantor' table is VARCHAR(30) and the loan_application_id is BIGINT(20). 
    // The binding 's' for colateral is correct for VARCHAR.

    if (!$stmt_guarantor->execute()) {
        throw new Exception("Error inserting guarantor: " . $stmt_guarantor->error);
    }
    $stmt_guarantor->close();

    // Commit transaction
    $conn->commit();

    // 6. Return success response
    $response['status'] = 'success';
    $response['message'] = 'Loan application successfully submitted and guarantor information saved.';
    $response['loan_application_id'] = $new_loan_application_id;

} catch (Exception $e) {
    // Rollback transaction on error
    if ($conn && $conn->in_transaction) {
        $conn->rollback();
    }
    $response['message'] = 'Error: ' . $e->getMessage();
} finally {
    // Close database connection
    if ($conn) {
        $conn->close();
    }
    // Output the JSON response
    echo json_encode($response);
}

// Check for and handle the missing element 'cr' in the frontend.
// The provided JS uses: document.getElementById('cr').value.trim() for colateral.
// However, the HTML has <input type="text" id="colateral" name="colateral" class="form-input" required>.
// I have assumed the HTML ID `colateral` is correct, and the JS is meant to use `colateral` instead of `cr`.
// I've used $data['colateral'] in PHP based on the key name used in the JS object: colateral: document.getElementById('cr').value.trim(), 

?>