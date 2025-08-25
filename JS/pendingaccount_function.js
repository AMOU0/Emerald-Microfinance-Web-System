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
// Corrected fetchPendingAccounts function
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
            tableBody.innerHTML = ''; 

            if (data.length > 0) {
                data.forEach(client => {
                    const row = document.createElement('div');
                    row.classList.add('table-row');
                    row.innerHTML = `
                        <div class="table-cell small-column">
                            <input type="radio" 
                                   id="select-${client.loan_application_id}" 
                                   name="selected" 
                                   value="${client.loan_application_id}"
                                   data-client-id="${client.client_ID}">
                        </div>
                        <div class="table-cell">${client.client_ID}</div>
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
   fetchPendingAccounts();
    // Function to update loan status on the server
    const updateLoanStatus = (loanApplicationId, status) => {
        fetch('PHP/updateloanstatus_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `loan_application_id=${loanApplicationId}&status=${status}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                fetchPendingAccounts();
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update loan status.');
        });
    };

    // Event listener for the "Approved" button
    document.querySelector('.approved-button').addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');
        if (selectedRadio) {
            const loanApplicationId = selectedRadio.value;
            updateLoanStatus(loanApplicationId, 'approved');
        } else {
            alert('Please select a loan application to approve.');
        }
    });

    // Event listener for the "Denied" button
    document.querySelector('.denied-button').addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');
        if (selectedRadio) {
            const loanApplicationId = selectedRadio.value;
            updateLoanStatus(loanApplicationId, 'denied');
        } else {
            alert('Please select a loan application to deny.');
        }
    });
    
// Corrected event listener for the "View" button
document.querySelector('.view-button-pending').addEventListener('click', () => {
    const selectedRadio = document.querySelector('input[name="selected"]:checked');
    if (selectedRadio) {
        // Get the client ID from the new data attribute
        const clientId = selectedRadio.getAttribute('data-client-id');
        window.location.href = `PendingAccountView.html?id=${clientId}`;
    } else {
        alert('Please select a client first.');
    }

});