<?php
// Set header to return JSON format
header('Content-Type: application/json');
// --- Database Connection Configuration ---
$servername = "localhost";
$username = "root"; // <-- UPDATE: Replace with your actual database username
$password = "";     // <-- UPDATE: Replace with your actual database password
$dbname = "emerald_microfinance";

// --- DYNAMIC CLIENT ID RETRIEVAL --
// Fetches the client_id from the URL query parameter (e.g., ?client_id=123)
$client_id = isset($_GET['client_id']) ? $_GET['client_id'] : null;

// Check if client_id was provided
if (!$client_id) {
    die(json_encode(["success" => false, "message" => "Client ID not specified in the URL."]));
}

// Create connection

$conn = new mysqli($servername, $username, $password, $dbname);



// Check connection

if ($conn->connect_error) {

    die(json_encode(["success" => false, "error" => "Connection failed: " . $conn->connect_error]));

}



// SQL to fetch client data, requirements, and loan collateral using JOINs

$sql = "

    SELECT

        c.last_name, c.first_name, c.middle_name, c.marital_status, c.gender, c.date_of_birth,

        c.city, c.barangay, c.postal_code, c.street_address, c.phone_number, c.email,

        c.employment_status, c.occupation, c.years_in_job, c.income,

        cr.has_barangay_clearance,

        cr.has_valid_id,

        la.colateral

    FROM clients c

    LEFT JOIN client_requirements cr ON c.client_ID = cr.client_ID

    LEFT JOIN loan_applications la ON c.client_ID = la.client_ID

    WHERE c.client_ID = ?

    LIMIT 1;

";



$stmt = $conn->prepare($sql);



if ($stmt === false) {

    $response = ["success" => false, "message" => "SQL Prepare Failed: " . $conn->error];

} else {

    // Bind the dynamically retrieved client ID

    $stmt->bind_param("i", $client_id);

    $stmt->execute();

    $result = $stmt->get_result();



    if ($result->num_rows > 0) {

        $data = $result->fetch_assoc();

       

        // Convert '0' and '1' from database to boolean-like values for JavaScript

        $data['has_barangay_clearance'] = ($data['has_barangay_clearance'] == 1);

       

        $response = [

            "success" => true,

            "client" => $data

        ];

    } else {

        $response = [

            "success" => false,

            "message" => "Client with ID $client_id not found."

        ];

    }

    $stmt->close();

}



$conn->close();



echo json_encode($response);

?>
