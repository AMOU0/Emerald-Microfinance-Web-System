document.addEventListener('DOMContentLoaded', function() {
    // ====================================================================
    // 1. ACCESS CONTROL AND NAVIGATION LOGIC
    // ====================================================================
    
    // A. Define Access Rules (Keeping the original structure for consistency)
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'For Release': ['Admin', 'Manager', 'Loan_Officer'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer'],

        // Report Sidebar Buttons (.reports-sidebar .report-button)
        'Existing Clients': ['admin', 'manager', 'loan_officer'],
        'Released List': ['admin', 'manager', 'loan_officer'],
        'Collection List': ['admin', 'manager', 'loan_officer'],
        'Overdue': ['admin', 'manager', 'loan_officer'],
        'Due Payments': ['admin', 'manager'],
        'Audit Trail': ['admin']
    };

    // B. Global Logging Function
    function logUserAction(actionType, description) {
        const bodyData = new URLSearchParams();
        bodyData.append('action_type', actionType);
        bodyData.append('description', description);
        
        fetch('PHP/aalog_handler.php', {
            method: 'POST',
            body: bodyData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(response => {
            if (!response.ok) {
                console.error('Server responded with an error for logUserAction.');
            }
        })
        .catch(error => console.error('Error logging user action:', error));
    }
    window.logUserAction = logUserAction; // Make global

    // C. URL MAPPINGS
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

    const reportUrlMapping = {
        'existingclients': 'ReportsExistingClient.html',
        'releasedlist': 'ReleasedLoan.html',
        'collectionlist': 'CollectionToday.html',
        'duepayments': 'ReportsDuePayments.html',
        'overdue': 'ReportsDelinquentAccounts.html', 
        'audittrail': 'ReportsAuditTrail.html',
    };
    
    // D. Access Control Utility Functions (Omitted for brevity, assumed functional)

    function applySidebarAccessControl(userRole) {
        const normalizedRoleMap = role => role.toUpperCase().replace('_', '');
        const userRoleUpper = userRole.toUpperCase().replace(' ', '_').replace('_', '');

        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');
        navLinks.forEach(link => {
            const linkText = link.textContent.trim();
            const parentListItem = link.parentElement;
            if (accessRules.hasOwnProperty(linkText)) {
                const allowedRoles = accessRules[linkText].map(normalizedRoleMap);
                parentListItem.style.display = allowedRoles.includes(userRoleUpper) ? '' : 'none';
            } else {
                parentListItem.style.display = 'none';
            }
        });
        
        const reportButtons = document.querySelectorAll('.reports-sidebar .report-button');
        reportButtons.forEach(button => {
            const buttonText = button.textContent.trim();
            if (accessRules.hasOwnProperty(buttonText)) {
                const allowedRoles = accessRules[buttonText].map(normalizedRoleMap);
                button.style.display = allowedRoles.includes(userRoleUpper) ? 'block' : 'none';
            } else {
                button.style.display = 'none';
            }
        });
    }

    function enforceRoleAccess(userRole, requiredRoles) {
        const normalizedRequiredRoles = requiredRoles.map(role => role.toLowerCase().replace(' ', '_'));
        const userRoleLower = userRole.toLowerCase().replace(' ', '_');
        
        if (!normalizedRequiredRoles.includes(userRoleLower)) {
            const description = `User with role ${userRole} attempted to access restricted page: ReleasedLoan.html. Required roles: ${requiredRoles.join(', ')}`;
            logUserAction('ACCESS_DENIED', description);
            alert('Access Denied. You do not have the required role to view this page.');
            window.location.href = urlMapping['dashboard'] || 'login.html'; 
        }
    }
    
    function checkSessionAndRedirect() {
        fetch('PHP/check_session.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const userRole = (data.status === 'active' && data.role) ? 
                                  data.role.toLowerCase().replace(' ', '_') : 'none';
                                  
                applySidebarAccessControl(userRole);
                
                const pageRequiredRoles = accessRules['Released List'] || accessRules['Reports']; 
                enforceRoleAccess(userRole, pageRequiredRoles);
            })
            .catch(error => {
                console.error('Error fetching user session:', error);
                applySidebarAccessControl('none'); 
                logUserAction('SESSION_ERROR', `Failed to fetch user session: ${error.message}`);
                alert('Session check failed. Please log in again.');
                window.location.href = 'login.html';
            });
    }


    // ====================================================================
    // 2. Selectors and Constants
    // ====================================================================
    
    const tableBody = document.getElementById('auditLogTableBody');
    const dateBox = document.getElementById('report-date');
    const totalValueSpan = document.getElementById('total-principal-value');
    const phpHandlerUrl = 'PHP/releasedloan_handler.php';
    const TOTAL_COLUMNS = 8; 

    // Navigation Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    const reportButtons = document.querySelectorAll('.reports-sidebar .report-button');

    // Filter Selectors
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    const applyFilterButton = document.getElementById('apply-filter-btn');
    
    // Export Selector (NEW)
    const exportCsvButton = document.getElementById('export-csv-btn');
    const dataTable = document.querySelector('.data-table');


    // ====================================================================
    // 3. Utility Functions
    // ====================================================================

    // Helper function to format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP',
            minimumFractionDigits: 2 
        }).format(amount);
    }
    
    // Helper function to format a Date object as YYYY-MM-DD
    function formatDateToInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // NEW: Function to export displayed table data to CSV
    function exportTableToCSV() {
        if (!dataTable) return;

        // Check if there is data or an error message (only one row with colspan)
        const rows = dataTable.querySelectorAll('#auditLogTableBody tr');
        if (rows.length === 0 || rows[0].querySelector('td')?.colSpan === TOTAL_COLUMNS) {
            alert('No data to export.');
            return;
        }

        let csv = [];
        
        // 1. Extract Headers (from <thead>)
        const headerRow = dataTable.querySelector('thead tr');
        if (headerRow) {
            const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim());
            csv.push(headers.join(','));
        }

        // 2. Extract Data Rows (from <tbody>)
        rows.forEach(row => {
            const rowData = Array.from(row.querySelectorAll('td')).map(cell => {
                let text = cell.textContent.trim();
                
                // Remove currency symbols (PHP, commas used as thousands separator)
                text = text.replace(/PHP\s?|[,]/g, ''); 
                
                // Enclose field in quotes if it contains quotes or newline
                if (text.includes('"') || text.includes('\n')) {
                    text = `"${text.replace(/"/g, '""')}"`;
                }
                return text;
            });
            
            // Only push rows that have the full number of columns (excluding error/no-data messages)
            if (rowData.length === TOTAL_COLUMNS) {
                csv.push(rowData.join(','));
            }
        });
        
        const csvString = csv.join('\n');
        
        // 3. Trigger Download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const today = new Date();
        const formattedDateForFilename = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '');
        const filename = `ReleasedLoans_${formattedDateForFilename}.csv`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        logUserAction('EXPORT_CSV', `Exported Released Loans list with filters: Start Date: ${startDateInput.value}, End Date: ${endDateInput.value}`);
    }
    
    // ====================================================================
    // 4. Main Data Fetching and Display Logic
    // ====================================================================

    async function fetchAndDisplayReleasedLoans(filters = {}) {
        tableBody.innerHTML = `<tr><td colspan="${TOTAL_COLUMNS}">Loading loan data...</td></tr>`;
        
        const urlParams = new URLSearchParams();
        if (filters.startDate) {
            urlParams.append('start_date', filters.startDate);
        }
        if (filters.endDate) {
            urlParams.append('end_date', filters.endDate);
        }
        
        const fetchUrl = `${phpHandlerUrl}?${urlParams.toString()}`;

        if (totalValueSpan) {
            totalValueSpan.textContent = formatCurrency(0);
        }

        try {
            const response = await fetch(fetchUrl); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                
                tableBody.innerHTML = '';
                let totalPrincipalReleased = 0;

                if (result.data.length === 0) {
                     tableBody.innerHTML = `<tr><td colspan="${TOTAL_COLUMNS}">No released loans found for the selected criteria.</td></tr>`;
                     return;
                }

                result.data.forEach(loan => {
                    
                    const principalAmount = parseFloat(loan.principal_amount) || 0;
                    const interestAmount = parseFloat(loan.interest_amount) || 0;
                    const totalLoanAmount = principalAmount + interestAmount; 
                    totalPrincipalReleased += principalAmount;
                    
                    const row = tableBody.insertRow();
                    row.insertCell().textContent = loan.client_ID;
                    row.insertCell().textContent = loan.loan_application_id;
                    row.insertCell().textContent = loan.client_name;
                    row.insertCell().textContent = formatCurrency(principalAmount);
                    row.insertCell().textContent = formatCurrency(interestAmount); 
                    row.insertCell().textContent = formatCurrency(totalLoanAmount); 
                    row.insertCell().textContent = formatCurrency(principalAmount); 
                    row.insertCell().textContent = loan.date_released;
                });

                if (totalValueSpan) {
                    totalValueSpan.textContent = formatCurrency(totalPrincipalReleased);
                }
                
            } else if (result.message) {
                tableBody.innerHTML = `<tr><td colspan="${TOTAL_COLUMNS}">Error: ${result.message}</td></tr>`;
            } else {
                throw new Error('Received unexpected data structure from the server.');
            }
        } catch (error) {
            console.error('Data Fetching Failed:', error);
            tableBody.innerHTML = `<tr><td colspan="${TOTAL_COLUMNS}">Error: Failed to load data. Details: ${error.message}.</td></tr>`;
        }
    }

    // ====================================================================
    // 5. Event Listeners and Initialization
    // ====================================================================

    // --- Navigation and Logout Listeners ---
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, '');
            const targetPage = urlMapping[linkText];

            if (targetPage) {
                logUserAction('NAVIGATION', `Clicked "${this.textContent}" link, redirecting to ${targetPage}`);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
                logUserAction('NAVIGATION_FAILED', `FAILED: Clicked link "${this.textContent}" with no mapped page.`);
            }
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.location.href = 'PHP/check_logout.php';
        });
    }
    
    // Report Sidebar Button Navigation Logic
    reportButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            reportButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const buttonText = this.textContent.toLowerCase().replace(/\s/g, '');
            const targetPage = reportUrlMapping[buttonText];

            if (targetPage) {
                logUserAction('NAVIGATION', `Clicked report button "${this.textContent}", redirecting to ${targetPage}`);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this report button:', buttonText);
                logUserAction('NAVIGATION_FAILED', `FAILED: Clicked report button "${this.textContent}" with no mapped page.`);
            }
        });
    });


    // *** Filter Event Listener ***
    if (applyFilterButton) {
        applyFilterButton.addEventListener('click', function() {
            window.logUserAction('FILTER_REPORT', `Applied date filters for Released Loans. Start Date: ${startDateInput.value}, End Date: ${endDateInput.value}`);
            
            const filters = {
                startDate: startDateInput.value,
                endDate: endDateInput.value
            };
            
            fetchAndDisplayReleasedLoans(filters);
        });
    }

    // *** Export CSV Event Listener (NEW) ***
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', exportTableToCSV);
    }
    
    // --- Initialization Function ---

    function initialize() {
        const today = new Date();
        const todayStr = formatDateToInput(today); 
        
        // 1. Set the default values in the date filter inputs to TODAY
        if (startDateInput) {
            startDateInput.value = todayStr;
        }
        if (endDateInput) {
            endDateInput.value = todayStr;
        }
        
        // 2. Update the date in the header to show the current date (MM/DD/YYYY)
        if (dateBox) {
            const headerDate = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            dateBox.textContent = `Date: ${headerDate}`;
        }

        // 3. Set the 'Released List' button as active
        reportButtons.forEach(btn => {
            if (btn.textContent.trim() === 'Released List') {
                btn.classList.add('active');
            } else {
                 btn.classList.remove('active');
            }
        });
        
        // 4. Call the function on initial load using TODAY's date for both filters
        const initialFilters = {
            startDate: todayStr,
            endDate: todayStr
        };
        fetchAndDisplayReleasedLoans(initialFilters);
    }
    
    // 1. Start the Session and Access Check first
    checkSessionAndRedirect();
    
    // 2. Then initialize the rest of the report logic
    initialize();
});