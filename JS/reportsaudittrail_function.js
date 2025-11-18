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
        'For Release': ['admin', 'manager', 'loan_Officer'],
        'Payment Collection': ['admin', 'manager'],
        'Ledger': ['admin', 'manager', 'loan_officer'],
        'Reports': ['admin', 'manager', 'loan_officer'],
        'Tools': ['admin', 'manager', 'loan_officer'],
        
        // Report Sidebar Buttons (.reports-sidebar .report-button)
        'Existing Clients': ['admin', 'manager', 'loan_officer'],
        'Released List': ['admin', 'manager', 'loan_officer'],
        'Collection List': ['admin', 'manager', 'loan_officer'],
        'Overdue': ['admin', 'manager', 'loan_officer'],
        'Due Payments': ['admin', 'manager'],
        'Audit Trail': ['admin']
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
            enforceRoleAccess(['admin']); 
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
/*=============================================================================================================================================================================*/

document.addEventListener('DOMContentLoaded', function() {
    const reportButtons = document.querySelectorAll('.report-button');

    // --- Reports Sidebar Navigation Handler ---
    reportButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            const buttonText = this.textContent.toLowerCase().replace(/\s/g, '');
            
            const reportUrlMapping = {
                'existingclients': 'ReportsExistingClient.html',
                'duepayments': 'ReportsDuePayments.html',
         'overdue': 'ReportsDelinquentAccounts.html', 

                'audittrail': 'ReportsAuditTrail.html'
            };
            
            const targetPage = reportUrlMapping[buttonText];

            if (targetPage) {
                const actionDescription = `Viewed Report: ${this.textContent} (${targetPage})`;
                
                fetch('PHP/log_action.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=${encodeURIComponent(actionDescription)}`
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Audit log failed to record for report navigation:', actionDescription);
                    }
                })
                .catch(error => {
                    console.error('Audit log fetch error:', error);
                })
                
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this report button:', buttonText);
            }
        });
    });
});
/*=============================================================================================================================================================================*/
        document.addEventListener('DOMContentLoaded', () => {
            const auditTrailBody = document.getElementById('audit-trail-body');
            const filterStartDate = document.getElementById('filter-start-date');
            const filterEndDate = document.getElementById('filter-end-date');
            const filterAction = document.getElementById('filter-action');
            const filterUser = document.getElementById('filter-user');
            const applyFilterBtn = document.getElementById('apply-filter-btn');
            const exportCsvBtn = document.getElementById('export-csv-btn');
            const detailModal = document.getElementById('detail-modal');
            const closeModalBtn = detailModal.querySelector('.close-button');
            
            // Define the correct column count for colspan based on HTML (5 columns)
            const COLSPAN_COUNT = 5;

            /**
             * Helper function to get today's date in YYYY-MM-DD format.
             */
            function getTodayDateString() {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            // --- Set Default Date Range (01/01/2024 - Today) ---
            const todayDate = getTodayDateString();
            
            // Set the end date input's default value to today
            filterEndDate.value = todayDate;
            // Prevent selecting a future date
            filterEndDate.max = todayDate;
            // Start date is set via 'value="2024-01-01"' in HTML

            // --- Helper Functions ---

            // Function to build the query string from current filter values
            function getFilterQueryString(includeExport = false) {
                const params = new URLSearchParams();
                
                if (filterStartDate.value) {
                    params.append('start_date', filterStartDate.value);
                }
                if (filterEndDate.value) {
                    params.append('end_date', filterEndDate.value);
                }
                if (filterAction.value) {
                    params.append('action', filterAction.value);
                }
                if (filterUser.value) {
                    params.append('user', filterUser.value);
                }

                if (includeExport) {
                    params.append('action_type', 'export_csv');
                }
                
                return params.toString();
            }

            // Function to render the table rows (MATCHES HTML HEADERS)
            function renderTable(logs) {
                auditTrailBody.innerHTML = ''; 
                if (logs.length === 0) {
                    // Use COLSPAN_COUNT (5) for correct alignment
                    auditTrailBody.innerHTML = `<tr><td colspan="${COLSPAN_COUNT}">No audit logs found matching the filters.</td></tr>`;
                    return;
                }
                
                logs.forEach(log => {
                    const row = auditTrailBody.insertRow();
                    
                    // Column 1: Timestamp
                    const timestamp = new Date(log.timestamp).toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                    row.insertCell().textContent = timestamp;
                    
                    // Column 2: User
                    row.insertCell().textContent = log.user;
                    
                    // Column 3: Action
                    row.insertCell().textContent = log.action;
                    
                    // Column 4: Description (FIXED to use log.description)
                    row.insertCell().textContent = log.description; 
                    
                    // Column 5: Details/View Button
                    const detailsCell = row.insertCell();
                    const viewButton = document.createElement('button');
                    viewButton.textContent = 'View Details';
                    viewButton.className = 'view-details-btn';
                    viewButton.onclick = () => showDetailModal(log);
                    detailsCell.appendChild(viewButton);
                });
            }

            // Function to populate and show the detail modal
            function showDetailModal(log) {
                // Helper to format JSON or return raw string/N/A
                function formatJson(data) {
                    if (!data || data.trim() === '') {
                        return 'N/A';
                    }
                    try {
                        // Use JSON.parse and JSON.stringify to pretty-print
                        return JSON.stringify(JSON.parse(data), null, 2);
                    } catch (e) {
                        return data; // Return raw string if not valid JSON
                    }
                }
                
                try {
                    // 1. Populate standard details
                    document.getElementById('detail-timestamp').textContent = log.timestamp;
                    document.getElementById('detail-user').textContent = log.user;
                    document.getElementById('detail-action').textContent = log.action;
                    
                    // NEW: Populate the description field in the detail-section
                    document.getElementById('detail-description').textContent = log.description || 'N/A';
                    
                    // Extract Target Table and ID
                    const targetResourceString = log.target_resource || '';
                    const targetMatch = targetResourceString.match(/(.*) \(ID: (.*)\)/);
                    
                    const targetTable = targetMatch ? targetMatch[1] : (targetResourceString || 'N/A');
                    const targetId = targetMatch ? targetMatch[2] : 'N/A';

                    document.getElementById('detail-target').textContent = `${targetTable} / ${targetId}`;
                    document.getElementById('detail-ip').textContent = log.ip_address || 'N/A'; 
                    
                    // 2. Format state data
                    const formattedBeforeState = formatJson(log.before_state);
                    const formattedAfterState = formatJson(log.after_state);
                    
                    // 3. Update the elements (Before State now only contains the before_state log)
                    document.getElementById('detail-before-state').textContent = formattedBeforeState;
                    document.getElementById('detail-after-state').textContent = formattedAfterState;
                    
                    // 4. Finally, show the modal
                    detailModal.style.display = 'block';

                } catch (error) {
                    console.error('Error opening detail modal for log entry:', error, log);
                    // Robust Fallback: ensures the modal always opens with error info
                    document.getElementById('detail-timestamp').textContent = log.timestamp || 'Error';
                    document.getElementById('detail-user').textContent = log.user || 'Error';
                    document.getElementById('detail-action').textContent = 'ERROR LOADING DETAILS';
                    document.getElementById('detail-description').textContent = 'N/A'; // Fallback for new field
                    document.getElementById('detail-target').textContent = 'Check Console for Error';
                    document.getElementById('detail-ip').textContent = 'N/A';
                    document.getElementById('detail-before-state').textContent = 'Failed to process log data. See console for error.';
                    document.getElementById('detail-after-state').textContent = 'N/A';
                    detailModal.style.display = 'block';
                }
            }

            // Function to fetch unique users and populate the dropdown
            function loadUserFilters() {
                fetch('PHP/reportsaudittrail_handler.php?fetch=users')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.users) {
                            data.users.forEach(user => {
                                const option = document.createElement('option');
                                option.value = user;
                                option.textContent = user;
                                filterUser.appendChild(option);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching users:', error);
                    });
            }

            // --- Main Logic & Event Handlers ---

            function fetchAndRenderAuditTrail() {
                const queryString = getFilterQueryString();
                auditTrailBody.innerHTML = `<tr><td colspan="${COLSPAN_COUNT}">Loading...</td></tr>`; 

                fetch('PHP/reportsaudittrail_handler.php?' + queryString)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok. Status: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            renderTable(data.data);
                        } else {
                            auditTrailBody.innerHTML = `<tr><td colspan="${COLSPAN_COUNT}">Error: ${data.error || 'Failed to fetch data.'}</td></tr>`;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching audit logs:', error);
                        auditTrailBody.innerHTML = `<tr><td colspan="${COLSPAN_COUNT}">Error loading data: ${error.message}</td></tr>`;
                    });
            }

            // Event listener for Apply Filters button
            applyFilterBtn.addEventListener('click', fetchAndRenderAuditTrail);

            // Event listener for Export CSV button
            exportCsvBtn.addEventListener('click', () => {
                const queryString = getFilterQueryString(true); // true to include export flag
                // Trigger file download by navigating the browser to the PHP script with the export flag
                window.location.href = 'PHP/reportsaudittrail_handler.php?' + queryString;
            });
            
            // Modal closing handlers
            closeModalBtn.onclick = () => {
                detailModal.style.display = 'none';
            }
            window.onclick = (event) => {
                if (event.target === detailModal) {
                    detailModal.style.display = 'none';
                }
            }

            // Run initial load functions (using the default dates)
            loadUserFilters();
            fetchAndRenderAuditTrail();
        });
/*=============================================================================================================================================================================*/