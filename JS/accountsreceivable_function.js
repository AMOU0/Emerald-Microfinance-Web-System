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
// Function to fetch and display approved accounts
const fetchApprovedAccounts = () => {
    // Corrected fetch URL to use forward slashes
    fetch('PHP/accountsreceivable_handler.php')
        .then(response => {
            if (!response.ok) {
                // If the server response was not okay, throw an error
                throw new Error('Network response was not ok');
            }
            // Parse the JSON data from the response
            return response.json();
        })
        .then(data => {
            // Select the table body element to populate
            const tableBody = document.querySelector('.approved-account-table-body');
            // Clear any existing content in the table body
            tableBody.innerHTML = '';

            if (data.length > 0) {
                // If data is available, iterate through each client
                data.forEach(client => {
                    // Helper function to format currency
                    const formatCurrency = (amount) => {
                        return parseFloat(amount).toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        });
                    };

                    // Create a new table row element
                    const row = document.createElement('div');
                    row.classList.add('table-row');
                    // Populate the row with data from the client object
                    row.innerHTML = `
                        <div class="table-cell small-column">
                            <input type="radio"
                                id="select-${client.loan_application_id}"
                                name="selected"
                                value="${client.loan_application_id}"
                                data-client-id="${client.client_ID}">
                        </div>
                        <div class="table-cell">${client.client_ID}</div>
                        <div class="table-cell">${client.loan_application_id}</div>
                        <div class="table-cell">${client.last_name}, ${client.first_name}</div>
                        
                        <div class="table-cell">PHP ${formatCurrency(client.principal_amount)}</div> 
                        <div class="table-cell">PHP ${formatCurrency(client.interest_amount)}</div>
                        <div class="table-cell">PHP ${formatCurrency(client.total_loan_amount)}</div> 
                        
                        <div class="table-cell">${client.created_at}</div>
                    `;
                    // Append the new row to the table body
                    tableBody.appendChild(row);
                });
            } else {
                // If no data is returned, display a message
                const emptyRow = document.createElement('div');
                emptyRow.classList.add('table-row');
                emptyRow.innerHTML = `<div class="table-cell" style="text-align: center; grid-column: 1 / span 8;">No approved accounts found.</div>`; // Adjusted colspan to match 8 columns
                tableBody.appendChild(emptyRow);
            }
        })
        .catch(error => {
            // Log any errors that occur during the fetch operation
            console.error('Error fetching data:', error);
            // Alert the user about the failure
            alert('Failed to load approved accounts. Please try again later.');
        });
};
/*================================= */
// Add an event listener to the "SELECT" button
document.addEventListener('DOMContentLoaded', () => {
    const selectButton = document.querySelector('.select-button');
    selectButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');

        if (selectedRadio) {
            const clientID = selectedRadio.getAttribute('data-client-id');
            const loanID = selectedRadio.value;
            window.location.href = `AccountsReceivableSelect.html?clientID=${clientID}&loanID=${loanID}`;
        } else {
            alert('Please select an account first.');
        }
    });

    // Initial fetch of approved accounts
    fetchApprovedAccounts();
});