document.addEventListener('DOMContentLoaded', function() {
  // Call the session check function as soon as the page loads.
  checkSessionAndRedirect(); 

  // --- Global Logging Function (UPDATED to accept four parameters) ---
  function logUserAction(actionType, description, targetTable = null, targetId = null) {
    // Note: The PHP script (PHP/log_action.php) MUST be updated 
    // to handle 'target_table' and 'target_id' fields.
    
    // Use URLSearchParams to easily format the POST body
    const bodyData = new URLSearchParams();
    bodyData.append('action', actionType); 
    bodyData.append('description', description); 
    
    // Append the new, separate fields
    if (targetTable) bodyData.append('target_table', targetTable);
    if (targetId) bodyData.append('target_id', targetId);

    // Note: 'before_state' is not implemented in this client-side code, 
    // but the PHP script can be updated to handle a 'before_state' parameter.

    fetch('PHP/log_action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyData.toString()
    })
    .then(response => {
      if (!response.ok) {
        console.warn('Audit log failed to record:', actionType, description, targetTable, targetId);
      }
    })
    .catch(error => {
      console.error('Audit log fetch error:', error);
    });
  }
  // --------------------------------------------------------

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
        // 1. Define clear action type and description for the log
        const actionType = 'NAVIGATION'; // Use the fixed type for filtering
        const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;
        // Target Table and ID are null for general navigation

        // 2. ASYNCHRONOUS AUDIT LOG: Log the action.
        logUserAction(actionType, description);

        // 3. Perform the page redirect immediately after initiating the log.
        window.location.href = targetPage;
      } else {
        console.error('No page defined for this link:', linkText);
        
        // OPTIONAL: Log the failed navigation attempt
        const actionType = 'NAVIGATION';
        const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
        logUserAction(actionType, description);
      }
    });
  });

  // Handle the logout button securely
  // The PHP script 'PHP/check_logout.php' should handle the log *before* session destruction.
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      window.location.href = 'PHP/check_logout.php'; 
    });
  }

/*==================================================================================================================================================================== */
// --- ACCOUNTS RECEIVABLE LOGIC START ---
let allAccounts = []; // Stores the full list of accounts
// Global state for sorting
let currentSortColumn = 'created_at'; 
let currentSortDirection = 'desc'; // Default descending (newest first)

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
            // Initial sort: Uses the default state ('created_at' DESC)
            sortTable('created_at', true); 
            addTableHeaderListeners(); // Add listeners after data is fetched
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Failed to load approved accounts. Please try again later.');
        });
};

/**
 * Sorts the allAccounts array and then calls filterAndDisplayAccounts.
 * Handles the ASC/DESC toggle on repeated clicks.
 * @param {string} column - The data property to sort by.
 * @param {boolean} initialLoad - Flag to use the global state without toggling.
 */
const sortTable = (column, initialLoad = false) => {
    
    // --- DETERMINE NEW SORT DIRECTION (Ascending/Descending Toggle) ---
    if (!initialLoad) {
        if (currentSortColumn === column) {
            // Clicking the same column: Toggle direction
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Clicking a NEW column: Set new column and default to 'asc'
            currentSortColumn = column;
            currentSortDirection = 'asc';
        }
    }
    // If it's an initialLoad, we use the global defaults which are already set.

    // --- SORTING LOGIC ---
    // dir is 1 for ASC, -1 for DESC. This reverses the standard sort return values for DESC.
    const dir = currentSortDirection === 'asc' ? 1 : -1;

    allAccounts.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Type conversion for correct sorting
        if (['client_ID', 'loan_application_id', 'principal_amount', 'interest_amount', 'total_loan_amount'].includes(column)) {
            // Treat money and IDs as NUMBERS
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        } else if (column === 'last_name') {
            // Sort by full name for the Name column
            valA = a.last_name.toLowerCase() + a.first_name.toLowerCase();
            valB = b.last_name.toLowerCase() + b.first_name.toLowerCase();
        } else if (column === 'date_end' || column === 'created_at') {
            // Convert dates to a comparable number (timestamp)
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else if (typeof valA === 'string') {
            // Default to case-insensitive string comparison
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        // The core comparison logic
        if (valA < valB) {
            return -1 * dir; // If dir is 1 (asc), returns -1 (A before B). If dir is -1 (desc), returns 1 (B before A).
        }
        if (valA > valB) {
            return 1 * dir; // If dir is 1 (asc), returns 1 (B after A). If dir is -1 (desc), returns -1 (A after B).
        }
        return 0; // Values are equal
    });
    
    // Re-apply the search filter after sorting
    filterAndDisplayAccounts();
    updateTableHeaderIndicators();
};

/**
 * Adds click event listeners to the table headers for sorting.
 */
const addTableHeaderListeners = () => {
    const headerCells = document.querySelectorAll('.table-header-cell');
    
    // Map of table header text to the corresponding data property for sorting
    const columnMap = {
        'Client ID': 'client_ID',
        'Loan ID': 'loan_application_id',
        'Name': 'last_name',
        'Principal Amount': 'principal_amount',
        'Interest Amount': 'interest_amount',
        'Loan Amount': 'total_loan_amount',
        'Due Date': 'date_end',
    };

    headerCells.forEach(headerCell => {
        const headerText = headerCell.textContent.trim();
        const sortColumn = columnMap[headerText];

        if (sortColumn) {
            headerCell.classList.add('sortable');
            headerCell.addEventListener('click', () => {
                // Call sortTable and pass the column name
                sortTable(sortColumn); 
            });
        }
    });
};

/**
 * Updates the visual indicators (like an arrow) on the table headers
 * to show the current sort column and direction.
 */
const updateTableHeaderIndicators = () => {
    const headerCells = document.querySelectorAll('.table-header-cell');
    // Map of data property to the *visible* table header text
    const columnMap = {
        'client_ID': 'Client ID',
        'loan_application_id': 'Loan ID',
        'last_name': 'Name',
        'principal_amount': 'Principal Amount',
        'interest_amount': 'Interest Amount',
        'total_loan_amount': 'Loan Amount',
        'date_end': 'Due Date',
        'created_at': '' // 'created_at' is used for initial sort but usually has no click header
    };

    headerCells.forEach(cell => {
        // Remove existing indicators
        cell.classList.remove('sort-asc', 'sort-desc');

        const sortText = columnMap[currentSortColumn];
        
        // Check if the cell's text matches the current sort column's visible text
        if (sortText && sortText === cell.textContent.trim()) {
            // Add the class for the current sort direction
            cell.classList.add(`sort-${currentSortDirection}`);
        }
    });
};

// Function to filter and display accounts based on search input
const filterAndDisplayAccounts = () => {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const tableBody = document.querySelector('.approved-account-table-body');
    tableBody.innerHTML = '';

    const filteredAccounts = allAccounts.filter(client => {
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

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', filterAndDisplayAccounts);
}
// Initial fetch of approved accounts
fetchApprovedAccounts();


/*=============================================================================================================================================================================*/

// Add an event listener to the "SELECT" button 
const selectButton = document.querySelector('.select-button');
if (selectButton) {
    selectButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');

        if (selectedRadio) {
            const clientID = selectedRadio.getAttribute('data-client-id');
            const loanID = selectedRadio.value;
            const reconstructID = selectedRadio.getAttribute('data-reconstruct-id'); // Get the reconstruct ID

            // --- LOGGING LOGIC (UPDATED to separate fields) ---
            const actionType = 'NAVIGATION'; 
            const targetTable = reconstructID ? 'loan_reconstruct' : 'loan_applications';
            const targetId = reconstructID || loanID;
            // The description is simplified to just the action and target type
            const description = `SELECT button clicked for Loan ID ${loanID}. Redirecting to payment page.`;

            // Call logUserAction with the four separated parameters
            logUserAction(actionType, description, targetTable, targetId);
            // -------------------------------------------------

            let url = `AccountsReceivableSelect.html?clientID=${clientID}&loanID=${loanID}`;
            if (reconstructID) {
                url += `&reconstructID=${reconstructID}`; // Append reconstruct ID if it exists
            }
            
            window.location.href = url;
        } else {
            alert('Please select an account first.');
        }
    });
}
/*================================= */
// Add an event listener to the "reconstruct" button 
const reconstructButton = document.querySelector('.reconstruct-button');
if (reconstructButton) {
    reconstructButton.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="selected"]:checked');

        if (selectedRadio) {
            const clientID = selectedRadio.getAttribute('data-client-id');
            const loanID = selectedRadio.value;
            const reconstructID = selectedRadio.getAttribute('data-reconstruct-id');

            // --- LOGGING LOGIC (UPDATED to separate fields) ---
            const actionType = 'NAVIGATION'; 
            const targetTable = reconstructID ? 'loan_reconstruct' : 'loan_applications';
            const targetId = reconstructID || loanID;
            // The description is simplified to just the action and target type
            const description = `RESTRUCTURE button clicked for Loan ID ${loanID}. Redirecting to reconstruct page.`;

            // Call logUserAction with the four separated parameters
            logUserAction(actionType, description, targetTable, targetId);
            // -------------------------------------------------

            let url = `AccountsReceivableReconstruct.html?clientID=${clientID}&loanID=${loanID}`;
            if (reconstructID) {
                url += `&reconstructID=${reconstructID}`;
            }

            window.location.href = url;
        } else {
            alert('Please select an account first.');
        }
    });
}
// --- ACCOUNTS RECEIVABLE LOGIC END ---
});