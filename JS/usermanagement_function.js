document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Prevent the default link behavior
            event.preventDefault(); 
            // Get the text from the link
            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            // Define the URL based on the link's text
            const urlMapping = {
                'dashboard': 'Dashboard.html',
                'clientcreation': 'ClientCreationForm.html',
                'pendingaccounts': 'PendingAccount.html',
                'accountsreceivable': 'AccountsReceivable.html',
                'ledger': 'Ledgers.html',
                'amortizationcalculator': 'AmortizationCalculator.html',
                'reports': 'Reports.html',
                'usermanagement': 'UserManagement.html',
                'tools': 'Tools.html'
            };

            // Navigate to the correct page
            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button separately
    logoutButton.addEventListener('click', function() {
        // You would typically handle a logout process here (e.g., clearing session data)
        window.location.href = 'login.html'; // Redirect to the login page
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the buttons by their IDs
    const passwordChangeBtn = document.getElementById('password-change-btn');
    const usernameChangeBtn = document.getElementById('username-change-btn');
    const accountCreationBtn = document.getElementById('account-creation-btn');
    const existingAccountsBtn = document.getElementById('existing-accounts-btn');

    // Add an event listener for each button
    if (passwordChangeBtn) {
        passwordChangeBtn.addEventListener('click', () => {
            window.location.href = 'AccountPasswordChange.html';
        });
    }

    if (usernameChangeBtn) {
        usernameChangeBtn.addEventListener('click', () => {
            window.location.href = 'AccountUsernameChange.html';
        });
    }

    if (accountCreationBtn) {
        accountCreationBtn.addEventListener('click', () => {
            window.location.href = 'AcountCreation.html';
        });
    }

    if (existingAccountsBtn) {
        existingAccountsBtn.addEventListener('click', () => {
            window.location.href = 'AccountsExisting.html';
        });
    }
});