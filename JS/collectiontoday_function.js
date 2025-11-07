document.addEventListener('DOMContentLoaded', function() {
    // ====================================================================
    // 1. Define Access Rules (From Block 1)
    // ====================================================================
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer']
    };

    // ====================================================================
    // 2. Global Logging Function (From Block 3)
    // This function is defined inside DOMContentLoaded but made global
    // ====================================================================
    function logUserAction(actionType, description) {
        const bodyData = new URLSearchParams();
        bodyData.append('action', actionType);
        bodyData.append('description', description);

        fetch('PHP/log_action.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyData.toString()
        })
        .then(response => {
            if (!response.ok) {
                console.warn('Audit log failed to record:', actionType, description);
            }
        })
        .catch(error => {
            console.error('Audit log fetch error:', error);
        });
    }

    // *** Make the logging function globally accessible ***
    window.logUserAction = logUserAction;

    // ====================================================================
    // 3. Navigation URL Mapping (From Block 3)
    // ====================================================================
    const urlMapping = {
        'dashboard': 'DashBoard.html',
        'clientcreation': 'ClientCreationForm.html',
        'loanapplication': 'LoanApplication.html',
        'pendingaccounts': 'PendingAccount.html',
        'paymentcollection': 'AccountsReceivable.html',
        'ledger': 'Ledgers.html',
        'reports': 'Reports.html',
        // Assuming there is a UserManagement link that might be conditionally visible
        'usermanagement': 'UserManagement.html', 
        'tools': 'Tools.html'
    };

    // ====================================================================
    // 4. Role-Based Access Control and Session Check Helpers
    // ====================================================================

    // This function is missing in the original code, we must define it.
    // It checks the session and then applies sidebar access control.
    function checkSessionAndRedirect() {
        fetch('PHP/check_session.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const userRole = (data.status === 'active' && data.role) ? data.role : 'none';
                
                // Apply sidebar visibility based on role (from Block 1)
                applySidebarAccessControl(userRole);
                
                // Now, if this page requires specific roles (like 'Reports' does), 
                // we check the role against the page-specific access rule.
                // NOTE: This assumes 'Reports' page is the one calling this script
                const pageRequiredRoles = ['Admin', 'Manager', 'Loan_Officer']; // Match the 'Reports' rule for this page
                enforceRoleAccess(userRole, pageRequiredRoles);

            })
            .catch(error => {
                console.error('Error fetching user session:', error);
                // On error, hide all links for security and log the failure
                applySidebarAccessControl('none'); 
                logUserAction('SESSION_ERROR', `Failed to fetch user session: ${error.message}`);
                // You might also redirect to a login/error page here
            });
    }

    // Function to apply access control to the sidebar (From Block 1)
    function applySidebarAccessControl(userRole) {
        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');

        navLinks.forEach(link => {
            const linkName = link.textContent.trim();
            const parentListItem = link.parentElement;

            if (accessRules.hasOwnProperty(linkName)) {
                const allowedRoles = accessRules[linkName];

                if (!allowedRoles.includes(userRole)) {
                    parentListItem.style.display = 'none';
                } else {
                    parentListItem.style.display = ''; // Ensure it's visible if allowed
                }
            } else {
                console.warn(`No access rule defined for: ${linkName}`);
                // Optional: Hide undefined links
                // parentListItem.style.display = 'none';
            }
        });
    }

    // This function is missing and was called from the second original block.
    // It is used to protect the *entire page* based on the user's role.
    function enforceRoleAccess(userRole, requiredRoles) {
        // Normalize the role check to match the case in accessRules
        const normalizedRequiredRoles = requiredRoles.map(role => role.charAt(0).toUpperCase() + role.slice(1).replace('_', ''));

        if (!normalizedRequiredRoles.includes(userRole)) {
            const actionType = 'ACCESS_DENIED';
            const description = `User with role ${userRole} attempted to access restricted page. Required roles: ${requiredRoles.join(', ')}`;
            logUserAction(actionType, description);

            alert('Access Denied. You do not have the required role to view this page.');
            // Redirect to a safe page, e.g., the Dashboard
            window.location.href = urlMapping['dashboard'] || 'login.html'; 
        }
    }


    // ====================================================================
    // 5. Initialization and Event Listeners
    // ====================================================================

    // Call the combined check/access function
    checkSessionAndRedirect();

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    // Navigation Link Click Handler (From Block 3)
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            // Handle 'active' class styling
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, '');
            const targetPage = urlMapping[linkText];

            if (targetPage) {
                const actionType = 'NAVIGATION';
                const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;
                logUserAction(actionType, description);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
                const actionType = 'NAVIGATION_FAILED';
                const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });

    // Logout Button Click Handler (From Block 3)
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Logging should happen server-side in check_logout.php
            window.location.href = 'PHP/check_logout.php';
        });
    }

    // --- Cleanup/Removal of redundant code ---
    // The following global variables from the original Block 3 are not needed on this page:
    // let pendingAccountsData = []; 
    // let currentSortColumn = 'created_at';
    // let currentSortDirection = 'asc';
});