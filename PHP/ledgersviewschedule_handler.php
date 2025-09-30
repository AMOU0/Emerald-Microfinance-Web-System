<?php
// PHP/ledgersviewschedule_handler.php
header('Content-Type: application/json');

// --- 1. Database Configuration ---
$servername = "localhost";
$username = "root";
$password = "";    
$dbname = "emerald_microfinance";

// --- 2. Database Connection ---
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit();
}

// --- 3. Input Validation ---
if (!isset($_POST['loan_application_id']) || !is_numeric($_POST['loan_application_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid or missing loan application ID.']);
    exit();
}

$loan_id = $_POST['loan_application_id'];

// =========================================================================================
// UTILITY FUNCTIONS
// =========================================================================================

/**
 * Calculates the full amortization schedule based on Simple Interest.
 * @param float $principal The principal loan amount.
 * @param float $rate The annual interest rate (e.g., 0.20 for 20%).
 * @param string $frequency The payment frequency ('monthly', 'weekly', etc.).
 * @param string $startDate The loan start date (Y-m-d).
 * @param string $endDate The loan end date (Y-m-d).
 * @returns array The amortization schedule array.
 */
function calculateAmortization(float $principal, float $rate, string $frequency, string $startDate, string $endDate): array {
    // Calculate Total Repayable Amount (Principal + Simple Interest)
    $totalRepayable = $principal * (1 + $rate);
    $totalInterest = $totalRepayable - $principal;
    
    $schedule = [];
    $remainingBalance = $totalRepayable;

    $dateStart = new DateTime($startDate);
    $dateEnd = new DateTime($endDate);
    $intervalSpec = '';
    
    switch (strtolower($frequency)) {
        case 'monthly':
            $intervalSpec = '1 month';
            break;
        case 'weekly':
            $intervalSpec = '1 week';
            break;
        // Add other frequencies as needed
        default:
            $intervalSpec = '1 month'; 
            break;
    }

    // Use the number of months based on duration for simplicity (since payment amount isn't given)
    $duration_days = $dateEnd->diff($dateStart)->days;
    
    if (strtolower($frequency) === 'monthly') {
        $numPeriods = max(1, round($duration_days / 30.4375)); // Average days in a month
    } elseif (strtolower($frequency) === 'weekly') {
        $numPeriods = max(1, round($duration_days / 7));
    } else {
        $numPeriods = 1; // Default to 1 payment if frequency is weird
    }
    
    $levelPayment = $totalRepayable / $numPeriods;
    $fixedPrincipalPerPayment = $principal / $numPeriods;
    $fixedInterestPerPayment = $totalInterest / $numPeriods;

    $currentDate = new DateTime($startDate);
    $remainingBalance = $totalRepayable;

    for ($i = 1; $i <= $numPeriods; $i++) {
        // Calculate Due Date
        if ($i > 1) {
            $currentDate->modify($intervalSpec);
        }
        
        // Last payment might be slightly different due to rounding
        $paymentAmount = $levelPayment;
        $principalPaid = $fixedPrincipalPerPayment;
        $interestPaid = $fixedInterestPerPayment;

        if ($i === $numPeriods) {
            $paymentAmount = $remainingBalance;
            $principalPaid = $principal - ($fixedPrincipalPerPayment * ($numPeriods - 1));
            $interestPaid = $totalInterest - ($fixedInterestPerPayment * ($numPeriods - 1));
            $remainingBalance = 0;
        } else {
            $remainingBalance -= $levelPayment;
        }

        $schedule[] = [
            'due_date' => $currentDate->format('Y-m-d'),
            'payment_amount' => round($paymentAmount, 2),
            'principal_paid' => round($principalPaid, 2),
            'interest_paid' => round($interestPaid, 2),
            'remaining_balance' => max(0, round($remainingBalance, 2)), // Ensure no negative balance
        ];
    }

    return $schedule;
}

/**
 * Merges scheduled installments and actual payments into a single chronological list.
 * @param array $schedule The amortization schedule (due dates, amounts).
 * @param array $payments The actual payment records (payment dates, amounts).
 * @return array The merged and chronologically sorted list of events.
 */
function mergeAndSortEvents(array $schedule, array $payments): array {
    // 1. Standardize schedule items: add payment-related null fields
    $merged = array_map(function($item) {
        $item['sort_date'] = $item['due_date'];
        $item['date_payed'] = null; 
        $item['amount_paid'] = null;
        return $item;
    }, $schedule);

    // 2. Standardize payment items: map to required fields and add schedule-related null fields
    $payment_events = array_map(function($item) {
        // Use the date_payed for sorting
        $item['sort_date'] = $item['date_payed'];
        
        // Add schedule-related null fields
        $item['due_date'] = null; 
        $item['payment_amount'] = null; 
        $item['principal_paid'] = null;
        $item['interest_paid'] = null;
        $item['remaining_balance'] = null;

        // Keep 'date_payed' and 'amount_paid' (already present in $item)
        return $item;
    }, $payments);

    // 3. Combine all events
    $merged = array_merge($merged, $payment_events);

    // 4. Sort chronologically by 'sort_date'
    usort($merged, function($a, $b) {
        // Use usort with spaceship operator for chronological comparison
        return strtotime($a['sort_date']) <=> strtotime($b['sort_date']);
    });

    return $merged;
}


// --- 4. Fetch Loan and Reconstruct Details ---

// A. Fetch Original Loan Details
$sql_original = "
    SELECT
        loan_amount, interest_rate, payment_frequency, date_start, date_end
    FROM
        loan_applications
    WHERE
        loan_application_id = ?;
";
$stmt_original = $conn->prepare($sql_original);
$stmt_original->bind_param("i", $loan_id);
$stmt_original->execute();
$result_original = $stmt_original->get_result();
$original_loan = $result_original->fetch_assoc();
$stmt_original->close();

if (!$original_loan) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Loan not found.']);
    $conn->close();
    exit();
}

// B. Fetch Latest Reconstruct Details
// We need date_created for the split point
$sql_reconstruct = "
    SELECT
        reconstruct_amount, interest_rate, payment_frequency, date_start, duration, date_end, date_created
    FROM
        loan_reconstruct
    WHERE
        loan_application_id = ?
    ORDER BY
        date_created DESC
    LIMIT 1;
";
$stmt_reconstruct = $conn->prepare($sql_reconstruct);
$stmt_reconstruct->bind_param("i", $loan_id);
$stmt_reconstruct->execute();
$result_reconstruct = $stmt_reconstruct->get_result();
$reconstruct_loan = $result_reconstruct->fetch_assoc();
$stmt_reconstruct->close();


// --- 5. Generate and Merge Schedules ---

// A. Generate Original Schedule
$original_schedule = calculateAmortization(
    (float)$original_loan['loan_amount'],
    (float)$original_loan['interest_rate'] / 100,
    $original_loan['payment_frequency'],
    $original_loan['date_start'],
    $original_loan['date_end']
);

// B. Determine Split Date and Fetch Payments
$split_date = null;
$original_payments = [];
$reconstruct_payments = [];

if ($reconstruct_loan) {
    // If a reconstruction exists, use its creation date as the split point
    $split_date = $reconstruct_loan['date_created'];

    // 1. Payments for Original Schedule (BEFORE split date)
    $sql_payments_orig = "
        SELECT date_payed, amount_paid
        FROM payment
        WHERE loan_application_id = ? AND date_payed < ?
        ORDER BY date_payed ASC;
    ";
    $stmt_payments_orig = $conn->prepare($sql_payments_orig);
    $stmt_payments_orig->bind_param("is", $loan_id, $split_date);
    $stmt_payments_orig->execute();
    $result_payments_orig = $stmt_payments_orig->get_result();
    $original_payments = $result_payments_orig->fetch_all(MYSQLI_ASSOC);
    $stmt_payments_orig->close();

    // 2. Payments for Reconstruct Schedule (ON OR AFTER split date)
    $sql_payments_reco = "
        SELECT date_payed, amount_paid
        FROM payment
        WHERE loan_application_id = ? AND date_payed >= ?
        ORDER BY date_payed ASC;
    ";
    $stmt_payments_reco = $conn->prepare($sql_payments_reco);
    $stmt_payments_reco->bind_param("is", $loan_id, $split_date);
    $stmt_payments_reco->execute();
    $result_payments_reco = $stmt_payments_reco->get_result();
    $reconstruct_payments = $result_payments_reco->fetch_all(MYSQLI_ASSOC);
    $stmt_payments_reco->close();

} else {
    // If NO reconstruction, ALL payments belong to the original schedule
    $sql_payments_all = "
        SELECT date_payed, amount_paid
        FROM payment
        WHERE loan_application_id = ?
        ORDER BY date_payed ASC;
    ";
    $stmt_payments_all = $conn->prepare($sql_payments_all);
    $stmt_payments_all->bind_param("i", $loan_id);
    $stmt_payments_all->execute();
    $result_payments_all = $stmt_payments_all->get_result();
    $original_payments = $result_payments_all->fetch_all(MYSQLI_ASSOC);
    $stmt_payments_all->close();
}


// C. Merge Original Schedule with its specific Payments
$merged_original_schedule = mergeAndSortEvents($original_schedule, $original_payments);


// D. Generate and Merge Reconstruct Schedule (if exists)
$merged_reconstruct_schedule = [];
if ($reconstruct_loan) {
    $reconstruct_schedule = calculateAmortization(
        (float)$reconstruct_loan['reconstruct_amount'],
        (float)$reconstruct_loan['interest_rate'] / 100,
        $reconstruct_loan['payment_frequency'],
        $reconstruct_loan['date_start'],
        $reconstruct_loan['date_end']
    );
    
    // Merge Reconstruct Schedule with its specific Payments
    $merged_reconstruct_schedule = mergeAndSortEvents($reconstruct_schedule, $reconstruct_payments);
}

// --- 6. Return JSON Response ---
echo json_encode([
    'success' => true,
    'loan_id' => $loan_id,
    'original_schedule' => $merged_original_schedule,
    'reconstruct_schedule' => $merged_reconstruct_schedule 
]);

$conn->close();
?>