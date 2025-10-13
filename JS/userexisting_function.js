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