document.addEventListener('DOMContentLoaded', function() {
    
    // --- Global Logging Function (Extracted for use by all modules) ---
    // Note: The PHP script (PHP/log_action.php) must be updated 
    // to handle both 'action' (the type) and 'description' (the detail).
    function logUserAction(actionType, description) {
      
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
    window.logUserAction = logUserAction; // Make it globally accessible

    // 1. Define ALL Access Rules (for applyAccessControl)
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
        console.log(`User Role (normalized): ${userRole}`);
        
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
                }
            } else {
                // If an element is in the HTML but not in the rules, we hide it by default
                elementToHide.style.display = 'none';
                console.warn(`Hiding: ${linkName}. No access rule defined.`);
            }
        }

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
    }

    // --- SECOND BLOCK FUNCTIONALITY (Navigation/Logout Handlers) ---
    
    // Note: enforceRoleAccess(['admin','Manager','Loan_Officer']); is commented out 
    // as applyAccessControl handles access control using fetch data.
    // enforceRoleAccess(['admin','Manager','Loan_Officer']); 

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    const reportButtons = document.querySelectorAll('.report-button'); 

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
    const reportUrlMapping = {
        'existingclients': 'ReportsExistingClient.html',
        'duepayments': 'ReportsDuePayments.html',
        'overdue': 'ReportsDelinquentAccounts.html',
        'audittrail': 'ReportsAuditTrail.html',
        'forrelease': 'ReportsRelease.html'
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
          const actionType = 'NAVIGATION'; 
          const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;
          logUserAction(actionType, description); // ASYNCHRONOUS AUDIT LOG
          window.location.href = targetPage;
        } else {
          console.error('No page defined for this link:', linkText);
          const actionType = 'NAVIGATION_FAILED'; 
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
                const actionType = 'VIEW'; // Use a specific type for reports
                const description = `Viewed Report: ${this.textContent} (${targetPage})`;
                logUserAction(actionType, description); // ASYNCHRONOUS AUDIT LOG
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this report button:', buttonText);
                const actionType = 'VIEW_FAILED'; 
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

    // --- THIRD BLOCK FUNCTIONALITY (Data Fetch, Search, and Release) ---

    // This section assumes the current page is ReportsRelease.html and elements exist.
    const tableBody = document.querySelector('.report-viewer tbody');
    const searchInput = document.getElementById('report-search'); 

    if (!tableBody) return;

    let reportsData = [];

    // --- Function to Fetch and Display Data ---
    function fetchAndDisplayReports() {
        tableBody.innerHTML = '<tr><td colspan="4">Loading reports...</td></tr>'; 

        fetch('PHP/reportsreleasetable_handler.php') 
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.data.length > 0) {
                    reportsData = data.data; 
                    renderTable(reportsData);
                } else {
                    reportsData = [];
                    tableBody.innerHTML = `<tr><td colspan="4">${data.message}</td></tr>`;
                }
            })
            .catch(error => {
                console.error('Fetch Error:', error);
                tableBody.innerHTML = `<tr><td colspan="4">Failed to load data. Please check network/server logs.</td></tr>`;
            });
    }

    // --- Function to Render the Table Rows ---
    function renderTable(dataToRender) {
        tableBody.innerHTML = ''; 

        if (dataToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4">No matching reports found.</td></tr>`;
            return;
        }

        let html = '';
        dataToRender.forEach(report => {
            const clientIdName = `${report.client_id} - ${report.client_name}`;
            const loanId = report.loan_id;
            const amountDue = `PHP ${parseFloat(report.amount_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            const buttonHtml = `<button class="action-release-button">Release</button>`;

            html += `
                <tr>
                    <td>${clientIdName}</td>
                    <td>${loanId}</td>
                    <td>${amountDue}</td>
                    <td>${buttonHtml}</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    // --- Search Input Event Listener ---
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            const filteredReports = reportsData.filter(report => {
                const clientInfo = `${report.client_id} - ${report.client_name}`.toLowerCase();
                const loanId = String(report.loan_id); 

                return clientInfo.includes(searchTerm) || loanId.includes(searchTerm);
            });

            renderTable(filteredReports);
        });
    }

    // Call the function to load the data when the page loads
    fetchAndDisplayReports();


    // --- Event Delegation for "Release" Button (WITH AUDIT LOGGING) ---
    tableBody.addEventListener('click', function(event) {
        const button = event.target.closest('.action-release-button');
        if (!button || button.disabled) {
            return;
        }

        const row = button.closest('tr');
        const loanIdCell = row.children[1]; 
        const loanId = loanIdCell.textContent.trim();
        const clientNameCell = row.children[0]; 
        const clientName = clientNameCell.textContent.trim(); // Grab client name for log

        if (confirm(`Are you sure you want to release report for Loan ID: ${loanId}?`)) {
            
            fetch('PHP/reportsrelease_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `loan_id=${encodeURIComponent(loanId)}`
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                
                if (data.success) {
                    // --- AUDIT LOG ENTRY (Success) ---
                    const actionType = 'RELEASE'; 
                    const description = `Report Released for Client ID: ${clientName}, Loan ID: ${loanId}`;
                    logUserAction(actionType, description); 
                    // ---------------------------------
                    
                    fetchAndDisplayReports();
                    if (searchInput) {
                        searchInput.value = '';
                    }
                } 
            })
            .catch(error => {
                console.error('AJAX Error:', error);
                alert('An error occurred during the release request. Check the console for details.');
                
                // --- AUDIT LOG ENTRY (Failure) ---
                const actionType = 'RELEASE_FAILED'; 
                const description = `FAILED to release report for Client ID: ${clientName}, Loan ID: ${loanId}. Error: ${error.message}`;
                logUserAction(actionType, description);
                // ---------------------------------
            });
        }
    });

});