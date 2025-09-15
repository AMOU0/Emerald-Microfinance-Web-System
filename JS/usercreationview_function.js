document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            
            // NOTE: Keep links pointing to .php if you want server-side security, 
            // otherwise keep them as .html.
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

            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button securely
    logoutButton.addEventListener('click', function() {
        // Redirect to the PHP script that handles session destruction
        window.location.href = 'PHP/check_logout.php'; 
    });
});
/*=============================================================================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the buttons by their IDs
    const passwordChangeBtn = document.getElementById('password-change-btn');
    const usernameChangeBtn = document.getElementById('username-change-btn');
    const accountCreationBtn = document.getElementById('account-creation-btn');
    const existingAccountsBtn = document.getElementById('existing-accounts-btn');

    // Add an event listener for each button
    if (passwordChangeBtn) {
        passwordChangeBtn.addEventListener('click', () => {
            window.location.href = 'UserPasswordChange.html';
        });
    }

    if (usernameChangeBtn) {
        usernameChangeBtn.addEventListener('click', () => {
            window.location.href = 'UserUsernameChange.html';
        });
    }

    if (accountCreationBtn) {
        accountCreationBtn.addEventListener('click', () => {
            window.location.href = 'UserCreation.html';
        });
    }

    if (existingAccountsBtn) {
        existingAccountsBtn.addEventListener('click', () => {
            window.location.href = 'UserExisting.html';
        });
    }
});
/*================================= */