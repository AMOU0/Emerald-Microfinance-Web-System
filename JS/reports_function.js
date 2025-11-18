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

    // Handle the logout button securely
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        window.location.href = 'PHP/check_logout.php'; 
      });
    }
});