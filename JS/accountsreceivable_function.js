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
// Function to fetch and display approved accounts
const fetchApprovedAccounts = () => {
    fetch('PHP/accountsreceivable_handler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector('.approved-account-table-body');
            tableBody.innerHTML = '';

            if (data.length > 0) {
                data.forEach(client => {
                    const formatCurrency = (amount) => {
                        return parseFloat(amount).toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        });
                    };

                    const row = document.createElement('div');
                    row.classList.add('table-row');
                    
                    // Add a class for overdue loans to change the row color to red
                    if (client.is_overdue) {
                        row.classList.add('overdue-loan');
                    }

                    // Get the loan end date from the PHP response
                    const loanEndDate = new Date(client.date_end);
                    const formattedDate = loanEndDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
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
                        
                        <div class="table-cell">${formattedDate}</div>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                const emptyRow = document.createElement('div');
                emptyRow.classList.add('table-row');
                emptyRow.innerHTML = `<div class="table-cell" style="text-align: center; grid-column: 1 / span 8;">No approved accounts found.</div>`;
                tableBody.appendChild(emptyRow);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
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
/*================================= */
// Add an event listener to the "SELECT" button
document.addEventListener('DOMContentLoaded', () => {
    const selectButton = document.querySelector('.reconstruct-button');
    selectButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');

        if (selectedRadio) {
            const clientID = selectedRadio.getAttribute('data-client-id');
            const loanID = selectedRadio.value;
            window.location.href = `AccountsReceivableReconstruct.html?clientID=${clientID}&loanID=${loanID}`;
        } else {
            alert('Please select an account first.');
        }
    });

    // Initial fetch of approved accounts
    fetchApprovedAccounts();
});