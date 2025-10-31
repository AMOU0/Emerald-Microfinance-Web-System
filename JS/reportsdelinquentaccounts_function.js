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
        'For Release': ['admin', 'manager', 'loan_officer']
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
            enforceRoleAccess(['admin','Manager','Loan_Officer']); 
        });
/*=============================================================================*/

document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    // --- Global Logging Function (Updated to accept two parameters) ---
    function logUserAction(actionType, description) {
      // Note: The PHP script (PHP/log_action.php) must be updated 
      // to handle both 'action' (the type) and 'description' (the detail).
      
      // Use URLSearchParams to easily format the POST body
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
    const reportButtons = document.querySelectorAll('.report-button'); // Added for report handlers

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
        'forrelease': 'ReportsRelease.html', 
    };

    // --- Primary Navigation Handler (e.g., Dashboard, Reports) ---
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
          const actionType = 'NAVIGATION'; 
          const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

          // 2. ASYNCHRONOUS AUDIT LOG: Log the action.
          logUserAction(actionType, description);

          // 3. Perform the page redirect immediately after initiating the log.
          window.location.href = targetPage;
        } else {
          console.error('No page defined for this link:', linkText);
          
          // Log the failed navigation attempt
          const actionType = 'NAVIGATION'; // Used a specific failed type
          const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
          logUserAction(actionType, description);
        }
      });
    });

    // --- Reports Sidebar Navigation Handler (Modified to use logUserAction) ---
    reportButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            const buttonText = this.textContent.toLowerCase().replace(/\s/g, '');
            const targetPage = reportUrlMapping[buttonText];

            if (targetPage) {
                // 1. Define clear action type and description for the log
                const actionType = 'VIEW'; // Use a specific type for reports
                const description = `Viewed Report: ${this.textContent} (${targetPage})`;

                // 2. ASYNCHRONOUS AUDIT LOG: Log the action using the reusable function.
                logUserAction(actionType, description);
                
                // 3. Perform the page redirect immediately after initiating the log.
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this report button:', buttonText);

                // Log the failed navigation attempt
                const actionType = 'VIEW'; 
                const description = `FAILED: Clicked report button "${this.textContent}" with no mapped page.`;
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
/*====================================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const PHP_FETCH_ENDPOINT = 'PHP/reportsdelinquentaccounts_handler.php'; 
    const PAYMENT_COLLECTION_PAGE_BASE = 'AccountsReceivableSelect.html'; 

    // --- DOM Elements ---
    const totalDelinquentAccountsEl = document.querySelector('.kpi-box.red .kpi-value'); // Should display Delinquent Count
    const totalDueAmountEl = document.querySelector('.kpi-box:not(.red) .kpi-value'); // Should display Total Past Due Amount
    const dataTableBody = document.querySelector('.delinquent-table tbody');
    const exportBtn = document.querySelector('.export-btn');

    // --- UTILITY/HELPER FUNCTIONS ---

    /**
     * Resets a date's time to midnight (00:00:00) for consistent comparison.
     * @param {Date} date 
     * @returns {Date}
     */
    function resetTimeToMidnight(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    
    // -------------------------------------------------------------------------
    // --- CORE CALCULATION LOGIC ---
    // -------------------------------------------------------------------------

    /**
     * Calculates the number of payments due between the start date and today based on frequency.
     * Corrected to use date arithmetic for better accuracy and stop at the actual number of installments (maxIterations) 
     * which should be calculated from loan duration, not an arbitrary 10 years.
     */
    function calculateExpectedPaymentsDue(startDateString, frequency, today) {
        const startDate = resetTimeToMidnight(startDateString);
        const todayMidnight = resetTimeToMidnight(today);

        if (startDate > todayMidnight) {
            return 0;
        }

        let count = 0;
        let currentDate = new Date(startDate);
        
        // Loop up to 500 payments max to prevent infinite loops (arbitrary safety limit)
        const maxIterations = 500; 
        let iteration = 0;
        
        const freqLower = frequency.toLowerCase();
        
        // Start counting from the first scheduled payment date (startDate is assumed to be the first payment date)
        while (currentDate <= todayMidnight && iteration < maxIterations) {
            count++;
            iteration++;
            
            // Advance the date based on frequency
            if (freqLower.includes('weekly')) {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (freqLower.includes('monthly')) {
                // Use setMonth to correctly handle month boundaries (e.g., Jan 31 -> Feb 28/29)
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (freqLower.includes('daily')) {
                currentDate.setDate(currentDate.getDate() + 1);
            } else {
                // Default to Monthly if frequency is unknown
                currentDate.setMonth(currentDate.getMonth() + 1); 
            }
            
            // Re-normalize time after date manipulation
            currentDate = resetTimeToMidnight(currentDate); 
        }
        
        return count; 
    }
    
    /**
     * Calculates the required installment amount for the loan.
     * Refined installment calculation to be more accurate based on the provided parameters.
     */
    function calculateAmortizationDetails(principal_amount, interest_rate, date_start, date_end, payment_frequency) {
        const principal = parseFloat(principal_amount);
        const rate = parseFloat(interest_rate);
        
        // Use time difference for more accurate duration calculation
        const durationMs = new Date(date_end) - new Date(date_start);
        const totalDurationDays = durationMs / (1000 * 3600 * 24);
        
        // This is a Simple Interest calculation, assuming the rate is Annual Percentage Rate (APR)
        const totalInterest = principal * (rate / 100) * (totalDurationDays / 365.25);
        const totalLoanAmount = principal + totalInterest;
        
        let totalInstallments = 0;
        const freqLower = payment_frequency.toLowerCase();
        
        if (totalDurationDays < 1) { // Handle very short loans, or invalid dates
             totalInstallments = 1;
        } else if (freqLower.includes('weekly')) {
            totalInstallments = Math.round(totalDurationDays / 7);
            // Ensure at least 1 installment if loan is active
            if (totalInstallments < 1) totalInstallments = 1;
        } else if (freqLower.includes('monthly')) {
            const durationMonths = totalDurationDays / 30.4375; // Average days in a month
            totalInstallments = Math.round(durationMonths);
            if (totalInstallments < 1) totalInstallments = 1;
        } else if (freqLower.includes('daily')) {
            totalInstallments = Math.round(totalDurationDays);
        } else {
            totalInstallments = 1; // Default to single payment if frequency is unknown
        }

        const installmentAmount = totalInstallments > 0 ? totalLoanAmount / totalInstallments : totalLoanAmount;

        return { installment_amount: installmentAmount };
    }


    /**
     * Filters loans for delinquency by comparing expected total payments vs. actual total payments.
     */
    function calculateDelinquency(loans) {
        const today = new Date();
        const todayMidnight = resetTimeToMidnight(today); 
        
        const delinquentLoans = [];
        let totalDueAmount = 0;

        loans.forEach(loan => {
            // Ignore loans where the principal_amount or date_start are invalid/missing
            if (!loan.principal_amount || !loan.date_start || !loan.date_end) {
                console.warn(`Skipping loan ${loan.loan_ID} due to missing data.`);
                return;
            }
            
            const totalPaid = parseFloat(loan.total_amount_paid) || 0; // Default to 0 if null/invalid
            
            // Calculate amortization and installment amount
            const amortization = calculateAmortizationDetails(
                loan.principal_amount, loan.interest_rate, loan.date_start, loan.date_end, loan.payment_frequency
            );
            
            // Get count of all installments that should have been paid by today
            const paymentsDueCount = calculateExpectedPaymentsDue(
                loan.date_start, loan.payment_frequency, todayMidnight
            );
            
            // Calculate total amount that should have been paid
            const expectedAmountDue = paymentsDueCount * amortization.installment_amount;
            
            // Delinquency = Expected Due - Actual Paid
            const delinquencyAmount = expectedAmountDue - totalPaid;
            
            // Flag as delinquent if the amount past due is greater than a small tolerance (to avoid floating point errors)
            if (delinquencyAmount > 0.05) { 
                delinquentLoans.push({
                    client_ID: loan.client_ID,
                    clientName: `${loan.first_name} ${loan.last_name}`,
                    loan_ID: loan.loan_ID,
                    amount_due: delinquencyAmount // The total past due amount
                });
                totalDueAmount += delinquencyAmount;
            }
        });

        return {
            totalDelinquentAccounts: delinquentLoans.length,
            totalDueAmount: totalDueAmount,
            delinquentAccounts: delinquentLoans.sort((a, b) => b.amount_due - a.amount_due)
        };
    }

    // -------------------------------------------------------------------------
    // --- RENDERING AND FETCHING FUNCTIONS (Unchanged, but included for completeness) ---
    // -------------------------------------------------------------------------

    function collectPayment(clientID, loanID) {
        window.location.href = `${PAYMENT_COLLECTION_PAGE_BASE}?clientID=${clientID}&loanID=${loanID}`;
    }

    function renderReport(calculatedData) {
        // 1. Update KPI Boxes
        totalDelinquentAccountsEl.textContent = calculatedData.totalDelinquentAccounts;
        const formatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });
        totalDueAmountEl.textContent = formatter.format(calculatedData.totalDueAmount).replace('PHP', '₱'); 

        // 2. Clear and Populate Table
        dataTableBody.innerHTML = '';
        
        if (calculatedData.delinquentAccounts.length === 0) {
            const row = dataTableBody.insertRow();
            row.innerHTML = `<td colspan="4" class="no-data">No delinquent accounts found.</td>`;
            return;
        }

        calculatedData.delinquentAccounts.forEach(account => {
            const row = dataTableBody.insertRow();
            
            if (account.amount_due >= 1000) {
                row.classList.add('high-risk');
            }

            const formattedAmount = formatter.format(account.amount_due).replace('PHP', '₱');
            
            row.innerHTML = `
                <td>${account.client_ID} / ${account.clientName}</td>
                <td>${account.loan_ID}</td>
                <td class="past-due-amount">${formattedAmount}</td>
                <td><button class="action-btn" 
                                data-client-id="${account.client_ID}" 
                                data-loan-id="${account.loan_ID}">Collect Payment</button></td>
            `;

            row.querySelector('.action-btn').addEventListener('click', (e) => {
                const clientID = e.target.dataset.clientId;
                const loanID = e.target.dataset.loanId;
                collectPayment(clientID, loanID);
            });
        });
    }

    async function fetchDelinquentAccounts() {
        try {
            const response = await fetch(PHP_FETCH_ENDPOINT);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server Response Text (for diagnosis):", errorText);
                throw new Error(`HTTP error! status: ${response.status}. Check PHP file path/name, and database credentials.`);
            }

            const data = await response.json();

            if (data.success && data.loans) {
                const calculatedData = calculateDelinquency(data.loans); 
                renderReport(calculatedData);
            } else if (data.success && data.loans.length === 0) {
                 // Handle successful fetch with no loans to process (render empty report)
                renderReport({ totalDelinquentAccounts: 0, totalDueAmount: 0, delinquentAccounts: [] });
            }
             else {
                console.error("Backend error:", data.message || "Unknown error occurred.");
                alert(`Error loading report data: ${data.message || "Unknown error"}`);
            }

        } catch (error) {
            console.error("Fetch error:", error);
            alert(`Failed to connect or fetch data. Error: ${error.message}`);
        }
    }
    
    function handleExportToCSV() {
        const table = document.querySelector('.delinquent-table');
        let csv = [];
        
        const headers = Array.from(table.querySelectorAll('thead th:not(:last-child)')).map(th => th.textContent);
        csv.push(headers.join(','));

        table.querySelectorAll('tbody tr').forEach(row => {
            if (row.querySelector('.no-data')) return; 

            const rowData = Array.from(row.querySelectorAll('td:not(:last-child)')).map(td => {
                let text = td.textContent.trim();
                text = text.replace(/₱\s?/, '').replace(/,/g, '').trim(); 
                return text.includes(',') ? `"${text}"` : text;
            });
            csv.push(rowData.join(','));
        });

        const csvFile = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const downloadLink = document.createElement("a");
        const today = new Date().toISOString().slice(0, 10);
        
        downloadLink.href = URL.createObjectURL(csvFile);
        downloadLink.download = `delinquent_accounts_report_${today}.csv`;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    // --- Initialization ---
    fetchDelinquentAccounts();
    exportBtn.addEventListener('click', handleExportToCSV);
});