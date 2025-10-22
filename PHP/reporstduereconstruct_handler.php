<?php
// PHP/loan_reconstruct_handler.php - Handles updating loan terms for reconstruction

error_reporting(0);
ob_start(); 

include_once 'aadb_connect_handler.php'; // Centralized DB connection

// NOTE: We assume the logUserAction logic is available or handled by the caller.
// Since we don't have the internal logUserAction function, we'll only log PHP errors.

try {
    $pdo = connectDB();
} catch (\PDOException $e) {
    http_response_code(500);
    ob_clean();
    echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
    exit();
}

// 1. Check for required POST data
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || 
    !isset($_POST['loan_id'], $_POST['new_amount'], $_POST['new_frequency'], $_POST['new_date_end'], $_POST['original_colateral'])) {
    http_response_code(400);
    ob_clean();
    echo json_encode(['success' => false, 'error' => 'Invalid request or missing data.']);
    exit();
}

$loanId = $_POST['loan_id'];
$newAmount = $_POST['new_amount'];
$newFrequency = $_POST['new_frequency'];
$newDateEnd = $_POST['new_date_end']; 
$originalColateral = $_POST['original_colateral'];

// 2. Start Transaction
$pdo->beginTransaction();

try {
    // 3. Retrieve current terms (for detailed logging in audit trail if implemented)
    $sqlSelect = "
        SELECT 
            loan_amount, payment_frequency, date_end 
        FROM 
            loan_applications 
        WHERE 
            loan_application_id = :loan_id
    ";
    $stmtSelect = $pdo->prepare($sqlSelect);
    $stmtSelect->execute([':loan_id' => $loanId]);
    $originalTerms = $stmtSelect->fetch(PDO::FETCH_ASSOC);

    if (!$originalTerms) {
        $pdo->rollBack();
        http_response_code(404);
        ob_clean();
        echo json_encode(['success' => false, 'error' => 'Loan not found.']);
        exit();
    }
    
    $now = date('Y-m-d');
    // Generate a new duration text (simplistic approach)
    $newDurationText = 'Reconstructed (' . $newFrequency . ' until ' . $newDateEnd . ')';
    
    // Create a flag for the 'colateral' field: RECONSTRUCTED (DATE) - [Original Colateral]
    // Note: We use the original_colateral passed from JS to prevent potential stripping if the UI was only showing part of the field.
    // However, the cleanest way is to strip the old flag if one exists.
    $originalColateralClean = preg_replace('/^RECONSTRUCTED \(\d{4}-\d{2}-\d{2}\) - /', '', $originalColateral);
    $newColateral = "RECONSTRUCTED ({$now}) - " . $originalColateralClean;


    // 4. Update the loan application with new terms (OVERWRITING OLD TERMS)
    $sqlUpdate = "
        UPDATE 
            loan_applications
        SET 
            loan_amount = :new_amount,
            payment_frequency = :new_frequency,
            date_end = :new_date_end,
            duration_of_loan = :new_duration_text,
            colateral = :new_colateral 
        WHERE 
            loan_application_id = :loan_id 
            AND paid != 'Paid'
            AND status = 'approved'
    ";
    
    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->execute([
        ':new_amount' => $newAmount,
        ':new_frequency' => $newFrequency,
        ':new_date_end' => $newDateEnd,
        ':new_duration_text' => $newDurationText,
        ':new_colateral' => $newColateral,
        ':loan_id' => $loanId
    ]);

    if ($stmtUpdate->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(409);
        ob_clean();
        echo json_encode(['success' => false, 'error' => 'Update failed, loan may be fully paid or terms were not changed.']);
        exit();
    }

    // 5. Commit Transaction
    $pdo->commit();

    // 6. Return success
    ob_clean();
    echo json_encode(['success' => true, 'message' => 'Loan terms successfully reconstructed.']);

} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log("Loan Reconstruct Database Error: " . $e->getMessage());
    ob_clean();
    echo json_encode(['success' => false, 'error' => 'Database error during reconstruction.']);
}
exit();
?>