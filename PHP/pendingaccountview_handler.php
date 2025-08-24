<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root"; // XAMPP default username
$password = "";     // XAMPP default password
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Get the client ID from the GET request
if (isset($_GET['id'])) {
    $clientId = (int) $_GET['id'];

    $sqlget = "SELECT
    c.last_name,
    c.first_name,
    c.middle_name,
    c.marital_status,
    c.gender,
    c.date_of_birth,
    c.city,
    c.barangay,
    c.postal_code,
    c.street_address,
    c.phone_number,
    c.email,
    c.employment_status,
    c.occupation,
    c.years_in_job,
    c.income,
    r.has_valid_id,
    r.has_barangay_clearance,
    r.has_cr AS collateral,
    g.guarantor_last_name,
    g.guarantor_first_name,
    g.guarantor_middle_name,
    g.guarantor_street_address,
    g.guarantor_phone_number,
    l.loan_amount,
    l.payment_frequency,
    l.date_start,
    l.duration_of_loan,
    l.date_end
FROM
    clients AS c
JOIN
    client_requirements AS r ON c.client_ID = r.client_ID
JOIN
    guarantor AS g ON c.client_ID = g.client_ID
JOIN
    loan_applications AS l ON c.client_ID = l.client_ID
WHERE
    c.client_ID = ?";

    $stmt = $conn->prepare($sqlget);
    $stmt->bind_param("i", $clientId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    // Close the statement and connection
    $stmt->close();
    $conn->close();

    if ($row) {
        echo json_encode($row);
    } else {
        echo json_encode(["error" => "No client data found for this ID."]);
    }
} else {
    echo json_encode(["error" => "Client ID not provided."]);
}
?>