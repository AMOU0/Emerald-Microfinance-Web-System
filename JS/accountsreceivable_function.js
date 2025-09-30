/*=============================================================================================================================================================================*/
let allAccounts = []; // Stores the full list of accounts

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
            allAccounts = data; // Store the fetched data
            filterAndDisplayAccounts(); // Display all accounts initially
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Failed to load approved accounts. Please try again later.');
        });
};

// Function to filter and display accounts based on search input
const filterAndDisplayAccounts = () => {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const tableBody = document.querySelector('.approved-account-table-body');
    tableBody.innerHTML = '';

    const filteredAccounts = allAccounts.filter(client => {
        // Concatenate relevant fields for comprehensive search
        const searchString = `${client.client_ID} ${client.loan_application_id} ${client.last_name} ${client.first_name}`.toLowerCase();
        return searchString.includes(searchTerm);
    });

    if (filteredAccounts.length > 0) {
        filteredAccounts.forEach(client => {
            const formatCurrency = (amount) => {
                return parseFloat(amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            };

            const row = document.createElement('div');
            row.classList.add('table-row');

            if (client.is_overdue) {
                row.classList.add('overdue-loan');
            }

            const loanEndDate = new Date(client.date_end);
            const formattedDate = loanEndDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Conditionally add the data-reconstruct-id attribute
            const reconstructDataAttribute = client.reconstruct_id ? `data-reconstruct-id="${client.reconstruct_id}"` : '';

            row.innerHTML = `
                <div class="table-cell small-column">
                    <input type="radio"
                        id="select-${client.loan_application_id}"
                        name="selected"
                        value="${client.loan_application_id}"
                        data-client-id="${client.client_ID}"
                        ${reconstructDataAttribute}>
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
};
/*=============================================================================================================================================================================*/
// Main event listener to run on page load
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

            const targetPage = urlMapping[linkText];
            if (targetPage) {
                // 1. Define the action for the audit log
                const actionDescription = `Maps to ${this.textContent} (${targetPage})`;

                // 2. ASYNCHRONOUS AUDIT LOG: Call PHP to log the action. 
                //    This will not block the page from redirecting.
                fetch('PHP/log_action.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=${encodeURIComponent(actionDescription)}`
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Audit log failed to record for navigation:', actionDescription);
                    }
                })
                .catch(error => {
                    console.error('Audit log fetch error:', error);
                })
                // 3. Perform the page redirect immediately
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button securely
    // NOTE: The PHP script 'PHP/check_logout.php' will now handle the log *before* session destruction.
    logoutButton.addEventListener('click', function() {
        window.location.href = 'PHP/check_logout.php'; 
    });
});
/*================================= */
// Add an event listener to the "SELECT" button
document.addEventListener('DOMContentLoaded', () => {
    const selectButton = document.querySelector('.select-button');
    selectButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');

        if (selectedRadio) {
            const clientID = selectedRadio.getAttribute('data-client-id');
            const loanID = selectedRadio.value;
            const reconstructID = selectedRadio.getAttribute('data-reconstruct-id'); // Get the reconstruct ID

            let url = `AccountsReceivableSelect.html?clientID=${clientID}&loanID=${loanID}`;
            if (reconstructID) {
                url += `&reconstructID=${reconstructID}`; // Append reconstruct ID if it exists
            }
            
            window.location.href = url;
        } else {
            alert('Please select an account first.');
        }
    });

    // Add an event listener to the search input for real-time filtering
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterAndDisplayAccounts);
    }

    // Initial fetch of approved accounts
    fetchApprovedAccounts();
});
/*================================= */
// Add an event listener to the "reconstruct" button
document.addEventListener('DOMContentLoaded', () => {
    const reconstructButton = document.querySelector('.reconstruct-button');
    reconstructButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');

        if (selectedRadio) {
            const clientID = selectedRadio.getAttribute('data-client-id');
            const loanID = selectedRadio.value;
            const reconstructID = selectedRadio.getAttribute('data-reconstruct-id');

            let url = `AccountsReceivableReconstruct.html?clientID=${clientID}&loanID=${loanID}`;
            if (reconstructID) {
                url += `&reconstructID=${reconstructID}`;
            }

            window.location.href = url;
        } else {
            alert('Please select an account first.');
        }
    });
});