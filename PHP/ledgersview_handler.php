<?php
// Configuration for database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "emerald_microfinance";
$charset = 'utf8mb4';

// PDO DSN (Data Source Name) - Corrected to use defined variables
$dsn = "mysql:host=$servername;dbname=$dbname;charset=$charset";
$options = [
    // Throw exceptions on errors
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    // Fetch results as associative arrays by default
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    // Turn off emulation mode for prepared statements
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// Set header for JSON response
header('Content-Type: application/json');

// --- 1. VALIDATE INPUT ---
if (!isset($_GET['client_id']) || empty($_GET['client_id'])) {
    echo json_encode(['error' => 'Client ID is missing.']);
    exit;
}

$clientId = $_GET['client_id'];

try {
    // --- 2. DATABASE CONNECTION ---
    $pdo = new PDO($dsn, $username, $password, $options);

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
            c.postal_code,
            c.phone_number,
            c.email,
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
            "%s, %s, %s %s",
            $clientData['street_address'],
            $clientData['barangay'],
            $clientData['city'],
            $clientData['postal_code']
        );

        // Construct the Contact / Email field
        $contactEmail = sprintf(
            "%s / %s",
            $clientData['phone_number'],
            $clientData['email'] ?? 'N/A'
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
            'contact_email' => $contactEmail,
            'employment_income' => $employmentIncome, // The requested field
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
}

?>