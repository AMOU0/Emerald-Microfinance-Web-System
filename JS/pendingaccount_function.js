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
    const tableBody = document.querySelector('.pending-account-table-body');
    const viewButton = document.querySelector('.view-button-pending');
    const approvedButton = document.querySelector('.approved-button');
    const deniedButton = document.querySelector('.denied-button');

    // Function to fetch and display pending accounts
    const fetchPendingAccounts = async () => {
        try {
            const response = await fetch('PHP/pendingaccount_handler.php');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            // Clear existing rows
            tableBody.innerHTML = ''; 

            if (data.length === 0) {
                // Display a message if no pending accounts are found
                tableBody.innerHTML = '<div class="table-row no-data"><div class="table-cell" colspan="3">No pending accounts found.</div></div>';
                return;
            }

            // Iterate over the data and create new table rows
            data.forEach(account => {
                const row = document.createElement('div');
                row.classList.add('table-row');
                row.setAttribute('data-client-id', account.id);

                // Add a radio button for selection
                row.innerHTML = `
                    <div class="table-cell small-column">
                        <input type="radio" name="pending_account_select" value="${account.id}">
                    </div>
                    <div class="table-cell">${account.name}</div>
                    <div class="table-cell">${account.date_created}</div>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('There was a problem fetching the accounts:', error);
            tableBody.innerHTML = '<div class="table-row error-row"><div class="table-cell" colspan="3">Failed to load data. Please try again.</div></div>';
        }
    };

    // Load accounts on page load
    fetchPendingAccounts();

    // Event listeners for action buttons
    approvedButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="pending_account_select"]:checked');
        if (selectedRadio) {
            const clientId = selectedRadio.value;
            alert(`Account with ID ${clientId} has been approved.`);
            // Implement AJAX call to a PHP script to update the status in the database
            // and then call fetchPendingAccounts() to refresh the list.
        } else {
            alert('Please select an account to approve.');
        }
    });

    deniedButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="pending_account_select"]:checked');
        if (selectedRadio) {
            const clientId = selectedRadio.value;
            alert(`Account with ID ${clientId} has been denied.`);
            // Implement AJAX call to a PHP script to update the status in the database
            // and then call fetchPendingAccounts() to refresh the list.
        } else {
            alert('Please select an account to deny.');
        }
    });
    
    // The "View" button's logic would be similar, opening a modal or new page.
    viewButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="pending_account_select"]:checked');
        if (selectedRadio) {
            const clientId = selectedRadio.value;
            alert(`Viewing details for account ID: ${clientId}`);
            // You can fetch and display the detailed information for this client ID
        } else {
            alert('Please select an account to view.');
        }
    });
});