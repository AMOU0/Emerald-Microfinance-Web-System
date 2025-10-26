<?php
// loanapplicationcheckpendingloan_handler.php 

header('Content-Type: application/json');

// --- Include Database Connection Handler and Connect ---
// ASSUMPTION: 'aadb_connect_handler.php' contains your connectDB() function
require_once 'aadb_connect_handler.php'; 
$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];

try {
   // Establish database connection
   $pdo = connectDB();
   $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
   
   // Get the client ID from the URL query string
   $clientID = trim($_GET['clientID'] ?? '');

   if (empty($clientID)) {
     throw new Exception("Client ID is missing.");
   }

   // The SQL query is updated to check for loans matching your specific 'Active' OR 'Pending' definitions:
   // Active: (status='approved' AND release_status IN ('Released', 'forrelease') AND paid='Unpaid')
   // Pending: (status='Pending' AND release_status IS NULL AND paid='Unpaid')
   
   $sql = "
     SELECT COUNT(*) as active_or_pending_loan_count 
     FROM loan_applications 
     WHERE client_ID = :clientID 
      AND (
         -- Check for Active Loans
         (
           status = 'approved' 
           AND release_status IN ('Released', 'forrelease') 
           AND paid = 'Unpaid'
         )
         OR
         -- Check for Pending Loans
         (
           status = 'Pending' 
           AND release_status IS NULL 
           AND paid = 'Unpaid'
         )
       )";
   
   $stmt = $pdo->prepare($sql);
   $stmt->bindParam(":clientID", $clientID);
   $stmt->execute();
   
   $row = $stmt->fetch(PDO::FETCH_ASSOC);
   $count = (int)$row['active_or_pending_loan_count'];

   // Prepare the successful response
   $response['status'] = 'success';
   $response['active_or_pending_loan_count'] = $count;
   $response['has_pending_loan'] = ($count > 0);

} catch (Exception $e) {
   // Log error (replace with your actual logging mechanism)
   error_log("Pending Loan Check Error: " . $e->getMessage());
   $response['message'] = "Database error: " . $e->getMessage();
} finally {
   // Send the JSON response
   echo json_encode($response);
}
?>