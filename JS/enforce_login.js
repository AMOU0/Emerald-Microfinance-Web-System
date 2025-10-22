function enforceRoleAccess(requiredRole) {
    // Determine the required roles, which can be a single string or an array.
    const allowedRoles = Array.isArray(requiredRole) 
        ? requiredRole.map(r => r.toLowerCase()) 
        : [requiredRole.toLowerCase()];

    // We use a fetch request to query a small PHP script on the server.
    fetch('PHP/check_session.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // 1. Check for inactive session (standard login enforcement)
            if (data.status === 'inactive') {
                window.location.href = 'login.html';
                return;
            }

            const userRole = data.role ? data.role.toLowerCase() : 'guest';

            // 2. Check for Role Mismatch
            if (!allowedRoles.includes(userRole)) {
                console.warn(`Access Denied. User role '${userRole}' is not in allowed roles: ${allowedRoles.join(', ')}.`);
                window.location.href = '404.html'; 
            }
        })
        .catch(error => {
            console.error('Error enforcing session/role:', error);
            // In case of an error, it's safer to redirect to prevent unauthorized access.
            window.location.href = 'login.html';
        });
}
function checkSessionAndRedirect() {
    // We use a fetch request to query a small PHP script on the server.
    fetch('PHP/check_session.php')
        .then(response => response.json())
        .then(data => {
            // If the PHP script returns 'inactive', redirect the user.
            if (data.status === 'inactive') {
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Error checking session:', error);
            // In case of an error, it's safer to redirect to prevent unauthorized access.
            window.location.href = 'login.html';
        });
}