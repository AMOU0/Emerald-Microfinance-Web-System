<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'emerald_microfinance';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $clientId = $_GET['client_id'] ?? null;

    if (!$clientId) {
        echo json_encode(['status' => 'error', 'message' => 'Client ID not provided.']);
        exit;
    }

    $clientSql = "
        SELECT 
            c.*, 
            cr.has_valid_id, 
            cr.has_barangay_clearance, 
            cr.has_cr 
        FROM clients c
        LEFT JOIN client_requirements cr ON c.client_ID = cr.client_ID
        WHERE c.client_ID = :client_id
    ";
    $clientStmt = $pdo->prepare($clientSql);
    $clientStmt->bindParam(':client_id', $clientId, PDO::PARAM_INT);
    $clientStmt->execute();
    $clientData = $clientStmt->fetch(PDO::FETCH_ASSOC);

    if (!$clientData) {
        echo json_encode(['status' => 'error', 'message' => 'Client not found.']);
        exit;
    }

    echo json_encode(['status' => 'success', 'data' => $clientData]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>