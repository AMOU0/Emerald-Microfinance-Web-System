<?php
header('Content-Type: application/json');
date_default_timezone_set('Asia/Manila');

// --- Include Database Connection Handler and Connect ---
require_once 'aadb_connect_handler.php';
$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];
$pdo = null;

try {
    // Establish database connection 
    $pdo = connectDB(); // Get the PDO connection object
    // Set error mode for explicit transaction handling
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get the raw POST data
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    // Validate incoming data
    if ($data === null) {
        throw new Exception("Invalid JSON data received.");
    }

    $required_fields = ['clientID', 'colateral', 'guarantorLastName', 'guarantorFirstName', 'guarantorStreetAddress', 'guarantorPhoneNumber', 'loan-amount', 'payment-frequency', 'date-start', 'duration-of-loan', 'date-end', 'interest-rate'];
    foreach ($required_fields as $field) {
        // Use trim to check for empty or whitespace-only strings
        if (!isset($data[$field]) || (is_string($data[$field]) && empty(trim($data[$field])))) {
            throw new Exception("Required field '{$field}' is missing or empty.");
        }
    }

    // Sanitize and prepare data for insertion
    $clientID = $data['clientID'];
    $colateral = $data['colateral'];
    $loan_amount = (float)$data['loan-amount']; // CRITICAL for the new rule
    $payment_frequency = $data['payment-frequency'];
    $date_start = $data['date-start'];
    $duration_of_loan = $data['duration-of-loan'];
    $date_end = $data['date-end'];
    $interest_rate = (int)$data['interest-rate'];
    
    $guarantorLastName = $data['guarantorLastName'];
    $guarantorFirstName = $data['guarantorFirstName'];
    $guarantorMiddleName = isset($data['guarantorMiddleName']) ? $data['guarantorMiddleName'] : '';
    $guarantorStreetAddress = $data['guarantorStreetAddress'];
    $guarantorPhoneNumber = $data['guarantorPhoneNumber'];

    // --- START: NEW Loan History Check and Max Loan Logic (Security Layer) ---
    $maxFirstLoanAmount = 5000.00; // Max limit for first loan
    $maxOutstandingBalance = 2000.00; // NEW: Max outstanding balance limit (₱2,000)

    // 1. Check for Existing Net Outstanding Balance (Principal + Interest - Payments)
    // The query calculates the total obligation minus total payments for all active loans.
    $sql_outstanding_balance = "
        SELECT
            COALESCE(SUM(
                -- Total Obligation (Principal + Interest)
                la.loan_amount * (1 + (la.interest_rate / 100))
                -- Minus Total Payments for this loan
                - COALESCE(p_summary.total_paid, 0)
            ), 0) AS net_outstanding_balance
        FROM
            loan_applications la
        LEFT JOIN
            (SELECT loan_application_id, SUM(amount_paid) AS total_paid FROM payment GROUP BY loan_application_id) p_summary 
            ON la.loan_application_id = p_summary.loan_application_id
        WHERE
            la.client_ID = :clientID 
            -- MODIFIED: Only count the balance if the loan is Approved, Released/forrelease, and Unpaid.
            AND la.status = 'Approved' 
            AND la.release_status IN ('Released', 'forrelease')
            AND la.paid = 'Unpaid'";
    
    $stmt_balance = $pdo->prepare($sql_outstanding_balance);
    $stmt_balance->bindParam(":clientID", $clientID);
    $stmt_balance->execute();
    $balance_history = $stmt_balance->fetch(PDO::FETCH_ASSOC);
    $total_outstanding_balance = (float)$balance_history['net_outstanding_balance'];

    if ($total_outstanding_balance > $maxOutstandingBalance) {
        // Throw an exception to stop the transaction
        throw new Exception("The client has an existing net outstanding loan balance of " . number_format($total_outstanding_balance, 2) . ". The maximum allowed outstanding balance is " . number_format($maxOutstandingBalance, 2) . ".");
    }
    
    // 2. Query the database to count existing loans for the client (Original First Loan Check)
    $sql_loan_count = "SELECT COUNT(*) as loan_count FROM loan_applications WHERE client_ID = :clientID";
    $stmt_count = $pdo->prepare($sql_loan_count);
    $stmt_count->bindParam(":clientID", $clientID);
    $stmt_count->execute();
    $loan_history = $stmt_count->fetch(PDO::FETCH_ASSOC);
    $loan_count = (int)$loan_history['loan_count'];

    // 3. Check if this is the client's first loan AND if the requested amount exceeds the limit
    if ($loan_count === 0) {
        if ($loan_amount > $maxFirstLoanAmount) {
            // Throw an exception to stop the transaction
            throw new Exception("This is the client's first loan. The maximum allowed loan amount is " . number_format($maxFirstLoanAmount, 2) . ".");
        }
    }
    // --- END: NEW Loan History Check and Max Loan Logic ---


    // Begin transaction
    $pdo->beginTransaction();

    // === START MODIFICATION FOR LOAN APPLICATION ID FORMAT ===
    // Generate a unique loan application ID (Format: mmyyyy00001, sequential count resets monthly)
    $current_month = date("m");
    $current_year = date("Y");
    $current_month_year = date("mY"); // For the ID prefix
    
    // Count loan applications created in the current month and year
    // Note: The previous check used the 'loan_applications' table. This count is for ID generation.
    $sql_count = "SELECT COUNT(*) as count FROM loan_applications WHERE YEAR(created_at) = :year AND MONTH(created_at) = :month";
    $stmt_count = $pdo->prepare($sql_count);
    $stmt_count->bindParam(":year", $current_year);
    $stmt_count->bindParam(":month", $current_month);
    $stmt_count->execute();
    $row_count = $stmt_count->fetch(PDO::FETCH_ASSOC);
    $loan_count = $row_count['count'] + 1;
    
    // Construct the new ID: mmyyyy + padded sequential number
    $loan_application_id = $current_month_year . str_pad($loan_count, 5, '0', STR_PAD_LEFT);
    // === END MODIFICATION FOR LOAN APPLICATION ID FORMAT ===

    // Insert into `loan_applications` table
    $sql_loan = "INSERT INTO `loan_applications` (`loan_application_id`, `colateral`, `loan_amount`, `payment_frequency`, `date_start`, `duration_of_loan`, `interest_rate`, `date_end`, `client_ID`, `status`, `paid`) VALUES (:id, :colateral, :amount, :frequency, :start, :duration, :rate, :end, :client, 'Pending', 'Unpaid')";
    $stmt_loan = $pdo->prepare($sql_loan);
    $stmt_loan->bindParam(":id", $loan_application_id);
    $stmt_loan->bindParam(":colateral", $colateral);
    $stmt_loan->bindParam(":amount", $loan_amount);
    $stmt_loan->bindParam(":frequency", $payment_frequency);
    $stmt_loan->bindParam(":start", $date_start);
    $stmt_loan->bindParam(":duration", $duration_of_loan);
    $stmt_loan->bindParam(":rate", $interest_rate, PDO::PARAM_INT);
    $stmt_loan->bindParam(":end", $date_end);
    $stmt_loan->bindParam(":client", $clientID);

    if (!$stmt_loan->execute()) {
        throw new Exception("Error inserting loan application.");
    }
    
    // Insert into `guarantor` table
    $sql_guarantor = "INSERT INTO `guarantor` (`guarantor_last_name`, `guarantor_first_name`, `guarantor_middle_name`, `guarantor_street_address`, `guarantor_phone_number`, `loan_application_id`, `client_ID`) VALUES (:lastName, :firstName, :middleName, :address, :phone, :loanId, :clientId)";
    $stmt_guarantor = $pdo->prepare($sql_guarantor);
    $stmt_guarantor->bindParam(":lastName", $guarantorLastName);
    $stmt_guarantor->bindParam(":firstName", $guarantorFirstName);
    $stmt_guarantor->bindParam(":middleName", $guarantorMiddleName);
    $stmt_guarantor->bindParam(":address", $guarantorStreetAddress);
    $stmt_guarantor->bindParam(":phone", $guarantorPhoneNumber);
    $stmt_guarantor->bindParam(":loanId", $loan_application_id);
    $stmt_guarantor->bindParam(":clientId", $clientID);
    
    if (!$stmt_guarantor->execute()) {
        throw new Exception("Error inserting guarantor.");
    }

    // Commit the transaction
    $pdo->commit();

    $response['status'] = 'success';
    $response['message'] = 'Loan application and guarantor details saved successfully.';
    $response['loan_application_id'] = $loan_application_id;

} catch (Exception $e) {
    // Rollback the transaction on error
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Check for PDO errors if not an application logic error
    $response['message'] = 'Transaction failed: ' . $e->getMessage();
    http_response_code(500); // Set status code for server error
} finally {
    echo json_encode($response);
}
?>