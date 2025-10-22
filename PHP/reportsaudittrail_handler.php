<?php
// PHP/reportsaudittrail_handler.php - MODIFIED to use aadb_connect_handler.php (PDO)

header('Content-Type: application/json');

// Include the centralized database connection function
include_once 'aadb_connect_handler.php'; // Assuming this file is in the same directory

// --- Helper Functions ---

/**
 * Fetches unique usernames for the filter dropdown.
 * @param PDO $pdo The PDO connection object.
 */
function fetchUniqueUsers($pdo) {
    $user_sql = "SELECT DISTINCT username FROM user_accounts ORDER BY username ASC";
    $stmt = $pdo->query($user_sql);
    $users = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $users[] = $row['username'];
    }
    return $users;
}

/**
 * Fetches and filters the audit logs.
 * @param PDO $pdo The PDO connection object.
 */
function fetchAuditLogs($pdo, $filters) {
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
            al.description, 
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

    // Apply Date Range Filter
    if (!empty($startDate)) {
        // Add one day to the end date to include all logs from that day
        $adjustedEndDate = !empty($endDate) ? date('Y-m-d', strtotime($endDate . ' +1 day')) : null;
        
        $sql .= " AND al.created_at >= :startDate ";
        $params[':startDate'] = $startDate;

        if ($adjustedEndDate) {
            $sql .= " AND al.created_at < :adjustedEndDate ";
            $params[':adjustedEndDate'] = $adjustedEndDate;
        }
    }

    // Apply Action Filter (Updated for case-insensitivity)
    if (!empty($action)) {
        $sql .= " AND UPPER(al.action) = UPPER(:action) ";
        $params[':action'] = $action;
    }

    // Apply User Filter
    if (!empty($user)) {
        $sql .= " AND ua.username = :user ";
        $params[':user'] = $user;
    }

    $sql .= " ORDER BY al.created_at DESC";

    $stmt = $pdo->prepare($sql);
    
    if (!$stmt->execute($params)) {
        // This should be caught by the general PDOException but good practice to check
        throw new Exception("SQL Execute Failed."); 
    }

    $audit_data = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Clean up nulls
        $row['before_state'] = $row['before_state'] ?? '';
        $row['after_state'] = $row['after_state'] ?? '';
        $audit_data[] = $row;
    }
    
    return $audit_data;
}


// --- Main Logic ---

try {
    // 1. DATABASE CONNECTION
    $pdo = connectDB();

    // 1. Handle User list request
    if (isset($_GET['fetch']) && $_GET['fetch'] === 'users') {
        header('Content-Type: application/json');
        $users = fetchUniqueUsers($pdo);
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
        $audit_data = fetchAuditLogs($pdo, $filters);
        
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
    $audit_data = fetchAuditLogs($pdo, $filters);
    echo json_encode(["success" => true, "data" => $audit_data]);
    
} catch (Exception $e) {
    // Catches exceptions thrown in helper functions or general PDO exceptions
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

// The connection is automatically closed when the $pdo object goes out of scope.
?>