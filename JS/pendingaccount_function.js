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

/*================================= */
document.addEventListener("DOMContentLoaded", () => {
    // Function to fetch and display pending accounts
    const fetchPendingAccounts = () => {
        fetch('PHP/pendingaccount_handler.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const tableBody = document.querySelector('.pending-account-table-body');
                tableBody.innerHTML = ''; // Clear existing rows

                if (data.length > 0) {
                    data.forEach(client => {
                        const row = document.createElement('div');
                        row.classList.add('table-row');
                        row.innerHTML = `
                            <div class="table-cell small-column">
                                <input type="radio" id="select-${client.client_ID}" name="selected" value="${client.client_ID}">
                            </div>
                            <div class="table-cell">${client.last_name}, ${client.first_name}</div>
                            <div class="table-cell">${client.created_at}</div>
                        `;
                        tableBody.appendChild(row);
                    });
                } else {
                    const emptyRow = document.createElement('div');
                    emptyRow.classList.add('table-row');
                    emptyRow.innerHTML = `<div class="table-cell" style="text-align: center;">No pending clients found.</div>`;
                    tableBody.appendChild(emptyRow);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Failed to load pending accounts. Please try again later.');
            });
    };

    // Call the function to load data when the page loads
    fetchPendingAccounts();

    // Event listeners for the action buttons
    document.querySelector('.view-button-pending').addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');
        if (selectedRadio) {
            const clientId = selectedRadio.value;
            window.location.href = `PendingAccountView.html?id=${clientId}`;
        } else {
            alert('Please select a client first.');
        }
    });

    document.querySelector('.approved-button').addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');
        if (selectedRadio) {
            const clientId = selectedRadio.value;
            // Add AJAX call here to update the client's status in the database
            alert(`Client ID ${clientId} has been approved.`);
            // After successful update, re-fetch the data to refresh the table
            fetchPendingAccounts();
        } else {
            alert('Please select a client to approve.');
        }
    });

    document.querySelector('.denied-button').addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');
        if (selectedRadio) {
            const clientId = selectedRadio.value;
            // Add AJAX call here to update the client's status in the database
            alert(`Client ID ${clientId} has been denied.`);
            // After successful update, re-fetch the data to refresh the table
            fetchPendingAccounts();
        } else {
            alert('Please select a client to deny.');
        }
    });
});