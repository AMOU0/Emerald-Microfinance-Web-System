document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Prevent the default link behavior
            event.preventDefault(); 
            // Remove 'active' class from all links
            navLinks.forEach(nav => nav.classList.remove('active'));
            // Add 'active' class to the clicked link
            this.classList.add('active');

            // Get the text from the link
            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            // Define the URL based on the link's text
            const urlMapping = {
                'dashboard': 'Dashboard.html',
                'clientcreation': 'ClientCreationForm.html',
                'loanapplication': 'LoanApplication.html',
                'pendingaccounts': 'PendingAccount.html',
                'accountsreceivable': 'AccountsReceivable.html',
                'ledger': 'Ledgers.html',
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
const fetchPendingAccounts = () => {
    fetch('PHP/userexisting_handler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector('.pending-account-table-body');
            tableBody.innerHTML = '';

            if (data.length > 0) {
                data.forEach(user => {
                    const row = document.createElement('div');
                    row.classList.add('table-row');
                    row.innerHTML = `
                        <div class="table-cell small-column">
                            <input type="radio" 
                                   id="select-${user.id}" 
                                   name="selected" 
                                   value="${user.id}">
                        </div>
                        <div class="table-cell">${user.id}</div>
                        <div class="table-cell">${user.name}</div>
                        <div class="table-cell">${user.username}</div>
                        <div class="table-cell">${user.role}</div>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                const emptyRow = document.createElement('div');
                emptyRow.classList.add('table-row');
                emptyRow.innerHTML = `<div class="table-cell" style="text-align: center;">No pending accounts found.</div>`;
                tableBody.appendChild(emptyRow);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Failed to load pending accounts. Please try again later.');
        });
};
fetchPendingAccounts();

// This part of the JS is based on a different context (loan approvals)
// and doesn't match the new HTML table for user accounts. 
// It is recommended to create new functionality to match the "View" button
// or other actions you want to perform on user accounts.
// For now, the 'View' button functionality is commented out or needs a new purpose.
// For a user account table, you might want "Activate," "Deactivate," or "Edit" buttons
// rather than "Approve" or "Deny" which were for loan applications.
/*
// Corrected event listener for the "View" button
document.querySelector('.view-button-pending').addEventListener('click', () => {
    const selectedRadio = document.querySelector('input[name="selected"]:checked');
    if (selectedRadio) {
        // Here you would navigate to a user profile view page
        const userId = selectedRadio.value;
        window.location.href = `UserAccountView.html?id=${userId}`; // Example URL
    } else {
        alert('Please select a user account first.');
    }
});
*/