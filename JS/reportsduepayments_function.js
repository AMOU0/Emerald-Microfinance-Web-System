document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect();

    // --- Global Logging Function (Now LOCAL and ACCESSIBLE) ---
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
    // --------------------------------------------------------

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    const reportButtons = document.querySelectorAll('.report-button');

    // New constants for report elements
    const applyFilterButton = document.querySelector('.apply-filter-button');
    const exportButton = document.querySelector('.export-button'); // Added for CSV Export
    const tableBody = document.querySelector('.report-table-container table');
    const statusFilterElement = document.getElementById('filter-action'); // Get the new filter element

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
        'overduepayments': 'ReportsOverduePayments.html',
        'delinquentaccounts': 'ReportsOverduePayments.html',
        'audittrail': 'ReportsAuditTrail.html'
    };

    // --- UTILITY FUNCTION ---
    function updateSummaryCards(summary) {
        document.querySelector('.summary-cards .total-due p').textContent = `₱ ${summary.totalDueToday.toFixed(2)}`;
        document.querySelector('.summary-cards .accounts-due p').textContent = summary.accountsDueToday;
        document.querySelector('.summary-cards .total-overdue p').textContent = `₱ ${summary.totalOverdueAmount.toFixed(2)}`;
    }

    // --- CSV EXPORT FUNCTION ---
    function exportToCSV() {
        const table = document.querySelector('.report-table-container table');
        let csv = [];
        const rows = table.querySelectorAll('tr');

        if (rows.length <= 1) {
            alert('No data to export.');
            return;
        }

        // Extract header row
        const headerCells = rows[0].querySelectorAll('th');
        let header = [];
        headerCells.forEach(cell => {
            // Remove Peso sign and replace spaces with underscores for clean header
            header.push(cell.textContent.trim().replace('₱', '').replace(/\s+/g, '_'));
        });
        csv.push(header.join(','));

        // Extract data rows
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');

            // Skip "No payments found" row
            if (cells.length === 1 && cells[0].textContent.includes('No payments found')) {
                continue;
            }

            let rowData = [];
            cells.forEach((cell, index) => {
                let cellText = cell.textContent.trim();
                // Clean up currency signs and status spans
                if (index >= 4 && index <= 6) { // Principal, Interest, Total Payment Due columns
                    cellText = cellText.replace('₱', '').trim();
                } else if (index === 7) { // Status column
                    const statusSpan = cell.querySelector('.status');
                    cellText = statusSpan ? statusSpan.textContent.trim() : cellText;
                }
                
                // Escape commas and wrap in quotes if necessary
                if (cellText.includes(',')) {
                    cellText = `"${cellText.replace(/"/g, '""')}"`;
                }
                rowData.push(cellText);
            });
            csv.push(rowData.join(','));
        }

        // Create a blob and trigger download
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
    function fetchAndDisplayDuePayments(filterDate = null, filterStatus = null) {
        // 1. Pass ONLY the date filter to PHP. PHP returns all active loans (Upcoming, Due Today, Overdue).
        let url = 'PHP/reportsduedate_handler.php';
        if (filterDate) {
            url += `?filter_date=${filterDate}`;
        }

        // Clear old table content
        const existingTbody = tableBody.querySelector('tbody');
        if (existingTbody) {
            existingTbody.remove();
        }

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                let allPayments = data.data || [];

                // 2. CLIENT-SIDE STATUS FILTERING
                let filteredPayments = allPayments;
                if (filterStatus && filterStatus !== "") {
                    filteredPayments = allPayments.filter(item => item.status === filterStatus);

                    // Note: Since allPayments is filtered, the summary cards will only show
                    // totals for the currently displayed payments.
                }

                // 3. RECALCULATE SUMMARY FOR THE FILTERED DATA
                let totalDueToday = 0.00;
                let accountsDueToday = 0;
                let totalOverdueAmount = 0.00;

                // Calculate summary totals ONLY from the filtered data
                filteredPayments.forEach(item => {
                    if (item.status === 'Due Today') {
                        totalDueToday += item.total_payment_due;
                        accountsDueToday++;
                    } else if (item.status === 'Overdue') {
                        totalOverdueAmount += item.total_payment_due;
                    }
                    // 'Upcoming' status is not included in these specific totals.
                });

                const summary = {
                    totalDueToday: totalDueToday,
                    accountsDueToday: accountsDueToday,
                    totalOverdueAmount: totalOverdueAmount
                };

                updateSummaryCards(summary);

                // 4. RENDER TABLE
                if (filteredPayments.length === 0) {
                    const noDataHTML = `<tbody><tr><td colspan="8">No payments found matching the filters.</td></tr></tbody>`;
                    tableBody.insertAdjacentHTML('beforeend', noDataHTML);
                    logUserAction('VIEW', 'Loaded Due Payments Report with 0 records.');
                    return;
                }

                let tableHTML = '<tbody>';
                filteredPayments.forEach(item => {
                    const statusClass = item.status.toLowerCase().replace(/\s/g, '-');
                    tableHTML += `
                        <tr>
                            <td>${item.client_name}</td>
                            <td>${item.contact_number}</td>
                            <td>${item.loan_id}</td>
                            <td>${item.due_date}</td>
                            <td>₱ ${item.principal_due.toFixed(2)}</td>
                            <td>₱ ${item.interest_due.toFixed(2)}</td>
                            <td>₱ ${item.total_payment_due.toFixed(2)}</td>
                            <td><span class="status ${statusClass}">${item.status}</span></td>
                        </tr>
                    `;
                });
                tableHTML += '</tbody>';

                tableBody.insertAdjacentHTML('beforeend', tableHTML);

                logUserAction('VIEW', `Successfully loaded Due Payments Report with ${filteredPayments.length} records.`);
            })
            .catch(error => {
                console.error('Error fetching due payments:', error);
                const errorHTML = '<tbody><tr><td colspan="8">Error loading report data. Check console for details.</td></tr></tbody>';
                tableBody.insertAdjacentHTML('beforeend', errorHTML);
                logUserAction('ERROR', `Failed to load Due Payments Report: ${error.message}`);
            });
    }

    // --- EVENT HANDLERS ---

    // Primary Navigation Handler (kept for completeness)
    navLinks.forEach(link => {
      // ... (Your existing navigation logic here) ...
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
        // ... (Your existing report button logic here) ...
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

    // Apply Filter Button Event Listener - UPDATED TO INCLUDE STATUS FILTER
    if (applyFilterButton) {
        applyFilterButton.addEventListener('click', function() {
            const dueDate = document.getElementById('due-date-filter').value;
            const statusFilter = statusFilterElement.value; // Get the new filter value

            if (dueDate || statusFilter) {
                logUserAction('VIEW', `Applied filters: Date=${dueDate || 'None'}, Status=${statusFilter || 'All'}`);
                fetchAndDisplayDuePayments(dueDate, statusFilter);
            } else {
                logUserAction('VIEW', `Cleared all filters.`);
                fetchAndDisplayDuePayments(null, null);
            }
        });
    }
    
    // Export Button Event Listener - NEW
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }

    // Logout Button Handler (kept for completeness)
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        logUserAction('LOGOUT', 'User logged out.');
        window.location.href = 'PHP/check_logout.php';
      });
    }

    // --- INITIALIZATION ---
    fetchAndDisplayDuePayments();
});