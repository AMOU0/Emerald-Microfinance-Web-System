document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    // Ensure the keys here match the text content of your <a> tags exactly.
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer']
    };

    // 2. Fetch the current user's role
    fetch('PHP/check_session.php')
        .then(response => {
            // Check if the response is successful (HTTP 200)
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Ensure the session is active and a role is returned
            if (data.status === 'active' && data.role) {
                const userRole = data.role;
                applyAccessControl(userRole);
            } else {
                // If not logged in, you might want to hide everything or redirect
                // For now, we'll assume the 'none' role has no access, which the loop handles.
                applyAccessControl('none');
            }
        })
        .catch(error => {
            console.error('Error fetching user session:', error);
            // Optionally hide all nav links on severe error
            // document.querySelector('.sidebar-nav ul').style.display = 'none';
        });

    // 3. Apply Access Control
    function applyAccessControl(userRole) {
        // Select all navigation links within the sidebar
        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');

        navLinks.forEach(link => {
            const linkName = link.textContent.trim();
            const parentListItem = link.parentElement; // The <li> element

            // Check if the link name exists in the access rules
            if (accessRules.hasOwnProperty(linkName)) {
                const allowedRoles = accessRules[linkName];

                // Check if the current user's role is in the list of allowed roles
                if (!allowedRoles.includes(userRole)) {
                    // Hide the entire list item (<li>) if the user role is NOT authorized
                    parentListItem.style.display = 'none';
                }
            } else {
                // Optional: Hide links that are not defined in the accessRules for safety
                // parentListItem.style.display = 'none';
                console.warn(`No access rule defined for: ${linkName}`);
            }
        });
    }
});
//==============================================================================================================================================
document.addEventListener('DOMContentLoaded', function() {
    enforceRoleAccess(['admin','Manager']); 
});
/*=============================================================================*/

document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect();

    // --- Global Logging Function (Updated to accept two parameters) ---
    function logUserAction(actionType, description) {
        // Use URLSearchParams to easily format the POST body
        const bodyData = new URLSearchParams();
        bodyData.append('action', actionType); 
        bodyData.append('description', description); 

        // The DML-specific fields (target_table, target_id, etc.) are removed 
        // to conform to the new two-parameter signature.
        
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
    
    // *** Make the logging function globally accessible for use in other blocks ***
    window.logUserAction = logUserAction;
    // --------------------------------------------------------

    // --- Global Variables to hold data and sort state ---
    let pendingAccountsData = []; // Store fetched data here
    let currentSortColumn = 'created_at'; // Default sort
    let currentSortDirection = 'asc'; // Default direction

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

            // Normalize the link text for mapping lookup
            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            const targetPage = urlMapping[linkText];
            
            if (targetPage) {
                const actionType = 'NAVIGATION';
                const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

                // 2. UPDATED AUDIT LOG CALL
                logUserAction(actionType, description);

                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
                
                // UPDATED FAILED NAVIGATION LOG CALL
                const actionType = 'NAVIGATION_FAILED';
                const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
        // The PHP script 'PHP/check_logout.php' should handle the log *before* session destruction.
            window.location.href = 'PHP/check_logout.php'; 
        });
    }

/*=============================================================================================================================================================================*/

    // --- Sort Function ---
    const sortData = (data, column, direction) => {
        return data.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (column === 'name') {
                valA = `${a.last_name}, ${a.first_name}`;
                valB = `${b.last_name}, ${b.first_name}`;
            }

            if (column === 'loan_amount' || column === 'client_ID') {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }

            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }

            return direction === 'desc' ? comparison * -1 : comparison;
        });
    };

    // --- Render Function ---
    const renderTable = (data) => {
        const tableBody = document.querySelector('.pending-account-table-body');
        tableBody.innerHTML = '';
        const dataToRender = data.length > 0 ? data : pendingAccountsData;

        if (dataToRender.length > 0) {
            const sortedData = sortData([...dataToRender], currentSortColumn, currentSortDirection);

            sortedData.forEach(client => {
                const row = document.createElement('div');
                row.classList.add('table-row');

                // Checkbox state persistence: Look for the existing checkbox's state before recreating
                const existingCheckbox = document.getElementById(`select-${client.loan_application_id}`);
                const isSelected = existingCheckbox ? existingCheckbox.checked : false;
                if (isSelected) {
                    row.classList.add('selected');
                }

                row.innerHTML = `
                    <div class="table-cell small-column">
                        <input type="checkbox"
                                    id="select-${client.loan_application_id}"
                                    name="selected"
                                    value="${client.loan_application_id}"
                                    data-client-id="${client.client_ID}"
                                    ${isSelected ? 'checked' : ''}>
                    </div>
                    <div class="table-cell">${client.client_ID}</div>
                    <div class="table-cell">${client.last_name}, ${client.first_name}</div>
                    <div class="table-cell">PHP ${parseFloat(client.loan_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div class="table-cell">${client.created_at}</div>
                `;
                tableBody.appendChild(row);

                // --- MODIFIED LOGIC FOR SINGLE SELECTION ---

                // Add event listener to the row for selection (Row Click)
                row.addEventListener('click', (event) => {
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    // If the click is on the row but not the checkbox itself, toggle the checkbox.
                    if (event.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        // Manually trigger the change event to ensure the single-select logic runs immediately.
                        checkbox.dispatchEvent(new Event('change'));
                    }
                    // If the click IS on the checkbox, the native 'change' event will handle it.
                });

                // Add change listener to the checkbox (Checkbox Change)
                row.querySelector('input[type="checkbox"]').addEventListener('change', function() {
                    // This function is the single point of truth for enforcing single selection.
                    
                    if (this.checked) {
                        // 1. If this checkbox is checked, deselect ALL others.
                        document.querySelectorAll('input[name="selected"]:checked').forEach(otherCheckbox => {
                            if (otherCheckbox !== this) {
                                otherCheckbox.checked = false;
                                // Find the parent row for the other checkbox and remove the class
                                const otherRow = otherCheckbox.closest('.table-row');
                                if (otherRow) {
                                    otherRow.classList.remove('selected');
                                }
                            }
                        });
                        
                        // 2. Apply 'selected' class to the current row.
                        row.classList.add('selected');
                    } else {
                        // 3. If this checkbox is unchecked, remove the 'selected' class.
                        row.classList.remove('selected');
                    }
                });

                // --- END MODIFIED LOGIC ---
            });
        } else {
            const emptyRow = document.createElement('div');
            emptyRow.classList.add('table-row');
            emptyRow.innerHTML = `<div class="table-cell" style="text-align: center; grid-column: 1 / -1;">No pending clients found.</div>`;
            tableBody.appendChild(emptyRow);
        }

        // Update the visual sort indicators
        document.querySelectorAll('.table-header-cell.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
            if (header.getAttribute('data-sort') === currentSortColumn) {
                header.classList.add(currentSortDirection);
            }
        });
    };

    // --- Fetch Function ---
    const fetchPendingAccounts = () => {
        fetch('PHP/pendingaccount_handler.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                pendingAccountsData = data; 
                if (data.length > 0) {
                     currentSortColumn = 'created_at';
                     currentSortDirection = 'asc'; 
                }
                renderTable(pendingAccountsData); 
                attachSortListeners(); 
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Failed to load pending accounts. Please try again later.');
            });
    };

    // --- Attach Sort Listeners Function ---
    const attachSortListeners = () => {
        document.querySelectorAll('.table-header-cell.sortable').forEach(header => {
            header.removeEventListener('click', handleSortClick); 
            header.addEventListener('click', handleSortClick);
        });
    };
    
    // --- Sort Click Handler ---
    const handleSortClick = function() {
        const column = this.getAttribute('data-sort');
        let direction = 'asc';

        if (currentSortColumn === column) {
            direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
        }

        currentSortColumn = column;
        currentSortDirection = direction;

        renderTable(pendingAccountsData);
    };

    fetchPendingAccounts();

    // Function to update loan status on the server 
    // This function can still accept an array of IDs, but due to the new UI logic, 
    // the array will only contain 0 or 1 ID.
    const updateLoanStatus = (loanApplicationIds, status) => {
        if (loanApplicationIds.length === 0) {
            alert('No loan applications selected.');
            return;
        }

        const idList = loanApplicationIds.join(',');

        const actionType = 'BATCH_UPDATE'; // Still using batch name, but operation is single-item
        const description = `Loan Application Status changed to '${status.toUpperCase()}' for ID: ${idList}`;

        fetch('PHP/pendingaccountupdateloanstatus_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `loan_application_id=${idList}&status=${status}` 
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                
                // UPDATED SUCCESS LOG CALL
                logUserAction(actionType, description);

                fetchPendingAccounts(); 
            } else {
                alert(data.message);
                
                // UPDATED FAILED LOG CALL
                logUserAction('UPDATE_FAILED', `FAILED: ${description}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update loan status.');
            
            // UPDATED ERROR LOG CALL
            logUserAction('UPDATE_ERROR', `FETCH ERROR: ${description} - ${error.message}`);
        });
    };

    // Helper function to get all selected loan IDs (now will return at most one)
    const getSelectedLoanIds = () => {
        const selectedCheckboxes = document.querySelectorAll('input[name="selected"]:checked');
        return Array.from(selectedCheckboxes).map(cb => cb.value);
    };

    // Event listener for the "Approved" button
    document.querySelector('.approved-button').addEventListener('click', () => {
        const selectedLoanIds = getSelectedLoanIds();
        if (selectedLoanIds.length > 0) {
            updateLoanStatus(selectedLoanIds, 'approved');
        } else {
            alert('Please select one loan application to approve.');
        }
    });

    // Event listener for the "Denied" button
    document.querySelector('.denied-button').addEventListener('click', () => {
        const selectedLoanIds = getSelectedLoanIds();
        if (selectedLoanIds.length > 0) {
            updateLoanStatus(selectedLoanIds, 'denied');
        } else {
            alert('Please select one loan application to deny.');
        }
    });

    // Event listener for the "View" button
    // This part of the code already implicitly handled the first selected item,
    // and is now guaranteed to only have one selected item.
    document.querySelector('.view-button-pending').addEventListener('click', () => {
        const selectedCheckboxes = document.querySelectorAll('input[name="selected"]:checked');

        if (selectedCheckboxes.length > 0) {
            const selectedCheckbox = selectedCheckboxes[0];
            const clientId = selectedCheckbox.getAttribute('data-client-id');

            // UPDATED VIEW LOG CALL
            logUserAction('VIEW', `Viewed Client Profile for Client ID: ${clientId}`);

            window.location.href = `PendingAccountView.html?id=${clientId}`;
        } else {
            alert('Please select a client first to view their details.');
        }
    });
});