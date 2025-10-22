<?php
// ledgersview_handler.php

// Include the centralized database connection handler
require_once 'aadb_connect_handler.php';

// Set header for JSON response
header('Content-Type: application/json');

// --- 1. VALIDATE INPUT ---
if (!isset($_GET['client_id']) || empty($_GET['client_id'])) {
    echo json_encode(['error' => 'Client ID is missing.']);
    exit;
}

$clientId = $_GET['client_id'];

try {
    // --- 2. DATABASE CONNECTION (Using the centralized function) ---
    $pdo = connectDB();

    // --- 3. SQL QUERY ---
    $sql = "
        SELECT
            c.client_ID,
            c.first_name,
            c.middle_name,
            c.last_name,
            c.marital_status,
            c.gender,
            DATE_FORMAT(c.date_of_birth, '%M %d, %Y') AS formatted_dob,
            c.street_address,
            c.barangay,
            c.city,
            c.phone_number,
            c.employment_status,
            c.occupation,
            c.years_in_job,
            c.income,
            cr.has_valid_id AS collateral_valid_id,
            cr.has_barangay_clearance AS collateral_barangay_clearance
        FROM
            clients c
        LEFT JOIN
            client_requirements cr ON c.client_ID = cr.client_ID
        WHERE
            c.client_ID = ?
    ";

    // --- 4. EXECUTE QUERY ---
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$clientId]);
    $clientData = $stmt->fetch();

    if ($clientData) {
        // --- 5. FORMAT DATA FOR FRONTEND ---
        
        // Construct the full address
        $fullAddress = sprintf(
            "%s, %s, %s",
            $clientData['street_address'],
            $clientData['barangay'],
            $clientData['city']
        );

        // Construct the Contact / Email field (only phone_number is available in the query)
        $contact = sprintf(
            "%s", 
            $clientData['phone_number']
        );

        // Construct the Employment / Income field
        $employmentIncome = sprintf(
            "%s (%s, %d yrs) / %s",
            $clientData['employment_status'] ?? 'N/A',
            $clientData['occupation'] ?? 'N/A',
            $clientData['years_in_job'] ?? 0,
            $clientData['income'] ?? 'N/A'
        );
        
        // Construct the Collateral field
        $collateral = sprintf(
            "Valid ID: %s; Barangay Clearance: %s",
            $clientData['collateral_valid_id'] ?? 'N/A',
            $clientData['collateral_barangay_clearance'] == 1 ? 'Yes' : 'No'
        );

        // Prepare final data structure for the frontend
        $response = [
            'client_ID' => $clientData['client_ID'],
            'client_name' => "{$clientData['last_name']}, {$clientData['first_name']} {$clientData['middle_name']}",
            'marital_status' => $clientData['marital_status'] ?? 'N/A',
            'gender_dob' => "{$clientData['gender']} / {$clientData['formatted_dob']}",
            'address' => $fullAddress,
            'contact' => $contact, // <--- NEW FIELD ADDED
            'employment_income' => $employmentIncome, 
            'collateral' => $collateral
        ];

        // --- 6. OUTPUT SUCCESS ---
        echo json_encode($response);
    } else {
        echo json_encode(['error' => 'Client not found.']);
    }

} catch (\PDOException $e) {
    // --- 7. HANDLE ERROR ---
    error_log("Database error: " . $e->getMessage());
    echo json_encode(['error' => 'A database error occurred.']);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode(['error' => 'A critical error occurred.']);
}
?>