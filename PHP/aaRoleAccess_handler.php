<?php
/**
 * Role-Based Access Control Utility
 */

// Start the session if it hasn't been already.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Checks if the user's role grants access to the current page.
 * If access is denied, it redirects the user to an access-denied page and stops execution.
 *
 * @param array $allowedRoles An array of roles (e.g., ['Admin', 'Cashier']).
 * @return void
 */
function enforceRoleAccess(array $allowedRoles): void {
    // 1. Get the user's role from the session.
    // Ensure you use the session key where you store the role during login.
    $userRole = $_SESSION['user_role'] ?? null;

    // 2. Check if the user has a role and if that role is in the allowed list.
    if ($userRole && in_array($userRole, $allowedRoles, true)) {
        // Access granted, do nothing and let the script continue.
        return;
    }

    // 3. Access Denied: Redirect and stop execution.
    // Check if headers have been sent to avoid errors.
    if (!headers_sent()) {
        // You should have a custom page for denied access.
        header('404.html');
    } else {
        // Fallback message if redirect fails
        echo "<h1>Access Denied</h1><p>Your role is not authorized to view this page.</p>";
    }
    exit; // CRITICAL: Stop the script from loading the restricted content.
}

?>