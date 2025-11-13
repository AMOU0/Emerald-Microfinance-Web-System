document.addEventListener('DOMContentLoaded', function() {
    // ====================================================================
    // 1. Define Access Rules (From Block 1)
    // ====================================================================
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

    // ====================================================================
    // 2. Global Logging Function (From Block 3)
    // This function is defined inside DOMContentLoaded but made global
    // ====================================================================
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

    // *** Make the logging function globally accessible ***
    window.logUserAction = logUserAction;

    // ====================================================================
    // 3. Navigation URL Mapping (From Block 3)
    // ====================================================================
    const urlMapping = {
        'dashboard': 'DashBoard.html',
        'clientcreation': 'ClientCreationForm.html',
        'loanapplication': 'LoanApplication.html',
        'pendingaccounts': 'PendingAccount.html',
        'paymentcollection': 'AccountsReceivable.html',
        'ledger': 'Ledgers.html',
        'reports': 'Reports.html',
        'tools': 'Tools.html'
    };

    // ====================================================================
    // 4. Role-Based Access Control and Session Check Helpers
    // ====================================================================

    // This function is missing in the original code, we must define it.
    // It checks the session and then applies sidebar access control.
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
                
                // Apply sidebar visibility based on role (from Block 1)
                applySidebarAccessControl(userRole);
                
                // Now, if this page requires specific roles (like 'Reports' does), 
                // we check the role against the page-specific access rule.
                // NOTE: This assumes 'Reports' page is the one calling this script
                const pageRequiredRoles = ['Admin', 'Manager', 'Loan_Officer']; // Match the 'Reports' rule for this page
                enforceRoleAccess(userRole, pageRequiredRoles);

            })
            .catch(error => {
                console.error('Error fetching user session:', error);
                // On error, hide all links for security and log the failure
                applySidebarAccessControl('none'); 
                logUserAction('SESSION_ERROR', `Failed to fetch user session: ${error.message}`);
                // You might also redirect to a login/error page here
            });
    }

    // Function to apply access control to the sidebar (From Block 1)
    function applySidebarAccessControl(userRole) {
        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');

        navLinks.forEach(link => {
            const linkName = link.textContent.trim();
            const parentListItem = link.parentElement;

            if (accessRules.hasOwnProperty(linkName)) {
                const allowedRoles = accessRules[linkName];

                if (!allowedRoles.includes(userRole)) {
                    parentListItem.style.display = 'none';
                } else {
                    parentListItem.style.display = ''; // Ensure it's visible if allowed
                }
            } else {
                console.warn(`No access rule defined for: ${linkName}`);
                // Optional: Hide undefined links
                // parentListItem.style.display = 'none';
            }
        });
    }

    // This function is missing and was called from the second original block.
    // It is used to protect the *entire page* based on the user's role.
    function enforceRoleAccess(userRole, requiredRoles) {
        // Normalize the role check to match the case in accessRules
        const normalizedRequiredRoles = requiredRoles.map(role => role.charAt(0).toUpperCase() + role.slice(1).replace('_', ''));

        if (!normalizedRequiredRoles.includes(userRole)) {
            const actionType = 'ACCESS_DENIED';
            const description = `User with role ${userRole} attempted to access restricted page. Required roles: ${requiredRoles.join(', ')}`;
            logUserAction(actionType, description);

            alert('Access Denied. You do not have the required role to view this page.');
            // Redirect to a safe page, e.g., the Dashboard
            window.location.href = urlMapping['dashboard'] || 'login.html'; 
        }
    }


    // ====================================================================
    // 5. Initialization and Event Listeners
    // ====================================================================

    // Call the combined check/access function
    checkSessionAndRedirect();

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    // Navigation Link Click Handler (From Block 3)
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            // Handle 'active' class styling
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
                const actionType = 'NAVIGATION_FAILED';
                const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });

    // Logout Button Click Handler (From Block 3)
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Logging should happen server-side in check_logout.php
            window.location.href = 'PHP/check_logout.php';
        });
    }

    // --- Cleanup/Removal of redundant code ---
    // The following global variables from the original Block 3 are not needed on this page:
    // let pendingAccountsData = []; 
    // let currentSortColumn = 'created_at';
    // let currentSortDirection = 'asc';
});




//==============================================================================================================================================


document.addEventListener('DOMContentLoaded', function() {

    // Get HTML elements using the IDs from CollectionToday.html
    const dateFromInput = document.getElementById('filter-start-date');
    const dateToInput = document.getElementById('filter-end-date');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const tableBody = document.querySelector('.data-table tbody');
    const totalValueSpan = document.querySelector('.total-value');
    const fetchUrl = 'PHP/collectiontoday_handler.php'; // Path to your PHP script

    /**
     * Helper function to get today's date in YYYY-MM-DD format
     */
    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        // getMonth() is 0-indexed, so add 1
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Fetches payment data from the PHP script based on current date inputs.
     */
    async function fetchPayments() {
        const dateFrom = dateFromInput.value;
        const dateTo = dateToInput.value;
        
        tableBody.innerHTML = '<tr><td colspan="7">Loading Payments...</td></tr>';
        
        if (!dateFrom || !dateTo) {
            alert('Please select both start and end dates.');
            tableBody.innerHTML = '<tr><td colspan="7">Select a date range to load payments.</td></tr>';
            return;
        }

        // Construct the query string from the input values
        const params = new URLSearchParams({
            date_from: dateFrom,
            date_to: dateTo
        });
        
        try {
            const response = await fetch(`${fetchUrl}?${params.toString()}`);
            const result = await response.json();
            
            if (result.success) {
                populateTable(result.data);
            } else {
                console.error("Error from server:", result.message);
                tableBody.innerHTML = `<tr><td colspan="7">Error loading data: ${result.message}</td></tr>`;
                totalValueSpan.textContent = 'PHP 0.00';
            }

        } catch (error) {
            console.error('Fetch error:', error);
            tableBody.innerHTML = '<tr><td colspan="7">Failed to connect to the payment API or JSON parsing failed.</td></tr>';
            totalValueSpan.textContent = 'PHP 0.00';
        }
    }

    /**
     * Renders the payment data into the HTML table and calculates the total.
     * @param {Array} payments - The array of payment objects.
     */
    function populateTable(payments) {
        tableBody.innerHTML = ''; // Clear existing rows
        let totalCollection = 0;
        
        if (payments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No payments found for the selected date range.</td></tr>';
        } else {
            payments.forEach(payment => {
                const row = tableBody.insertRow();
                
                // Format the date for display
                const paymentDate = new Date(payment.date_payed).toLocaleString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const amount = Number(payment.payment_amount); 
                totalCollection += amount;

                row.innerHTML = `
                    <td>${payment.client_id}</td>
                    <td>${payment.loan_id}</td>
                    <td>${payment.client_name || 'N/A'}</td> <td>${amount.toFixed(2)}</td>
                    <td>${Number(payment.balance_after_payment).toFixed(2)}</td>
                    <td>${paymentDate}</td>
                    <td>${payment.processby}</td>
                `;
            });
        }
        
        // Update the total collection value
        totalValueSpan.textContent = `PHP ${totalCollection.toFixed(2)}`;
    }

    // --- Initial Load and Event Listeners ---
    
    // 1. Set default dates to TODAY for both start and end
    const todayString = getTodayDateString();
    dateFromInput.value = todayString;
    dateToInput.value = todayString;
    
    // 2. Load data for TODAY on page load
    fetchPayments();

    // 3. Load data when the "Apply Filters" button is clicked
    applyFilterBtn.addEventListener('click', fetchPayments);
});

/**
 * JS/collectiontoday_function.js
 * Handles fetching, filtering, rendering, and exporting payment collection data.
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const filterStartDateInput = document.getElementById('filter-start-date');
    const filterEndDateInput = document.getElementById('filter-end-date');
    const applyFilterButton = document.getElementById('apply-filter-btn');
    const exportCsvButton = document.getElementById('export-csv-btn');
    const tableBody = document.querySelector('.data-table tbody');
    const totalCollectionSpan = document.querySelector('.total-value');
    const dateRangeHeader = document.getElementById('current-date-range');
    
    // Store the fetched data globally for CSV export
    let currentPaymentsData = [];

    // --- Helper Functions ---

    /**
     * Formats a Date object into 'YYYY-MM-DD' string for input fields.
     * @param {Date} date - The date object.
     * @returns {string} The formatted date string.
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
        // Format to a more readable display format (e.g., MM/DD/YYYY)
        const formatDisplayDate = (dateStr) => {
            const [year, month, day] = dateStr.split('-');
            return `${month}/${day}/${year}`;
        };

        const displayFrom = formatDisplayDate(dateFrom);
        const displayTo = formatDisplayDate(dateTo);
        
        if (dateFrom === dateTo) {
            dateRangeHeader.textContent = displayFrom;
        } else {
            dateRangeHeader.textContent = `${displayFrom} - ${displayTo}`;
        }
    }

    /**
     * Renders the fetched payment data into the table and calculates the total.
     * @param {Array<Object>} payments - The array of payment records.
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

            // Extract payment amount and calculate total
            const amountPaid = parseFloat(payment.payment_amount) || 0;
            totalCollection += amountPaid;

            // Prepare values for display
            const paymentDateOnly = payment.date_payed ? payment.date_payed.split(' ')[0] : '';
            const formattedPayment = amountPaid.toFixed(2);
            // Assuming balance_after_payment is sent as a string like '0.00'
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

        // Update the total collection display
        totalCollectionSpan.textContent = `PHP ${totalCollection.toFixed(2)}`;
    }


    /**
     * Fetches collection data from the PHP handler and updates the UI.
     * @param {string} dateFrom - Start date for the filter (YYYY-MM-DD).
     * @param {string} dateTo - End date for the filter (YYYY-MM-DD).
     */
    async function fetchCollectionData(dateFrom, dateTo) {
        // Validation (can be more robust)
        if (new Date(dateFrom) > new Date(dateTo)) {
            alert('Start date cannot be after end date.');
            return;
        }

        // Display loading state
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
                updateDateHeader(dateFrom, dateTo); // Update header after successful fetch
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

    /**
     * Handles the 'Apply Filters' button click.
     */
    function handleApplyFilter() {
        const dateFrom = filterStartDateInput.value;
        const dateTo = filterEndDateInput.value;

        if (dateFrom && dateTo) {
            fetchCollectionData(dateFrom, dateTo);
        } else {
            // Use a custom modal or message box instead of alert in production apps
            console.warn('Please select both a start date and an end date.'); 
        }
    }

    /**
     * Handles the 'Export CSV' button click.
     */
    function handleExportCSV() {
        if (currentPaymentsData.length === 0) {
            // Use a custom message box instead of alert
            console.warn('No data to export.');
            return;
        }

        // 1. Define CSV Header (matching table columns)
        const headers = [
            "Client ID", "Loan ID", "Name", "Payment", 
            "Balance", "Payment Date", "Processed By"
        ];

        // 2. Map data rows to CSV format
        const rows = currentPaymentsData.map(p => {
            const paymentAmount = parseFloat(p.payment_amount).toFixed(2);
            const balanceAmount = parseFloat(p.balance_after_payment).toFixed(2);
            const dateOnly = p.date_payed ? p.date_payed.split(' ')[0] : '';
            
            // Return an array of values in the correct order
            return [
                p.client_id,
                p.loan_id,
                `"${p.client_name.replace(/"/g, '""')}"`, // Handle names with commas/quotes
                paymentAmount,
                balanceAmount,
                dateOnly,
                p.processby
            ].join(','); // Join column values with a comma
        });
        
        // 3. Combine header and rows
        const csvContent = [
            headers.join(','), // First line is the header
            ...rows           // Followed by all data rows
        ].join('\n'); // Join lines with a newline

        // 4. Trigger file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const today = formatDate(new Date());
        const filename = `Collection_Report_${today}.csv`;
        
        // Create temporary link element
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Initialization ---

    /**
     * Sets the default filter date range to today's date and loads the initial data.
     */
    function initialize() {
        const today = new Date();
        const todayStr = formatDate(today);
        
        // Set both filter inputs to today's date for initial load
        filterStartDateInput.value = todayStr; 
        filterEndDateInput.value = todayStr;

        // Attach event listeners
        applyFilterButton.addEventListener('click', handleApplyFilter);
        exportCsvButton.addEventListener('click', handleExportCSV);

        // Fetch data immediately on page load for 'Collection Today' view
        fetchCollectionData(todayStr, todayStr);
    }
    
    // Start the application logic
    initialize();
});


// JS/collectiontoday_function.js

document.addEventListener('DOMContentLoaded', () => {
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const dataTable = document.querySelector('.data-table');

    // Function to escape string for CSV (handling commas, quotes, and newlines)
    const csvEscape = (value) => {
        if (value === null || value === undefined) {
            return '';
        }
        let stringValue = String(value).trim();
        // If the value contains a comma, double-quote, or newline, enclose it in double quotes.
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            // Escape double quotes by doubling them
            stringValue = stringValue.replace(/"/g, '""');
            return `"${stringValue}"`;
        }
        return stringValue;
    };

    const exportTableToCSV = () => {
        const rows = dataTable.querySelectorAll('tr');
        if (rows.length === 0) {
            alert('No data to export.');
            return;
        }

        let csvContent = [];
        
        // 1. Get Headers
        const headerRow = dataTable.querySelector('thead tr');
        if (headerRow) {
            const headers = Array.from(headerRow.querySelectorAll('th'))
                                 .map(th => csvEscape(th.textContent.trim()))
                                 .join(',');
            csvContent.push(headers);
        }

        // 2. Get Data Rows
        const dataRows = dataTable.querySelectorAll('tbody tr');
        dataRows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td'))
                               .map(td => csvEscape(td.textContent.trim()))
                               .join(',');
            csvContent.push(cells);
        });

        // Combine all rows with a newline character
        const csvString = csvContent.join('\n');

        // 3. Create a Blob and trigger Download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        // Set a filename using the current date
        const date = new Date().toISOString().slice(0, 10);
        a.download = `Emerald_Collection_Today_${date}.csv`;
        
        // Append to the body, click it, and remove it
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the object URL
    };

    // Attach the event listener to the "Export CSV" button
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportTableToCSV);
    }
});

//=========================================================================================================






