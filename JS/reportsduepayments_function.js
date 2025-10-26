document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Define ALL Access Rules
    // The role 'loan officer' has been changed to 'loan_officer' everywhere.
    // All roles are stored in lowercase for robust, case-insensitive matching.
    const accessRules = {
        // Main Navigation Links (.sidebar-nav ul li a)
        'Dashboard': ['admin', 'manager', 'loan_officer'],
        'Client Creation': ['admin', 'loan_officer'],
        'Loan Application': ['admin', 'loan_officer'],
        'Pending Accounts': ['admin', 'manager'],
        'Payment Collection': ['admin', 'manager'],
        'Ledger': ['admin', 'manager', 'loan_officer'],
        'Reports': ['admin', 'manager', 'loan_officer'],
        'Tools': ['admin', 'manager', 'loan_officer'],
        
        // Report Sidebar Buttons (.reports-sidebar .report-button)
        'Existing Clients': ['admin', 'manager', 'loan_officer'],
        'Overdue': ['admin', 'manager', 'loan_officer'],
        'Due Payments': ['admin', 'manager'],
        'Audit Trail': ['admin'],
        'Reports Release': ['admin', 'manager', 'loan_officer']
    };

    // 2. Fetch the current user's role
    fetch('PHP/check_session.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'active' && data.role) {
                // IMPORTANT: Normalize the role here to ensure it matches the rules.
                // Replace any spaces with an underscore and convert to lowercase.
                const userRole = data.role.toLowerCase().replace(' ', '_');
                
                // Pass the normalized role to the single control function
                applyAccessControl(userRole);
            } else {
                // Treat inactive session as having a 'none' role (hides everything)
                applyAccessControl('none');
            }
        })
        .catch(error => {
            console.error('Error fetching user session:', error);
            // Fallback: If fetch fails, hide everything for security/clarity
            applyAccessControl('none'); 
        });

    // 3. Apply Access Control to all elements
    function applyAccessControl(userRole) {
        // Log the role we are checking against.
        console.log(`User Role (normalized): ${userRole}`);
        
        // --- 3a. Process Main Navigation Links (Hides the parent <li>) ---
        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');
        navLinks.forEach(link => {
            processElement(link, 'li'); 
        });

        // --- 3b. Process Report Sidebar Buttons (Hides the button itself) ---
        const reportButtons = document.querySelectorAll('.reports-sidebar .report-button');
        reportButtons.forEach(button => {
            processElement(button, 'self'); 
        });

        // Helper function to handle the logic for both types of elements
        function processElement(element, hideTarget) {
            const linkName = element.textContent.trim();
            let elementToHide = element;

            if (hideTarget === 'li') {
                elementToHide = element.parentElement; // Hide the parent <li> for navigation
            }
            
            // Check if the link name exists in the access rules
            if (accessRules.hasOwnProperty(linkName)) {
                const allowedRoles = accessRules[linkName];

                // Check if the normalized user role is in the array of allowed roles
                if (!allowedRoles.includes(userRole)) {
                    // Hide the target element
                    elementToHide.style.display = 'none';
                    // console.log(`Hiding: ${linkName}. Allowed Roles: ${allowedRoles.join(', ')}`);
                } else {
                    // console.log(`Showing: ${linkName}`);
                }
            } else {
                // If an element is in the HTML but not in the rules, we hide it by default
                elementToHide.style.display = 'none';
                console.warn(`Hiding: ${linkName}. No access rule defined.`);
            }
        }
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

    // --------------------------------------------------------
    // --- UTILITY FUNCTIONS ---
    // --------------------------------------------------------
    function getTodayDateString() {
        const today = new Date();
        const yyyy = today.getFullYear();
        // getMonth() is 0-indexed, so add 1
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function logUserAction(actionType, description) {
      const bodyData = new URLSearchParams();
      bodyData.append('action', actionType);
      bodyData.append('description', description);

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

    function updateSummaryCards(summary) {
        // Ensure the Overdue card is visible if data is present
        const overdueCard = document.querySelector('.summary-cards .total-overdue');
        const showOverdue = summary.totalOverdueAmount > 0 || statusFilterElement.value === 'Overdue';
        if (overdueCard) {
            overdueCard.hidden = !showOverdue; 
        }

        document.querySelector('.summary-cards .total-due p').textContent = `₱ ${summary.totalDueToday.toFixed(2)}`;
        document.querySelector('.summary-cards .accounts-due p').textContent = summary.accountsDueToday;
        document.querySelector('.summary-cards .total-overdue p').textContent = `₱ ${summary.totalOverdueAmount.toFixed(2)}`;
    }

    function exportToCSV() {
        const table = document.querySelector('.report-table-container table');
        let csv = [];
        const rows = table.querySelectorAll('tr');

        // Note: Colspan is 9 (8 data columns + 1 action column)
        if (rows.length <= 1 || table.querySelector('tbody tr td[colspan="9"]')) { 
            alert('No data to export.');
            return;
        }

        const headerCells = rows[0].querySelectorAll('th');
        let header = [];
        // Only export up to the Status column (column index 7) to exclude the empty Action column
        for(let i = 0; i < headerCells.length - 1; i++) {
            const cell = headerCells[i];
            header.push(cell.textContent.trim().replace('₱', '').replace(/\s+/g, '_'));
        }
        csv.push(header.join(','));

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');

            if (cells.length === 1 && cells[0].textContent.includes('No payments found')) {
                continue;
            }

            let rowData = [];
            // Process only the first 8 columns (up to Status)
            for(let index = 0; index < cells.length - 1; index++) {
                const cell = cells[index];
                let cellText = cell.textContent.trim();
                
                // Clean currency columns (indices 4, 5, 6)
                if (index >= 4 && index <= 6) { 
                    cellText = cellText.replace('₱', '').trim();
                } 
                // Clean Status column (index 7)
                else if (index === 7) { 
                    const statusSpan = cell.querySelector('.status');
                    cellText = statusSpan ? statusSpan.textContent.trim() : cellText;
                } 
                // Clean Loan ID column (index 2)
                else if (index === 2) {
                    // Remove the visible indicator (R) from export
                    cellText = cellText.replace(/\(R\)/g, '').trim();
                }
                
                // Handle commas within data fields
                if (cellText.includes(',')) {
                    cellText = `"${cellText.replace(/"/g, '""')}"`;
                }
                rowData.push(cellText);
            }
            csv.push(rowData.join(','));
        }

        const csvString = csv.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", "DuePaymentsReport_" + new Date().toISOString().slice(0, 10) + ".csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        logUserAction('CREATE', 'Exported Due Payments Report to CSV.');
    }
    
// --------------------------------------------------------
// --- CORE FETCH/DISPLAY FUNCTION ---
// --------------------------------------------------------
    function fetchAndDisplayDuePayments(filterDate = null, filterStatus = null) {
        // 1. Pass ONLY the date filter to PHP.
        let url = 'PHP/reportsduedate_handler.php';
        if (filterDate) {
            url += `?filter_date=${filterDate}`;
        }

        const existingTbody = tableBody.querySelector('tbody');
        if (existingTbody) {
            existingTbody.remove();
        }

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    // Try to read error message if present, otherwise throw generic error
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }).catch(() => {
                        throw new Error(`HTTP error! status: ${response.status} or malformed error response.`);
                    });
                }
                return response.json(); // Line 145 (Original) - Now protected by PHP buffering
            })
            .then(data => {
                let allPayments = data.data || [];

                // 2. CLIENT-SIDE STATUS FILTERING: Filter if a specific status is requested.
                let filteredPayments = allPayments;
                if (filterStatus && filterStatus !== "") {
                    filteredPayments = allPayments.filter(item => item.status === filterStatus);
                }

                // 3. RECALCULATE SUMMARY FOR THE FILTERED DATA
                let totalDueToday = 0.00;
                let accountsDueToday = 0;
                let totalOverdueAmount = 0.00;

                filteredPayments.forEach(item => {
                    if (item.status === 'Due Today') {
                        totalDueToday += item.total_payment_due;
                        accountsDueToday++;
                    } else if (item.status === 'Overdue') {
                        totalOverdueAmount += item.total_payment_due;
                    }
                });

                const summary = {
                    totalDueToday: totalDueToday,
                    accountsDueToday: accountsDueToday,
                    totalOverdueAmount: totalOverdueAmount
                };

                updateSummaryCards(summary);

                // 4. RENDER TABLE
                if (filteredPayments.length === 0) {
                    // Note: Colspan is 9 (8 data columns + 1 empty action column)
                    const noDataHTML = `<tbody><tr><td colspan="9">No payments found matching the filters.</td></tr></tbody>`;
                    tableBody.insertAdjacentHTML('beforeend', noDataHTML);
                    logUserAction('VIEW', 'Loaded Due Payments Report with 0 records.');
                    return;
                }

                let tableHTML = '<tbody>';
                filteredPayments.forEach(item => {
                    const statusClass = item.status.toLowerCase().replace(/\s/g, '-');
                    
                    // Check if 'colateral' field contains the RECONSTRUCTED flag
                    const isReconstructed = item.colateral && item.colateral.startsWith('RECONSTRUCTED');
                    
                    // The tooltip (title) shows the full colateral content
                    const reconIndicator = isReconstructed ? 
                        `<span title="${item.colateral.replace(/"/g, '')}" style="color: red; font-weight: bold; margin-left: 5px;">(R)</span>` : '';

                    tableHTML += `
                        <tr>
                            <td>${item.client_name}</td>
                            <td>${item.contact_number}</td>
                             <td>${item.loan_id}${reconIndicator}</td>
                            <td>${item.due_date}</td>
                            <td>₱ ${item.principal_due.toFixed(2)}</td>
                            <td>₱ ${item.interest_due.toFixed(2)}</td>
                            <td>₱ ${item.total_payment_due.toFixed(2)}</td>
                            <td><span class="status ${statusClass}">${item.status}</span></td>
                            <td></td>                         </tr>
                    `;
                });
                tableHTML += '</tbody>';

                tableBody.insertAdjacentHTML('beforeend', tableHTML);

                logUserAction('VIEW', `Successfully loaded Due Payments Report with ${filteredPayments.length} records.`);
            })
            .catch(error => {
                // This will catch the PHP error message if it was sent as a proper JSON error, 
                // or the original JSON syntax error.
                console.error('Error fetching due payments:', error);
                // Update UI with the error
                const errorMessage = error.message.includes('HTTP error') ? 
                                    'Error loading report data. See console for network details.' : 
                                    `Error loading report data: ${error.message}`;
                const errorHTML = `<tbody><tr><td colspan="9">${errorMessage}</td></tr></tbody>`;
                
                // Ensure the previous tbody is cleared before showing the error
                const existingTbody = tableBody.querySelector('tbody');
                if (existingTbody) {
                    existingTbody.remove();
                }
                tableBody.insertAdjacentHTML('beforeend', errorHTML);
                logUserAction('ERROR', `Failed to load Due Payments Report: ${error.message}`);
            });
    }

    // --------------------------------------------------------
    // --- CONSTANTS AND MAPPINGS ---
    // --------------------------------------------------------
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    const reportButtons = document.querySelectorAll('.report-button');

    const applyFilterButton = document.querySelector('.apply-filter-button');
    const exportButton = document.querySelector('.export-button'); 
    const tableBody = document.querySelector('.report-table-container table');
    const statusFilterElement = document.getElementById('filter-action'); 
    const dueDateFilterElement = document.getElementById('due-date-filter'); 

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

    const reportUrlMapping = {
        'existingclients': 'ReportsExistingClient.html',
        'duepayments': 'ReportsDuePayments.html',
 'overdue': 'ReportsDelinquentAccounts.html', 
        'audittrail': 'ReportsAuditTrail.html',
        'reportsrelease': 'ReportsRelease.html'
    };


    // --------------------------------------------------------
    // --- EVENT HANDLERS ---
    // --------------------------------------------------------

    // Primary Navigation Handler (kept for completeness)
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
          logUserAction(actionType, description);
          window.location.href = targetPage;
        } else {
          console.error('No page defined for this link:', linkText);
          const actionType = 'NAVIGATION'; 
          const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
          logUserAction(actionType, description);
        }
      });
    });

    // Reports Sidebar Navigation Handler (kept for completeness)
    reportButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            const buttonText = this.textContent.toLowerCase().replace(/\s/g, '');
            const targetPage = reportUrlMapping[buttonText];

            if (targetPage) {
                const actionType = 'VIEW'; 
                const description = `Viewed Report: ${this.textContent} (${targetPage})`;
                logUserAction(actionType, description);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this report button:', buttonText);
                const actionType = 'VIEW'; 
                const description = `FAILED: Clicked report button "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });

    // Apply Filter Button Event Listener - Correctly uses current UI values
    if (applyFilterButton) {
        applyFilterButton.addEventListener('click', function() {
            // Get date and ensure it's null if empty string
            const dueDate = dueDateFilterElement.value || null;
            
            // Get status and ensure it's null if empty string ('All Statuses')
            const statusFilter = statusFilterElement.value || null; 

            logUserAction('VIEW', `Applied filters: Date=${dueDate || 'None'}, Status=${statusFilter || 'All'}`);
            
            fetchAndDisplayDuePayments(dueDate, statusFilter); 
        });
    }
    
    // Export Button Event Listener
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }

    // Logout Button Handler
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        logUserAction('LOGOUT', 'User logged out.');
        window.location.href = 'PHP/check_logout.php';
      });
    }

 // ----------------------------------------------------------------------
 // --- INITIALIZATION LOGIC (IMPLEMENTED DEFAULT: Current Date + 'Due Today') ---
 // ----------------------------------------------------------------------
    const initialFilterType = localStorage.getItem('reportFilterType');
    let initialFilterDate = null;
    let initialFilterStatus = 'Due Today'; // **EXPLICITLY set default status**
    let actionDescription = `Initial load with default filter: Status = ${initialFilterStatus}`;
    
    // Set the UI status element to the default 'Due Today'
    if (statusFilterElement) {
        statusFilterElement.value = initialFilterStatus; 
    }

    if (initialFilterType) {
        // --- Logic when navigating from a Dashboard Tile ---
        localStorage.removeItem('reportFilterType'); 
        
        if (initialFilterType === 'dueToday') {
            initialFilterDate = getTodayDateString();
            
            if (dueDateFilterElement) {
                dueDateFilterElement.value = initialFilterDate; // Set UI date
            }
            initialFilterStatus = 'Due Today'; 
            if (statusFilterElement) statusFilterElement.value = initialFilterStatus; // Set UI status
            actionDescription = `Loaded with filter from dashboard: Due Today (${initialFilterDate}), Status=${initialFilterStatus}`;
            
        } else if (initialFilterType === 'dueThisWeek') {
            initialFilterDate = 'THIS_WEEK_RANGE'; 
            // When filtering by 'This Week', we want all statuses.
            initialFilterStatus = ''; // Set to All Statuses (empty string)
            if (statusFilterElement) statusFilterElement.value = initialFilterStatus; // Set UI status
            // Clear the date input since 'THIS_WEEK_RANGE' isn't a single date
            if (dueDateFilterElement) dueDateFilterElement.value = ''; 
            actionDescription = `Loaded with filter from dashboard: Due This Week, Status=All`;
        }
    } else {
        // --- Logic for standard first load (No dashboard filter) ---
        initialFilterDate = getTodayDateString();
        if (dueDateFilterElement) {
            dueDateFilterElement.value = initialFilterDate; // Set UI date to today
        }
        // initialFilterStatus is already 'Due Today'
        actionDescription = `Initial load with default filters: Date=${initialFilterDate}, Status=${initialFilterStatus}`;
    }
    
    // Log and fetch the data with the determined filters.
    // Use || null to ensure empty string ('All Statuses') is treated as null in fetch.
    logUserAction('VIEW', actionDescription);
    fetchAndDisplayDuePayments(initialFilterDate, initialFilterStatus || null); 
});