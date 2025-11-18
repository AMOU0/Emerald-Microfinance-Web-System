document.addEventListener('DOMContentLoaded', function() {
    // ====================================================================
    // 1. ACCESS CONTROL AND NAVIGATION LOGIC
    // ====================================================================
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
        
        // Report Sidebar Buttons access rules (New additions)
        'Existing Clients': ['Admin', 'Manager', 'Loan_Officer'],
        'Released List': ['Admin', 'Manager', 'Loan_Officer'],
        'Collection List': ['Admin', 'Manager', 'Loan_Officer'],
        'Overdue': ['Admin', 'Manager', 'Loan_Officer'],
        'Due Payments': ['Admin', 'Manager'],
        'Audit Trail': ['Admin']
    };

    // Global Logging Function
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
    window.logUserAction = logUserAction; // Make global

    const urlMapping = {
        'dashboard': 'DashBoard.html',
        'clientcreation': 'ClientCreationForm.html',
        'loanapplication': 'LoanApplication.html',
        'pendingaccounts': 'PendingAccount.html',
        'forrelease': 'ReportsRelease.html',
        'paymentcollection': 'AccountsReceivable.html',
        'ledger': 'Ledgers.html',
        'reports': 'Reports.html',
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

    function applySidebarAccessControl(userRole) {
        // Apply control to Main Navigation Links
        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');
        navLinks.forEach(link => {
            const linkText = link.textContent.trim();
            const parentListItem = link.parentElement;
            if (accessRules.hasOwnProperty(linkText)) {
                const allowedRoles = accessRules[linkText].map(role => role.toUpperCase());
                const userRoleUpper = userRole.toUpperCase();
                parentListItem.style.display = allowedRoles.includes(userRoleUpper) ? '' : 'none';
            } else {
                console.warn(`No access rule defined for main nav link: ${linkText}`);
            }
        });
        
        // Apply control to Report Sidebar Buttons
        const reportButtons = document.querySelectorAll('.reports-sidebar .report-button');
        reportButtons.forEach(button => {
            const buttonText = button.textContent.trim();
            if (accessRules.hasOwnProperty(buttonText)) {
                const allowedRoles = accessRules[buttonText].map(role => role.toUpperCase());
                const userRoleUpper = userRole.toUpperCase();
                button.style.display = allowedRoles.includes(userRoleUpper) ? 'block' : 'none';
            } else {
                // If a button has an ID matching a key in reportUrlMapping, use that key
                const buttonKey = buttonText.toLowerCase().replace(/\s/g, ''); 
                if (reportUrlMapping.hasOwnProperty(buttonKey)) {
                    // Check against 'Reports' main rule if individual rule is missing
                    const mainReportRoles = accessRules['Reports'].map(role => role.toUpperCase());
                    const userRoleUpper = userRole.toUpperCase();
                     button.style.display = mainReportRoles.includes(userRoleUpper) ? 'block' : 'none';
                } else {
                    console.warn(`No access rule defined for report button: ${buttonText}`);
                }
            }
        });
    }

    function enforceRoleAccess(userRole, requiredRoles) {
        const normalizedRequiredRoles = requiredRoles.map(role => role.charAt(0).toUpperCase() + role.slice(1).replace('_', ''));
        const userRoleCapitalized = userRole.charAt(0).toUpperCase() + userRole.slice(1);
        
        if (!normalizedRequiredRoles.includes(userRoleCapitalized)) {
            const description = `User with role ${userRole} attempted to access restricted page. Required roles: ${requiredRoles.join(', ')}`;
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
                const userRole = (data.status === 'active' && data.role) ? data.role : 'none';
                applySidebarAccessControl(userRole);
                
                // Enforce role for this specific report page (which is 'Collection List')
                const pageRequiredRoles = accessRules['Collection List'] || accessRules['Reports']; 
                enforceRoleAccess(userRole, pageRequiredRoles);
            })
            .catch(error => {
                console.error('Error fetching user session:', error);
                applySidebarAccessControl('none'); 
                logUserAction('SESSION_ERROR', `Failed to fetch user session: ${error.message}`);
            });
    }

    // Initialize access control
    checkSessionAndRedirect(); 

    // Navigation and Logout Listeners
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

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
    const reportButtons = document.querySelectorAll('.report-button');
    reportButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Remove 'active' from all report buttons
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


    // ====================================================================
    // 2. COLLECTION DATA LOGIC (Filter, Fetch, Render, Export)
    // ====================================================================

    // DOM Elements
    const filterStartDateInput = document.getElementById('filter-start-date');
    const filterEndDateInput = document.getElementById('filter-end-date');
    const applyFilterButton = document.getElementById('apply-filter-btn');
    const exportCsvButton = document.getElementById('export-csv-btn');
    const tableBody = document.querySelector('.data-table tbody');
    const totalCollectionSpan = document.querySelector('.total-value');
    const dateRangeHeader = document.getElementById('current-date-range');
    
    let currentPaymentsData = []; // Store the fetched data globally for CSV export

    // --- Helper Functions ---

    /**
     * Formats a Date object into 'YYYY-MM-DD' string for input fields.
     */
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Updates the header to display the currently filtered date range.
     */
    function updateDateHeader(dateFrom, dateTo) {
        const formatDisplayDate = (dateStr) => {
            const [year, month, day] = dateStr.split('-');
            return `${month}/${day}/${year}`;
        };

        const displayFrom = formatDisplayDate(dateFrom);
        const displayTo = formatDisplayDate(dateTo);
        
        if (dateRangeHeader) { 
            if (dateFrom === dateTo) {
                dateRangeHeader.textContent = displayFrom;
            } else {
                dateRangeHeader.textContent = `${displayFrom} - ${displayTo}`;
            }
        }
    }

    /**
     * Renders the fetched payment data into the table and calculates the total.
     */
    function renderTableData(payments) {
        currentPaymentsData = payments; // Store for export
        tableBody.innerHTML = ''; // Clear existing data
        let totalCollection = 0;

        if (payments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 16px;">No collections found for the selected date range.</td></tr>';
            totalCollectionSpan.textContent = 'PHP 0.00';
            return;
        }

        payments.forEach(payment => {
            const row = tableBody.insertRow();
            const amountPaid = parseFloat(payment.payment_amount) || 0;
            totalCollection += amountPaid;

            const paymentDateOnly = payment.date_payed ? payment.date_payed.split(' ')[0] : ''; 
            const formattedPayment = amountPaid.toFixed(2);
            const formattedBalance = parseFloat(payment.balance_after_payment).toFixed(2); 

            // Populate the row cells
            row.insertCell().textContent = payment.client_id;
            row.insertCell().textContent = payment.loan_id;
            row.insertCell().textContent = payment.client_name;
            row.insertCell().textContent = `PHP ${formattedPayment}`;
            row.insertCell().textContent = `PHP ${formattedBalance}`;
            row.insertCell().textContent = paymentDateOnly;
            row.insertCell().textContent = payment.processby;
        });

        totalCollectionSpan.textContent = `PHP ${totalCollection.toFixed(2)}`;
    }


    /**
     * Fetches collection data from the PHP handler and updates the UI.
     */
    async function fetchCollectionData(dateFrom, dateTo) {
        if (new Date(dateFrom) > new Date(dateTo)) {
            alert('Start date cannot be after end date.');
            return;
        }

        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 16px;">Fetching data...</td></tr>';
        totalCollectionSpan.textContent = 'PHP 0.00'; 
        
        const url = `PHP/collectiontoday_handler.php?date_from=${dateFrom}&date_to=${dateTo}`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                renderTableData(result.data);
                updateDateHeader(dateFrom, dateTo);
            } else {
                console.error('Server reported failure:', result.message);
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red; padding: 16px;">Error: ${result.message || 'Failed to fetch data.'}</td></tr>`;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red; padding: 16px;">Network Error or Server Issue: ${error.message}</td></tr>`;
        }
    }

    // --- Event Handlers ---

    function handleApplyFilter() {
        const dateFrom = filterStartDateInput.value;
        const dateTo = filterEndDateInput.value;

        if (dateFrom && dateTo) {
            fetchCollectionData(dateFrom, dateTo);
        } else {
            alert('Please select both a start date and an end date.'); 
        }
    }

    function handleExportCSV() {
        if (currentPaymentsData.length === 0) {
            alert('No data to export.');
            return;
        }

        const headers = [
            "Client ID", "Loan ID", "Name", "Payment", 
            "Balance", "Payment Date", "Processed By"
        ];

        // Function to handle names with commas/quotes for CSV
        const csvEscape = (value) => {
            if (value === null || value === undefined) return '';
            let stringValue = String(value).trim();
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                stringValue = stringValue.replace(/"/g, '""');
                return `"${stringValue}"`;
            }
            return stringValue;
        };

        const rows = currentPaymentsData.map(p => {
            const paymentAmount = parseFloat(p.payment_amount).toFixed(2);
            const balanceAmount = parseFloat(p.balance_after_payment).toFixed(2);
            const dateOnly = p.date_payed ? p.date_payed.split(' ')[0] : '';
            
            return [
                csvEscape(p.client_id),
                csvEscape(p.loan_id),
                csvEscape(p.client_name), 
                paymentAmount, 
                balanceAmount,
                dateOnly,
                csvEscape(p.processby)
            ].join(',');
        });
        
        const csvContent = [
            headers.join(','), 
            ...rows           
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const today = formatDate(new Date());
        const filename = `Collection_Report_${today}.csv`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // --- Initialization ---

    function initialize() {
        const today = new Date();
        const todayStr = formatDate(today);
        
        // Set filter inputs to today's date for initial load
        if (filterStartDateInput) filterStartDateInput.value = todayStr; 
        if (filterEndDateInput) filterEndDateInput.value = todayStr;

        // Attach event listeners
        if (applyFilterButton) applyFilterButton.addEventListener('click', handleApplyFilter);
        if (exportCsvButton) exportCsvButton.addEventListener('click', handleExportCSV);

        // Fetch data immediately on page load
        if (filterStartDateInput && filterEndDateInput) {
            fetchCollectionData(todayStr, todayStr);
        }
        
        // Set the current report button as active on load for this specific page
        document.querySelectorAll('.reports-sidebar .report-button').forEach(btn => {
            if (btn.textContent.trim() === 'Collection List') {
                btn.classList.add('active');
            }
        });
    }
    
    // Start the collection data application logic
    initialize();
});