document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect();

    // --- Global Logging Function (UPDATED to accept a single log object) ---
    // This new function structure makes it easier to pass detailed DML logs.
    function logUserAction(logDetails) {
        // logDetails is expected to be an object: 
        // { 
        //   actionType: 'NAVIGATION' | 'UPDATE' | 'OTHER', 
        //   description: '...' 
        //   targetTable: '...' (Optional)
        //   targetId: '...' (Optional)
        //   beforeState: '...' (Optional)
        //   afterState: '...' (Optional)
        // }

        // Use URLSearchParams to easily format the POST body
        const bodyData = new URLSearchParams();
        bodyData.append('action', logDetails.actionType || 'UNKNOWN'); 
        bodyData.append('description', logDetails.description || 'No description provided'); 

        // Append optional DML details if available, otherwise append an empty string
        bodyData.append('target_table', logDetails.targetTable || '');
        bodyData.append('target_id', logDetails.targetId || '');
        bodyData.append('before_state', logDetails.beforeState || '');
        bodyData.append('after_state', logDetails.afterState || '');
        
        // Note: The PHP script (PHP/log_action.php) must be updated 
        // to handle all these new parameters: action, description, target_table, 
        // target_id, before_state, after_state.

        fetch('PHP/log_action.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyData.toString()
        })
        .then(response => {
            if (!response.ok) {
                console.warn('Audit log failed to record:', logDetails.actionType, logDetails.description);
            }
        })
        .catch(error => {
            console.error('Audit log fetch error:', error);
        });
    }
    // --------------------------------------------------------

    // ... (rest of the code remains here: navLinks, urlMapping, navLinks.forEach, logoutButton) ...

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

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

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            const targetPage = urlMapping[linkText];

            if (targetPage) {
                const actionType = 'NAVIGATION';
                const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;
                
                // Use the new logUserAction format for navigation
                logUserAction({ actionType, description }); 

                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
                const actionType = 'NAVIGATION_FAILED'; // Changed type for clarity
                const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
                logUserAction({ actionType, description });
            }
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.location.href = 'PHP/check_logout.php'; 
        });
    }

/*=============================================================================================================================================================================*/
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
                        <div class="table-cell">PHP ${parseFloat(client.loan_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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

    // Function to update loan status on the server (MODIFIED FOR DETAILED DML LOGGING)
    const updateLoanStatus = (loanApplicationId, status) => {
        // Prepare log details before the fetch, assuming the current state is 'pending'
        const actionType = 'UPDATE';
        const description = `Loan Application Status changed to '${status.toUpperCase()}'`;
        const targetTable = 'loan_applications';
        const targetId = loanApplicationId;
        const beforeState = 'status: pending'; // Assumption based on context
        const afterState = `status: ${status}`;

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

                // --- AUDIT LOGGING FOR DML ACTION (Using the new single-object parameter) ---
                logUserAction({
                    actionType: actionType,
                    description: description,
                    targetTable: targetTable,
                    targetId: targetId,
                    beforeState: beforeState,
                    afterState: afterState
                });
                // ------------------------------------

                fetchPendingAccounts();
            } else {
                alert(data.message);
                
                // OPTIONAL: Log the failed attempt
                logUserAction({
                    actionType: 'UPDATE_FAILED',
                    description: `FAILED: ${description}`,
                    targetTable: targetTable,
                    targetId: targetId,
                    beforeState: beforeState,
                    afterState: afterState // Still log the intended after state
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update loan status.');

            // OPTIONAL: Log the fetch error
            logUserAction({
                actionType: 'UPDATE_ERROR',
                description: `FETCH ERROR: ${description} - ${error.message}`,
                targetTable: targetTable,
                targetId: targetId,
                beforeState: beforeState,
                afterState: afterState
            });
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
            const clientId = selectedRadio.getAttribute('data-client-id');

            // Log the view action using the simplified log structure for non-DML
            logUserAction({
                actionType: 'VIEW',
                description: `Viewed Client Profile for Client ID: ${clientId}`,
                targetTable: 'clients', 
                targetId: clientId 
                // No before/after state needed for a VIEW
            });

            window.location.href = `PendingAccountView.html?id=${clientId}`;
        } else {
            alert('Please select a client first.');
        }
    });
});