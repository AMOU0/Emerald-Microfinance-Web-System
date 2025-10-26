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
            enforceRoleAccess(['admin','Manager','Loan_Officer']); 
        });
/*=============================================================================*/


function logUserAction(actionType, description, options = {}) {
    // Use URLSearchParams to easily format the POST body
    const bodyData = new URLSearchParams();
    bodyData.append('action', actionType); 
    bodyData.append('description', description); 

    // Append optional parameters if they exist in the options object
    if (options.targetTable) bodyData.append('target_table', options.targetTable);
    if (options.targetId) bodyData.append('target_id', options.targetId);
    if (options.beforeState) bodyData.append('before_state', options.beforeState);
    if (options.afterState) bodyData.append('after_state', options.afterState);

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
// --------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
  // Call the session check function as soon as the page loads.
  checkSessionAndRedirect(); 

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
        // 1. Define action, description, and the new log options
        const actionType = 'NAVIGATION';
        const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;
        
        // Define the 'before' and 'after' states for the audit log
        const logOptions = {
            beforeState: `From URL: ${window.location.pathname}`, // The page the user was on
            afterState: `To URL: ${targetPage}`                 // The page the user is going to
        };

        // 2. ASYNCHRONOUS AUDIT LOG: Log the action with the new options.
        logUserAction(actionType, description, logOptions);

        // 3. Perform the page redirect immediately after initiating the log.
        window.location.href = targetPage;
      } else {
        console.error('No page defined for this link:', linkText);
        
        // Log the failed navigation attempt
        const actionType = 'NAVIGATION';
        const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
        logUserAction(actionType, description);
      }
    });
  });

  // Handle the logout button securely
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      window.location.href = 'PHP/check_logout.php'; 
    });
  }
});

/*=============================================================================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.clients-table-body');
    const searchInput = document.getElementById('searchInput');
    const sortableHeaders = document.querySelectorAll('.sortable-header'); // 💡 NEW: Select sortable headers
    let allClientData = []; // Variable to store all fetched data
    // 💡 NEW: Variables to track current sort state
    let currentSort = {
        key: null,
        direction: 'asc' // 'asc' or 'desc'
    };


    if (!tableBody) {
        console.error('Clients table body not found.');
        return;
    }

    tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">Loading client data...</div>`;

    // Function to calculate the next payment date (KEPT AS IS)
    const calculateNextPaymentDate = (startDate, frequency, lastPaymentDate) => {
        let currentDate = new Date(startDate);
        
        if (isNaN(currentDate.getTime())) {
            return 'Date Error';
        }

        if (!lastPaymentDate) {
            return currentDate.toLocaleDateString();
        }

        const lastPayment = new Date(lastPaymentDate);

        while (currentDate <= lastPayment) {
            if (frequency === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (frequency === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                return 'N/A';
            }
        }
        
        if (isNaN(currentDate.getTime())) {
            return 'Date Error';
        }

        return currentDate.toLocaleDateString();
    };

    // 💡 NEW: Helper function to get the display name
    const getFullName = (item) => {
        return `${item.first_name} ${item.middle_name ? item.middle_name + ' ' : ''}${item.last_name}`;
    };
    
    // 💡 NEW: Helper function to get the next payment date for sorting
    const getNextPaymentDateForSorting = (item) => {
        if (item.balance > 0.01 && item.date_start && item.payment_frequency) {
            const calculatedDate = calculateNextPaymentDate(item.date_start, item.payment_frequency, item.last_payment_date);
            // Return the raw date string for comparison or a value that pushes 'N/A' to the end.
            return (calculatedDate && calculatedDate !== 'Invalid Date' && calculatedDate !== 'Date Error' && calculatedDate !== 'N/A') ? new Date(calculatedDate).getTime() : Infinity; 
        }
        return Infinity; // Put N/A items at the end
    }

    // 💡 NEW: Function to handle sorting logic
    const sortData = (data, key, direction) => {
        return data.sort((a, b) => {
            let aValue, bValue;

            if (key === 'name') {
                aValue = getFullName(a).toLowerCase();
                bValue = getFullName(b).toLowerCase();
            } else if (key === 'date') {
                aValue = getNextPaymentDateForSorting(a);
                bValue = getNextPaymentDateForSorting(b);
                
                // Special handling for dates (Infinity = N/A)
                if (aValue === Infinity && bValue !== Infinity) return direction === 'asc' ? 1 : -1;
                if (aValue !== Infinity && bValue === Infinity) return direction === 'asc' ? -1 : 1;
                
                return (aValue - bValue) * (direction === 'asc' ? 1 : -1);

            } else if (key === 'balance') {
                // Balance is a number (raw balance from the item)
                aValue = parseFloat(a.balance || 0);
                bValue = parseFloat(b.balance || 0);
            } else {
                // Default to string comparison for all others
                aValue = String(a[key]).toLowerCase();
                bValue = String(b[key]).toLowerCase();
            }

            // For numbers (like balance), the logic is different
            if (key === 'balance' || key === 'date') {
                return (aValue - bValue) * (direction === 'asc' ? 1 : -1);
            }

            // For strings (like name)
            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // NEW: Function to update sort icons
    const updateSortIcons = () => {
        sortableHeaders.forEach(header => {
            header.classList.remove('sorted');
            const icon = header.querySelector('.sort-icon');
            if (icon) {
                icon.textContent = '↕'; // Default icon
            }
            
            if (header.dataset.sortKey === currentSort.key) {
                header.classList.add('sorted');
                if (icon) {
                    icon.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
                }
            }
        });
    };

    // Function to render the table with the given data
    const renderTable = (dataToRender) => {
        // ... (renderTable logic is mostly the same, using getFullName) ...
        if (!Array.isArray(dataToRender) || dataToRender.length === 0) {
            tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">No client data found.</div>`;
            return;
        }

        tableBody.innerHTML = '';
        
        dataToRender.forEach(item => {
            const fullName = getFullName(item); // Use the helper function
            
            let nextPaymentDate;
            
            // Recalculate nextPaymentDate for display
            if (item.balance > 0.01 && item.date_start && item.payment_frequency) {
                const calculatedDate = calculateNextPaymentDate(item.date_start, item.payment_frequency, item.last_payment_date);
                
                if (calculatedDate && calculatedDate !== 'Invalid Date' && calculatedDate !== 'Date Error') {
                    nextPaymentDate = calculatedDate;
                } else {
                    nextPaymentDate = 'Date Error'; 
                }
            } else {
                // Fully Paid or No Loan: Display N/A
                nextPaymentDate = 'N/A';
            }
            
            const balanceDisplay = item.balance_display; 

            const row = document.createElement('div');
            row.className = item.client_ID ? 'clients-row clickable-row' : 'clients-row'; 
            row.dataset.clientId = item.client_ID; 

            row.innerHTML = `
                <div class="clients-cell">${fullName}</div>
                <div class="clients-cell">${item.phone_number || ''}</div>
                <div class="clients-cell">${nextPaymentDate}</div>
                <div class="clients-cell">${balanceDisplay}</div>`; 

            if (item.client_ID) {
                row.addEventListener('click', function() {
                    const clientId = this.dataset.clientId;
                    const clientName = fullName; // Use the client name from the outer scope
                    const targetPage = `LedgersView.html?client_id=${clientId}`;

                    // Log the client selection
                    const actionType = 'VIEW';
                    const description = `Selected client "${clientName}" (ID: ${clientId}) to view ledger.`;
                    const logOptions = {
                        targetTable: 'clients',
                        targetId: clientId,
                        beforeState: `From URL: ${window.location.pathname}`, 
                        afterState: `To URL: ${targetPage}` 
                    };
                    
                    // This call now works because logUserAction is in the global scope.
                    logUserAction(actionType, description, logOptions);

                    window.location.href = targetPage;
                });
            }
            
            tableBody.appendChild(row);
        });
        
        // Update icons after rendering
        updateSortIcons();
    };

    // Function to handle search input (UPDATED to call renderTable with filtered *and sorted* data)
    const handleSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        let dataToDisplay = allClientData;
        
        if (searchTerm !== '') {
            dataToDisplay = allClientData.filter(item => {
                const fullName = getFullName(item).toLowerCase(); // Use helper function
                const clientId = String(item.client_ID).toLowerCase();
                // NOTE: loan_ID is not present in the current PHP output, 
                // but the search logic remains for future proofing.
                const loanId = String(item.loan_application_id || '').toLowerCase(); 

                // Search by Client ID, Loan ID, or Name
                return clientId.includes(searchTerm) || 
                       loanId.includes(searchTerm) ||
                       fullName.includes(searchTerm);
            });
        }

        // Re-sort the filtered or unfiltered data
        if (currentSort.key) {
            dataToDisplay = sortData([...dataToDisplay], currentSort.key, currentSort.direction);
        }

        renderTable(dataToDisplay);
    };

    // 💡 NEW: Event listener for sortable headers
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const key = this.dataset.sortKey;
            
            if (!key) return;

            // Determine the new sort direction
            if (currentSort.key === key) {
                // Toggle direction if same key is clicked
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // New key clicked, set to default ascending
                currentSort.key = key;
                currentSort.direction = 'asc';
            }

            // Re-sort the data based on the new state
            let dataToDisplay = allClientData;
            
            // Preserve search filter if one is active
            const searchTerm = searchInput.value.toLowerCase().trim();
            if (searchTerm !== '') {
                dataToDisplay = allClientData.filter(item => {
                    const fullName = getFullName(item).toLowerCase();
                    const clientId = String(item.client_ID).toLowerCase();
                    const loanId = String(item.loan_application_id || '').toLowerCase(); 

                    return clientId.includes(searchTerm) || 
                           loanId.includes(searchTerm) ||
                           fullName.includes(searchTerm);
                });
            }

            // Sort the current view (filtered or unfiltered) 
            const sortedData = sortData(dataToDisplay, currentSort.key, currentSort.direction);
            
            renderTable(sortedData);
        });
    });

    // Fetch data and attach listeners
    fetch('PHP/ledger_handler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched client data:', data);

            if (!Array.isArray(data)) {
                allClientData = [];
            } else {
                // 🌟 Filter out clients with a balance of 0.01 or less 🌟
                allClientData = data.filter(item => (item.balance ?? 0) > 0.01);
            }

            // Initial render (no sorting applied yet, or apply default sort if desired)
            renderTable(allClientData);
            
            // Attach the search event listener
            if (searchInput) {
                searchInput.addEventListener('input', handleSearch);
            }
        })
        .catch(error => {
            console.error('Error fetching client data:', error);
            tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">Error loading data. Check the browser console for details.</div>`;
        });
});