document.addEventListener('DOMContentLoaded', function() {
    // NOTE: This function must be defined in your HTML or another included script.
    if (typeof checkSessionAndRedirect === 'function') {
        checkSessionAndRedirect(); 
    }

    // =========================================================
    // --- Global Logging Function ---
    // =========================================================
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
    // =========================================================

    // --- Element Selections ---
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    // REMOVED: toolsMenuButtons selection
    const userManagementButtons = document.querySelectorAll('.user-management-menu-button');


    // --- URL Mappings ---
    const urlMapping = {
        'dashboard': 'DashBoard.html',
        'clientcreation': 'ClientCreationForm.html',
        'loanapplication': 'LoanApplication.html',
        'pendingaccounts': 'PendingAccount.html',
        'paymentcollection': 'AccountsReceivable.html',
        'ledger': 'Ledgers.html',
        'reports': 'Reports.html',
        'usermanagement': 'UserManagement.html',
        'tools': 'Tools.html'
    };
        
    const userManagementUrlMapping = {
        'passwordchange': 'UserPasswordChange.html',
        'usernamechange': 'UserUsernameChange.html',
        'accountcreation': 'UserCreation.html',
        'existingaccounts': 'UserExisting.html'
    };

    // =========================================================
    // --- 1. Primary Navigation (Sidebar/Header Links) Handler ---
    // =========================================================
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Normalize the link text for mapping lookup (basic: lowercase, remove spaces)
            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            const targetPage = urlMapping[linkText];
                
            if (targetPage) {
                const actionType = 'NAVIGATION';
                const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

                logUserAction(actionType, description);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
                
                const actionType = 'NAVIGATION';
                const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });


    // =========================================================
    // --- 2. User Management Menu Button Handler ---
    // =========================================================
    userManagementButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();

            // Normalize the button text (lowercase, no spaces)
            const buttonTextKey = this.textContent.toLowerCase().replace(/\s/g, '');
            const targetPage = userManagementUrlMapping[buttonTextKey];

            if (targetPage) {
                const actionType = 'NAVIGATION'; 
                const description = `${this.textContent} button clicked, redirecting to ${targetPage}`;

                logUserAction(actionType, description);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this User Management button:', this.textContent, 'Key:', buttonTextKey);
                
                const actionType = 'NAVIGATION';
                const description = `FAILED: Clicked User Management button "${this.textContent}" with no mapped page. (Key: ${buttonTextKey})`;
                logUserAction(actionType, description);
            }
        });
    });


    // =========================================================
    // --- 3. Logout Button Handler ---
    // =========================================================
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Logging occurs server-side in PHP/check_logout.php
            window.location.href = 'PHP/check_logout.php'; 
        });
    }
});
/*================================= */