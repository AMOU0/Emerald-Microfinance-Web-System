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
        'audittrail': 'ReportsAuditTrail.html'
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
/*==================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.report-viewer tbody');
    // New: Select the search input field
    const searchInput = document.getElementById('report-search'); 

    if (!tableBody) return;

    // Store the raw data globally or within the scope to filter efficiently
    let reportsData = [];

    // --- Function to Fetch and Display Data ---
    function fetchAndDisplayReports() {
        // Clear existing content and show a loading message
        tableBody.innerHTML = '<tr><td colspan="4">Loading reports...</td></tr>'; 

        fetch('PHP/reportsreleasetable_handler.php') // Call the JSON endpoint
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // --- Store the fetched data ---
                if (data.success && data.data.length > 0) {
                    reportsData = data.data; // Store the data
                    renderTable(reportsData); // Initial render
                } else {
                    reportsData = []; // Clear data
                    // Display 'No data' message
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
        tableBody.innerHTML = ''; // Clear existing content

        if (dataToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4">No matching reports found.</td></tr>`;
            return;
        }

        let html = '';
        dataToRender.forEach(report => {
            const clientIdName = `${report.client_id} - ${report.client_name}`;
            const loanId = report.loan_id;
            // Format amount to PHP currency
            const amountDue = `PHP ${parseFloat(report.amount_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            
            // The button will be 'Release' because the PHP query filters for unreleased
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
            
            // Filter the stored raw data
            const filteredReports = reportsData.filter(report => {
                const clientInfo = `${report.client_id} - ${report.client_name}`.toLowerCase();
                const loanId = String(report.loan_id); // Ensure loan_id is treated as a string for comparison

                return clientInfo.includes(searchTerm) || loanId.includes(searchTerm);
            });

            // Re-render the table with the filtered results
            renderTable(filteredReports);
        });
    }

    // Call the function to load the data when the page loads
    fetchAndDisplayReports();


    // --- Event Delegation for "Release" Button (No change needed here) ---
    tableBody.addEventListener('click', function(event) {
        const button = event.target.closest('.action-release-button');
        if (!button || button.disabled) {
            return;
        }

        const row = button.closest('tr');
        // Loan ID is the content of the second column (index 1)
        const loanIdCell = row.children[1]; 
        const loanId = loanIdCell.textContent.trim();

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
                    // Reload the table data to remove the newly released item
                    fetchAndDisplayReports();
                    // Clear search input after successful action
                    if (searchInput) {
                        searchInput.value = '';
                    }
                } 
            })
            .catch(error => {
                console.error('AJAX Error:', error);
                alert('An error occurred during the release request. Check the console for details.');
            });
        }
    });
});