document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    // Ensure the keys here match the text content of your <a> tags exactly.
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'For Release': ['Admin', 'Manager', 'Loan_Officer'],
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
    // This is the session enforcement block, assume it's external (e.g., in enforce_login.js)
    enforceRoleAccess(['admin','Manager']); 
    
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 
    
    // --- GLOBAL VARIABLE to hold the fetched data for sorting ---
    let accountsData = [];
    // --- Track the current sort state ---
    let currentSort = { key: 'created_at', direction: 'desc' }; 


    // --- Global Logging Function (MODIFIED to accept four parameters: actionType, description, targetTable, targetId) ---
    // This is the core logging function used for application logic (select/restructure/sort).
    function logUserAction(actionType, description, targetTable = null, targetId = null) {
      const bodyData = new URLSearchParams();
      bodyData.append('action', actionType); 
      bodyData.append('description', description); 
      
      if (targetTable) bodyData.append('target_table', targetTable);
      if (targetId) bodyData.append('target_id', targetId);

      fetch('PHP/log_action.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData.toString()
      })
      .then(response => {
        if (!response.ok) {
          // Log a warning if the audit log fails to record
          console.warn('Audit log failed to record:', actionType, description, targetTable, targetId);
        }
      })
      .catch(error => console.error('Error logging user action:', error));
    }
    // Make the robust logging function globally accessible for use in other blocks 
    // (though in this consolidated file, local access is sufficient).
    window.logUserAction = logUserAction; 
    // --- Global Logging Function END ---

    // --- Sidebar Navigation Logic (FROM USER REQUEST) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    const urlMapping = {
      'dashboard': 'DashBoard.html',
      'clientcreation': 'ClientCreationForm.html',
      'loanapplication': 'LoanApplication.html',
      'pendingaccounts': 'PendingAccount.html',
      'forrelease': 'ReportsRelease.html',
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

          // ASYNCHRONOUS AUDIT LOG: Log the navigation using the robust function.
          logUserAction(actionType, description);

          // Perform the page redirect immediately after initiating the log.
          window.location.href = targetPage;
        } else {
          console.error('No page defined for this link:', linkText);
          
          const actionType = 'NAVIGATION_FAILED'; // Use a specific type for failures
          const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
          logUserAction(actionType, description);
        }
      });
    });

    // Handle the logout button securely
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        // The PHP script 'PHP/check_logout.php' should handle the log *before* session destruction.
        window.location.href = 'PHP/check_logout.php'; 
      });
    }
    // --- Sidebar Navigation Logic END ---

    // --- Selection Logic: Enforces SINGLE SELECTION (Checkbox acting as a Radio) ---
    function handleSelection(targetCheckbox) {
        // 1. Uncheck all other checkboxes
        document.querySelectorAll('input[name="selected"]').forEach(cb => {
            if (cb !== targetCheckbox) {
                cb.checked = false;
            }
        });
        
        // 2. Update row highlights based on the current (single) selection
        highlightSelectedRow();
    }
    // --- Selection Logic END ---


    // --- ACCOUNTS RECEIVABLE LOGIC START ---

    function renderAccounts(data) {
        const tableBody = document.querySelector('.approved-account-table-body');
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(account => {
            const isOverdueClass = account.is_overdue ? 'overdue-row' : '';
            
            const row = document.createElement('div');
            row.className = `table-row ${isOverdueClass}`;
            row.setAttribute('data-loan-id', account.loan_application_id); 
            
            // CRITICAL: Attach click listener to the whole row for selection
            row.addEventListener('click', function(event) {
                const checkboxInput = this.querySelector('input[type="checkbox"]');
                if (checkboxInput) {
                    // If the click was not directly on the checkbox, toggle it
                    if (event.target !== checkboxInput) {
                        checkboxInput.checked = !checkboxInput.checked;
                    }
                    // Run the single-selection handler
                    handleSelection(checkboxInput);
                }
            });

            // --- Checkbox Column ---
            const checkboxCell = document.createElement('div');
            checkboxCell.className = 'table-cell small-column';
            
            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.name = 'selected';
            checkboxInput.value = account.loan_application_id; 
            checkboxInput.setAttribute('data-client-id', account.client_ID);
            
            if (account.reconstruct_id) {
                checkboxInput.setAttribute('data-reconstruct-id', account.reconstruct_id);
            }
            
            // Add a change listener to checkbox to handle direct clicks
            checkboxInput.addEventListener('change', function() {
                handleSelection(this);
            });


            checkboxCell.appendChild(checkboxInput);
            row.appendChild(checkboxCell);
            // ---------------------------

            // Other Columns
            row.innerHTML += `
                <div class="table-cell" data-key="client_ID">${account.client_ID}</div>
                <div class="table-cell" data-key="loan_application_id">${account.loan_application_id}</div>
                <div class="table-cell" data-key="name">${account.first_name} ${account.last_name}</div>
                <div class="table-cell" data-key="principal_amount">${parseFloat(account.principal_amount).toFixed(2)}</div>
                <div class="table-cell" data-key="interest_amount">${parseFloat(account.interest_amount).toFixed(2)}</div>
                <div class="table-cell" data-key="total_loan_amount">${parseFloat(account.total_loan_amount).toFixed(2)}</div>
                <div class="table-cell" data-key="date_end">${account.date_end}</div>
            `;

            tableBody.appendChild(row);
        });
        
        highlightSelectedRow();
    }
    
    function highlightSelectedRow() {
        document.querySelectorAll('.table-row').forEach(row => {
            const checkboxInput = row.querySelector('input[type="checkbox"]');
            if (checkboxInput && checkboxInput.checked) {
                row.classList.add('selected-row');
            } else {
                row.classList.remove('selected-row');
            }
        });
    }


    window.fetchApprovedAccounts = function() {
        logUserAction('DATA_FETCH', 'Fetching approved and unpaid accounts for collection.');

        fetch('PHP/accountsreceivable_handler.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                accountsData = data;
                sortAndRender(currentSort.key, currentSort.direction); 
                attachSortingListeners(); 
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                alert('Failed to load accounts: ' + error.message);
            });
    };
    
    // --- Sorting Logic ---
    function sortAccounts(key, direction) {
        return accountsData.sort((a, b) => {
            let valA, valB;
            
            if (key === 'name') {
                valA = `${a.first_name} ${a.last_name}`.toUpperCase();
                valB = `${b.first_name} ${b.last_name}`.toUpperCase();
            } else if (key.includes('amount') || key === 'loan_application_id' || key === 'client_ID') {
                valA = parseFloat(a[key]);
                valB = parseFloat(b[key]);
                if (isNaN(valA)) valA = -Infinity;
                if (isNaN(valB)) valB = -Infinity;
            } else {
                valA = a[key].toUpperCase();
                valB = b[key].toUpperCase();
            }

            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }

            return direction === 'asc' ? comparison : comparison * -1;
        });
    }

    function sortAndRender(key, direction) {
        const sortedData = sortAccounts(key, direction);
        renderAccounts(sortedData);
        updateSortHeader(key, direction);
    }
    
    function updateSortHeader(key, direction) {
        const headers = document.querySelectorAll('.table-header-cell.sortable');
        headers.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.getAttribute('data-sort-key') === key) {
                header.classList.add(`sort-${direction}`);
            }
        });
    }

    function attachSortingListeners() {
        const headers = document.querySelectorAll('.table-header-cell.sortable');
        headers.forEach(header => {
            header.addEventListener('click', function() {
                const key = this.getAttribute('data-sort-key');
                let direction = 'asc';

                if (currentSort.key === key) {
                    direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    direction = 'asc';
                }
                
                currentSort.key = key;
                currentSort.direction = direction;
                
                sortAndRender(key, direction);
                
                logUserAction('DATA_SORT', `Sorted accounts by ${key} in ${direction.toUpperCase()} order.`);
            });
        });
    }

    // --- Search Functionality ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const filter = searchInput.value.toUpperCase();
            const tableBody = document.querySelector('.approved-account-table-body');
            const rows = tableBody.querySelectorAll('.table-row');

            rows.forEach(row => {
                const cells = row.querySelectorAll('.table-cell');
                let rowText = '';
                for (let i = 1; i < cells.length; i++) {
                    rowText += cells[i].textContent.toUpperCase() + ' ';
                }

                if (rowText.indexOf(filter) > -1) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    }

    // --- Button Event Listeners ---

    // Function to retrieve the single selected checkbox, or null
    function getSingleSelection() {
        const selectedCheckboxes = document.querySelectorAll('input[name="selected"]:checked');

        if (selectedCheckboxes.length === 0) {
            alert('Please select one account first.');
            return null;
        }
        // Because of handleSelection(), we know there is only one checked item.
        return selectedCheckboxes[0];
    }


    // SELECT Button (for Payment Collection)
    const selectButton = document.querySelector('.select-button');
    if (selectButton) {
        selectButton.addEventListener('click', () => {
            const selectedCheckbox = getSingleSelection();

            if (selectedCheckbox) {
                const clientID = selectedCheckbox.getAttribute('data-client-id');
                const loanID = selectedCheckbox.value;
                const reconstructID = selectedCheckbox.getAttribute('data-reconstruct-id');

                // --- LOGGING LOGIC ---
                const actionType = 'NAVIGATION'; 
                const targetTable = reconstructID ? 'loan_reconstruct' : 'loan_applications';
                const targetId = reconstructID || loanID;
                const description = `SELECT button clicked for Loan ID ${loanID}. Redirecting to payment page.`;

                logUserAction(actionType, description, targetTable, targetId);
                // ---------------------

                let url = `AccountsReceivableSelect.html?clientID=${clientID}&loanID=${loanID}`;
                if (reconstructID) {
                    url += `&reconstructID=${reconstructID}`;
                }

                window.location.href = url;
            }
        });
    }


    // RESTRUCTURE Button 
    const reconstructButton = document.querySelector('.reconstruct-button');
    if (reconstructButton) {
        reconstructButton.addEventListener('click', () => {
            const selectedCheckbox = getSingleSelection();

            if (selectedCheckbox) {
                const clientID = selectedCheckbox.getAttribute('data-client-id');
                const loanID = selectedCheckbox.value;
                const reconstructID = selectedCheckbox.getAttribute('data-reconstruct-id');

                // --- LOGGING LOGIC ---
                const actionType = 'NAVIGATION'; 
                const targetTable = reconstructID ? 'loan_reconstruct' : 'loan_applications';
                const targetId = reconstructID || loanID;
                const description = `RESTRUCTURE button clicked for Loan ID ${loanID}. Redirecting to reconstruct page.`;

                logUserAction(actionType, description, targetTable, targetId);
                // -------------------------------------------------

                let url = `AccountsReceivableReconstruct.html?clientID=${clientID}&loanID=${loanID}`;
                if (reconstructID) {
                    url += `&reconstructID=${reconstructID}`;
                }

                window.location.href = url;
            }
        });
    }

// --- ACCOUNTS RECEIVABLE LOGIC END ---
});