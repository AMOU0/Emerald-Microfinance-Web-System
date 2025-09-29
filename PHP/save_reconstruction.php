<?php
header('Content-Type: application/json');

// Database connection parameters
$servername = "localhost";
$username = "root"; // Your database username
$password = ""; // Your database password
$dbname = "emerald_microfinance"; // Your database name

// Create a new MySQLi connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'error' => "Connection failed: " . $conn->connect_error]));
}

// Check for POST request and required fields
if ($_SERVER['REQUEST_METHOD'] === 'POST' && 
    isset($_POST['loan_application_id'], $_POST['reconstruct_amount'], $_POST['payment_frequency'], 
          $_POST['interest_rate'], $_POST['date_start'], $_POST['duration'], 
          $_POST['date_end'])) {
    
    // Sanitize and validate input data
    // loan_application_id is bigint(20) in DB, use string or int
    $loan_application_id = filter_var($_POST['loan_application_id'], FILTER_VALIDATE_INT);
    // reconstruct_amount is decimal(10,2)
    $reconstruct_amount = filter_var($_POST['reconstruct_amount'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $payment_frequency = $conn->real_escape_string($_POST['payment_frequency']);
    // interest_rate is int(11)
    $interest_rate = filter_var($_POST['interest_rate'], FILTER_VALIDATE_INT);
    $date_start = $conn->real_escape_string($_POST['date_start']);
    $duration = $conn->real_escape_string($_POST['duration']);
    $date_end = $conn->real_escape_string($_POST['date_end']);
    // 'status' is required and must be 'active' as per the prompt/request
    $status = 'active'; 

    // Basic validation
    if (!$loan_application_id || !$reconstruct_amount || !$interest_rate || !$date_start || !$duration || !$date_end) {
        echo json_encode(['success' => false, 'error' => "Invalid or missing critical data."]);
        $conn->close();
        exit;
    }

    // SQL to insert the new loan reconstruction record, including the 'status' column
    $sql = "INSERT INTO `loan_reconstruct` (
                `loan_application_id`, 
                `reconstruct_amount`, 
                `payment_frequency`, 
                `interest_rate`, 
                `date_start`, 
                `duration`, 
                `date_end`, 
                `status`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        echo json_encode(['success' => false, 'error' => "Prepare failed: " . $conn->error]);
        $conn->close();
        exit;
    }

    // Bind parameters: 
    // i: integer (for loan_application_id and interest_rate)
    // d: decimal (for reconstruct_amount)
    // s: string (for the rest)
    $stmt->bind_param(
        "idsissss", 
        $loan_application_id, 
        $reconstruct_amount, 
        $payment_frequency, 
        $interest_rate, 
        $date_start, 
        $duration, 
        $date_end, 
        $status // Bound parameter for the 'active' status
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => "Loan reconstruction successfully recorded."]);
    } else {
        echo json_encode(['success' => false, 'error' => "Execute failed: " . $stmt->error]);
    }

    $stmt->close();

} else {
    echo json_encode(['success' => false, 'error' => "Invalid request method or missing parameters."]);
}

$conn->close();
?>