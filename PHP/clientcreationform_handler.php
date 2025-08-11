<?php
ob_start();

error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// Database Configuration 
$servername = "localhost";
$username = "root"; // XAMPP default username
$password = "";     // XAMPP default password
$dbname = "emerald_microfinance";

header('Content-Type: application/json');

function handleError($message) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => $message]);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST)) {
        handleError("Invalid request. This script only accepts POST requests with form data.");
    }

    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $conn->beginTransaction();

    // --- 1. Insert into the `clients` table ---
    $client_sql = "INSERT INTO clients (
        last_name, first_name, middle_name, marital_status, gender, date_of_birth,
        city, barangay, postal_code, street_address, phone_number, email,
        employment_status, occupation, years_in_job, income
    ) VALUES (
        :lastName, :firstName, :middleName, :maritalStatus, :gender, :dateOfBirth,
        :city, :barangay, :postalCode, :streetAddress, :phoneNumber, :email,
        :employmentStatus, :occupation, :yearsInJob, :income
    )";
    $client_stmt = $conn->prepare($client_sql);
    $client_stmt->execute([
        ':lastName' => $_POST['lastName'],
        ':firstName' => $_POST['firstName'],
        ':middleName' => $_POST['middleName'],
        ':maritalStatus' => $_POST['maritalStatus'],
        ':gender' => $_POST['gender'],
        ':dateOfBirth' => $_POST['dateOfBirth'],
        ':city' => $_POST['city'],
        ':barangay' => $_POST['barangay'],
        ':postalCode' => $_POST['postalCode'],
        ':streetAddress' => $_POST['streetAddress'],
        ':phoneNumber' => $_POST['phoneNumber'],
        ':email' => $_POST['email'],
        ':employmentStatus' => $_POST['employmentStatus'],
        ':occupation' => $_POST['occupationPosition'],
        ':yearsInJob' => $_POST['yearsInJob'],
        ':income' => $_POST['incomeSalary']
    ]);

    $client_ID = $conn->lastInsertId();

    // --- 2. Insert into the `guarantor` table ---
    $guarantor_sql = "INSERT INTO guarantor (
        last_name, first_name, middle_name, marital_status, gender, date_of_birth,
        city, barangay, postal_code, street_address, phone_number, email,
        employment_status, occupation, years_in_job, income, client_ID
    ) VALUES (
        :lastName, :firstName, :middleName, :maritalStatus, :gender, :dateOfBirth,
        :city, :barangay, :postalCode, :streetAddress, :phoneNumber, :email,
        :employmentStatus, :occupation, :yearsInJob, :income, :clientID
    )";
    $guarantor_stmt = $conn->prepare($guarantor_sql);
    $guarantor_stmt->execute([
        ':lastName' => $_POST['guarantorLastName'],
        ':firstName' => $_POST['guarantorFirstName'],
        ':middleName' => $_POST['guarantorMiddleName'],
        ':maritalStatus' => $_POST['guarantorMaritalStatus'],
        ':gender' => $_POST['guarantorGender'],
        ':dateOfBirth' => $_POST['guarantorDateOfBirth'],
        ':city' => $_POST['guarantorCity'],
        ':barangay' => $_POST['guarantorBarangay'],
        ':postalCode' => $_POST['guarantorPostalCode'],
        ':streetAddress' => $_POST['guarantorStreetAddress'],
        ':phoneNumber' => $_POST['guarantorPhoneNumber'],
        ':email' => $_POST['guarantorEmail'],
        ':employmentStatus' => $_POST['guarantorEmploymentStatus'],
        ':occupation' => $_POST['guarantorOccupationPosition'],
        ':yearsInJob' => $_POST['guarantorYearsInJob'],
        ':income' => $_POST['guarantorIncomeSalary'],
        ':clientID' => $client_ID
    ]);

    // --- 3. Insert into the `client_loan` table ---
    $loan_sql = "INSERT INTO client_loan (
        loan_amount, interest_rate, payment_frequency, start_date, duration_of_payment, client_ID
    ) VALUES (
        :loanAmount, :interestRate, :paymentFrequency, :startDate, :durationOfPayment, :clientID
    )";
    $loan_stmt = $conn->prepare($loan_sql);
    $loan_stmt->execute([
        ':loanAmount' => $_POST['loanAmount'],
        ':interestRate' => $_POST['interestRate'],
        ':paymentFrequency' => $_POST['paymentFrequency'],
        ':startDate' => $_POST['startDate'],
        ':durationOfPayment' => $_POST['durationOfPayment'],
        ':clientID' => $client_ID
    ]);

    // --- 4. Insert into the `client_requirements` table ---
    $validId_pic = ($_POST['validId'] == '1') ? 'Valid ID provided' : 'Not provided';
    $barangay_clearance_pic = ($_POST['barangayClearance'] == '1') ? 'Barangay clearance provided' : 'Not provided';
    $cr_or_pic = ($_POST['cr'] == '1') ? 'CR/OR/Verification provided' : 'Not provided';
    $collateral_pic = !empty($_POST['collateral']) ? 'Collateral provided' : 'Not provided';

    $requirements_sql = "INSERT INTO client_requirements (
        validID_pic, validID_number, barangay_clearance_pic, collateral_pic, or_cr_pic, client_ID
    ) VALUES (
        :validIDPic, :validIDNumber, :barangayClearancePic, :collateralPic, :orCrPic, :clientID
    )";
    $requirements_stmt = $conn->prepare($requirements_sql);
    $requirements_stmt->execute([
        ':validIDPic' => $validId_pic,
        ':validIDNumber' => $_POST['idNumber'],
        ':barangayClearancePic' => $barangay_clearance_pic,
        ':collateralPic' => $collateral_pic,
        ':orCrPic' => $cr_or_pic,
        ':clientID' => $client_ID
    ]);
    
    $conn->commit();
    
    ob_end_clean();
    echo json_encode(['success' => true, 'message' => 'Client created successfully.']);

} catch (PDOException $e) {
    $conn->rollBack();
    handleError("Database Error: " . $e->getMessage());
} catch (Exception $e) {
    handleError("An unexpected error occurred: " . $e->getMessage());
}
?>
