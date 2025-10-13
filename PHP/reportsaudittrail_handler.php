<?php
// PHP/reportsaudittrail_handler.php

header('Content-Type: application/json');

// Database connection parameters
$servername = "localhost";
$username = "root"; // Replace with your database username
$password = "";     // Replace with your database password
$dbname = "emerald_microfinance";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

// --- Helper Functions ---

/**
 * Fetches unique usernames for the filter dropdown.
 */
function fetchUniqueUsers($conn) {
    $user_sql = "SELECT DISTINCT username FROM user_accounts ORDER BY username ASC";
    $result = $conn->query($user_sql);
    $users = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $users[] = $row['username'];
        }
    }
    return $users;
}

/**
 * Fetches and filters the audit logs.
 */
function fetchAuditLogs($conn, $filters) {
    // Sanitize and prepare filter variables
    $startDate = $filters['startDate'] ?? null;
    $endDate = $filters['endDate'] ?? null;
    $action = $filters['action'] ?? null;
    $user = $filters['user'] ?? null;

    $sql = "
        SELECT 
            al.created_at AS timestamp, 
            ua.username AS user, 
            al.action, 
            al.description,  /* <-- ADDED: Fetching the actual detailed description */
            CONCAT(al.target_table, ' (ID: ', al.target_id, ')') AS target_resource, 
            al.ip_address, 
            al.before_state, 
            al.after_state
        FROM 
            audit_logs al
        JOIN 
            user_accounts ua ON al.user_id = ua.id
        WHERE 1=1 
    ";

    $params = [];
    $types = '';

    // Apply Date Range Filter
    if (!empty($startDate)) {
        // Add one day to the end date to include all logs from that day
        $adjustedEndDate = !empty($endDate) ? date('Y-m-d', strtotime($endDate . ' +1 day')) : null;
        
        $sql .= " AND al.created_at >= ? ";
        $types .= 's';
        $params[] = $startDate;

        if ($adjustedEndDate) {
            $sql .= " AND al.created_at < ? ";
            $types .= 's';
            $params[] = $adjustedEndDate;
        }
    }

    // Apply Action Filter (Updated for case-insensitivity)
    if (!empty($action)) {
        $sql .= " AND UPPER(al.action) = UPPER(?) ";
        $types .= 's';
        $params[] = $action;
    }

    // Apply User Filter
    if (!empty($user)) {
        $sql .= " AND ua.username = ? ";
        $types .= 's';
        $params[] = $user;
    }

    $sql .= " ORDER BY al.created_at DESC";

    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        throw new Exception("SQL Prepare Failed: " . $conn->error);
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result === false) {
        throw new Exception("SQL Execute Failed: " . $stmt->error);
    }

    $audit_data = [];
    while($row = $result->fetch_assoc()) {
        // Clean up nulls
        $row['before_state'] = $row['before_state'] ?? '';
        $row['after_state'] = $row['after_state'] ?? '';
        $audit_data[] = $row;
    }
    
    $stmt->close();
    return $audit_data;
}


// --- Main Logic ---

try {
    // 1. Handle User list request
    if (isset($_GET['fetch']) && $_GET['fetch'] === 'users') {
        header('Content-Type: application/json');
        $users = fetchUniqueUsers($conn);
        echo json_encode(["success" => true, "users" => $users]);
        exit();
    }

    // Get filters from GET request (used for both fetch and export)
    $filters = [
        'startDate' => $_GET['start_date'] ?? null,
        'endDate'   => $_GET['end_date'] ?? null,
        'action'    => $_GET['action'] ?? null,
        'user'      => $_GET['user'] ?? null,
    ];

    // 2. Handle CSV Export request
    if (isset($_GET['action_type']) && $_GET['action_type'] === 'export_csv') {
        $audit_data = fetchAuditLogs($conn, $filters);
        
        // CSV Headers updated to include 'Description' and 'Target Table/ID'
        $headers = [
            'Timestamp', 'User', 'Action', 'Description', 
            'Target Table/ID', 
            'IP Address', 'Before State', 'After State'
        ];
        
        // Output headers for file download
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="audit_trail_' . date('Ymd_His') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, $headers); // Write headers

        // Write data rows
        foreach ($audit_data as $row) {
            // Re-order the data fields to match the updated CSV headers
            fputcsv($output, [
                $row['timestamp'], 
                $row['user'], 
                $row['action'], 
                $row['description'],  // <-- Mapped to the new 'Description' column
                $row['target_resource'], // <-- Mapped to the 'Target Table/ID' column
                $row['ip_address'], 
                // Remove newlines and tabs from detail fields for cleaner CSV
                str_replace(["\n", "\r", "\t"], ' ', $row['before_state']),
                str_replace(["\n", "\r", "\t"], ' ', $row['after_state'])
            ]);
        }
        fclose($output);
        exit();
    }
    
    // 3. Handle Data Fetch request (Default)
    header('Content-Type: application/json');
    $audit_data = fetchAuditLogs($conn, $filters);
    echo json_encode(["success" => true, "data" => $audit_data]);
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>