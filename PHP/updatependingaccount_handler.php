<?php
header('Content-Type: application/json');

// Database connection details
$servername = "localhost";
$username = "root"; // Replace with your database username
$password = "";     // Replace with your database password
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Check if the request method is POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Check if the client_id is set
    if (!isset($_POST['client_id'])) {
        echo json_encode(['error' => 'Client ID not provided.']);
        exit();
    }

    $clientId = $_POST['client_id'];

    // Start a transaction for atomicity
    $conn->begin_transaction();

    try {
        // Prepare and execute the UPDATE statement for the clients table
        $sql_clients = "UPDATE clients SET
                        last_name = ?,
                        first_name = ?,
                        middle_name = ?,
                        marital_status = ?,
                        gender = ?,
                        date_of_birth = ?,
                        city = ?,
                        barangay = ?,
                        postal_code = ?,
                        street_address = ?,
                        phone_number = ?,
                        email = ?,
                        employment_status = ?,
                        occupation = ?,
                        years_in_job = ?,
                        income = ?
                        WHERE client_ID = ?";

        $stmt_clients = $conn->prepare($sql_clients);
        $stmt_clients->bind_param("ssssssssssssssisi",
                                  $_POST['lastName'],
                                  $_POST['firstName'],
                                  $_POST['middleName'],
                                  $_POST['maritalStatus'],
                                  $_POST['gender'],
                                  $_POST['dateOfBirth'],
                                  $_POST['city'],
                                  $_POST['barangay'],
                                  $_POST['postalCode'],
                                  $_POST['streetAddress'],
                                  $_POST['phoneNumber'],
                                  $_POST['email'],
                                  $_POST['employmentStatus'],
                                  $_POST['occupationPosition'],
                                  $_POST['yearsInJob'],
                                  $_POST['incomeSalary'],
                                  $clientId);
        $stmt_clients->execute();

        // Prepare and execute the UPDATE statement for the client_requirements table
        // Note: The `has_cr` column is now updated from the `cr` field in the form.
        $hasBarangayClearance = isset($_POST['barangayClearance']) ? 1 : 0;
        $hasValidId = isset($_POST['validId']) ? 1 : 0;
        $sql_requirements = "UPDATE client_requirements SET
                             has_barangay_clearance = ?,
                             has_valid_id = ?,
                             has_cr = ?
                             WHERE client_ID = ?";
        $stmt_requirements = $conn->prepare($sql_requirements);
        $stmt_requirements->bind_param("iisi",
                                      $hasBarangayClearance,
                                      $hasValidId,
                                      $_POST['cr'],
                                      $clientId);
        $stmt_requirements->execute();


        // Prepare and execute the UPDATE statement for the guarantor table
        $sql_guarantor = "UPDATE guarantor SET
                          guarantor_last_name = ?,
                          guarantor_first_name = ?,
                          guarantor_middle_name = ?,
                          guarantor_street_address = ?,
                          guarantor_phone_number = ?
                          WHERE client_ID = ?";
        $stmt_guarantor = $conn->prepare($sql_guarantor);
        $stmt_guarantor->bind_param("sssssi",
                                    $_POST['guarantorLastName'],
                                    $_POST['guarantorFirstName'],
                                    $_POST['guarantorMiddleName'],
                                    $_POST['guarantorStreetAddress'],
                                    $_POST['guarantorPhoneNumber'],
                                    $clientId);
        $stmt_guarantor->execute();


        // Prepare and execute the UPDATE statement for the loan_applications table
        $sql_loans = "UPDATE loan_applications SET
                      loan_amount = ?,
                      payment_frequency = ?,
                      date_start = ?,
                      duration_of_loan = ?,
                      date_end = ?
                      WHERE client_ID = ?";
        $stmt_loans = $conn->prepare($sql_loans);
        $stmt_loans->bind_param("dssssi",
                                $_POST['loan-amount'],
                                $_POST['payment-frequency'],
                                $_POST['date-start'],
                                $_POST['duration-of-loan'],
                                $_POST['date-end'],
                                $clientId);
        $stmt_loans->execute();
        
        // Commit the transaction
        $conn->commit();

        echo json_encode(['success' => 'Client data updated successfully!']);

    } catch (mysqli_sql_exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        echo json_encode(['error' => 'Database update failed: ' . $e->getMessage()]);
    } finally {
        $stmt_clients->close();
        $stmt_requirements->close();
        $stmt_guarantor->close();
        $stmt_loans->close();
        $conn->close();
    }
} else {
    // Not a POST request
    echo json_encode(['error' => 'Invalid request method.']);
}
?>
