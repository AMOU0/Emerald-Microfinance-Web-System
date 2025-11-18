document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    const accessRules = {
        // --- Main Navigation Links ---
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'For Release': ['Admin', 'Manager', 'Loan_Officer'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer'], // Main 'Tools' link access

        // --- Tools Submenu Buttons ---
        'Backup And Restore': ['Admin'],
        'Interest Amount': ['Admin'],
        'User Management': ['Admin', 'Manager', 'Loan_Officer'],
        
        // 🚨 NEW ACCESS RULES FOR USER MANAGEMENT SUBMENU 🚨
        'Password Change': ['Admin', 'Manager', 'Loan_Officer'],
        'Username Change': ['Admin', 'Manager', 'Loan_Officer'],
        'Create User': ['Admin'],
        'Existing Accounts': ['Admin']
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
                const userRole = data.role;
                applyAccessControl(userRole);
            } else {
                // If not logged in, apply 'none' role.
                applyAccessControl('none');
            }
        })
        .catch(error => {
            console.error('Error fetching user session:', error);
        });

    // 3. Apply Access Control
    function applyAccessControl(userRole) {
        // --- Logic for Main Navigation Links (a tags in sidebar-nav) ---
        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');

        navLinks.forEach(link => {
            const linkName = link.textContent.trim();
            const parentListItem = link.parentElement; // The <li> element

            if (accessRules.hasOwnProperty(linkName)) {
                const allowedRoles = accessRules[linkName];

                if (!allowedRoles.includes(userRole)) {
                    // Hide the entire list item (<li>)
                    parentListItem.style.display = 'none';
                }
            } else {
                console.warn(`No main navigation access rule defined for: ${linkName}`);
            }
        });

        // ----------------------------------------------------------------

        // --- Logic for Tools Submenu Buttons (.tools-menu) ---
        const toolsButtons = document.querySelectorAll('.tools-menu .menu-button');

        toolsButtons.forEach(button => {
            const buttonName = button.textContent.trim();

            if (accessRules.hasOwnProperty(buttonName)) {
                const allowedRoles = accessRules[buttonName];

                if (!allowedRoles.includes(userRole)) {
                    // Hide the button
                    button.style.display = 'none';
                }
            } else {
                console.warn(`No tools submenu access rule defined for: ${buttonName}`);
            }
        });

        // ----------------------------------------------------------------
        
        // 🚨 NEW LOGIC for User Management Submenu Buttons (.user-management-menu) 🚨
        const userManagementButtons = document.querySelectorAll('.user-management-menu .user-management-menu-button');

        userManagementButtons.forEach(button => {
            const buttonName = button.textContent.trim();

            if (accessRules.hasOwnProperty(buttonName)) {
                const allowedRoles = accessRules[buttonName];

                if (!allowedRoles.includes(userRole)) {
                    // Hide the button
                    button.style.display = 'none';
                }
            } else {
                console.warn(`No user management submenu access rule defined for: ${buttonName}`);
            }
        });
        // ----------------------------------------------------------------

    }
});
//==============================================================================================================================================
document.addEventListener('DOMContentLoaded', function() {
            enforceRoleAccess(['admin']); 
        });
/*=============================================================================*/

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
// NEW: Select the buttons in the Tools menu
const toolsMenuButtons = document.querySelectorAll('.menu-button'); //

// EXISTING: Mapping for the main sidebar navigation links
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

// NEW: Mapping for the sub-menu buttons inside Tools.html
const toolsUrlMapping = {
  'backupandrestore': 'ToolsBR.html', //
  'interestamount': 'ToolsInterest.html', // 
  'usermanagement': 'UserManagement.html'
};

const userManagementUrlMapping = {
      'passwordchange': 'UserPasswordChange.html',
      'usernamechange': 'UserUsernameChange.html',
      'createuser': 'UserCreation.html',
      'existingaccounts': 'UserExisting.html'
};
// --- Main Sidebar Navigation Handler (Existing Logic) ---
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

// --- Tools Menu Button Handler (NEW Logic) ---
toolsMenuButtons.forEach(button => {
  button.addEventListener('click', function(event) {
      event.preventDefault();

      // Normalize the button text for mapping lookup
      // Note: For 'City/ Barangays', the map key uses a '/' which is retained
      // The normalization must match the key in toolsUrlMapping
      let buttonText = this.textContent.toLowerCase().replace(/\s/g, '');

      // Special handling for the 'City/ Barangays' key if it doesn't match the normalized string
      if (buttonText === 'city/barangays') {
          buttonText = 'city/barangays';
      } else {
           // For the other buttons, remove the '/' or any other non-standard chars if present
           buttonText = buttonText.replace(/[^a-z0-9]/g, '');
      }

      const targetPage = toolsUrlMapping[buttonText];

      if (targetPage) {
          const actionType = 'NAVIGATION'; // New action type for tool usage
          const description = `Accessed tool "${this.textContent}", loading page ${targetPage}`;

          // Log the action before redirect
          logUserAction(actionType, description);

          // Perform the page redirect
          window.location.href = targetPage;
      } else {
          console.error('No page defined for this tool button:', this.textContent);
          
          // Log the failed attempt
          const actionType = 'NAVIGATION';
          const description = `FAILED: Clicked tool "${this.textContent}" with no mapped page.`;
          logUserAction(actionType, description);
      }
  });
});
// ---------------------------------------------

// --- User Management Menu Button Handler (NEW Logic) ---
const userManagementButtons = document.querySelectorAll('.user-management-menu-button');

userManagementButtons.forEach(button => {
  button.addEventListener('click', function(event) {
      event.preventDefault();

      // Normalize the button text for mapping lookup
      let buttonText = this.textContent.toLowerCase().replace(/\s/g, '');

      // Remove any non-alphanumeric characters to match the keys in userManagementUrlMapping
      buttonText = buttonText.replace(/[^a-z0-9]/g, '');

      const targetPage = userManagementUrlMapping[buttonText];

      if (targetPage) {
          const actionType = 'NAVIGATION'; // Action type for user management navigation
          const description = `Accessed user management option "${this.textContent}", loading page ${targetPage}`;

          // Log the action before redirect
          logUserAction(actionType, description);

          // Perform the page redirect
          window.location.href = targetPage;
      } else {
          console.error('No page defined for this user management button:', this.textContent);
          
          // Log the failed attempt
          const actionType = 'NAVIGATION';
          const description = `FAILED: Clicked user management option "${this.textContent}" with no mapped page.`;
          logUserAction(actionType, description);
      }
  });
});
// ---------------------------------------------
 
// Handle the logout button securely (Existing Logic)
if (logoutButton) {
  logoutButton.addEventListener('click', function() {
    window.location.href = 'PHP/check_logout.php'; 
  });
}


/*================================= */
// JS/usercreation_function.js

// Add an event listener to the form element using its class name.
document.querySelector('.account-creation-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Get a reference to the form element itself.
    const form = event.target;
    // Get references to the status message area and the submit button.
    const statusMessage = document.getElementById('status-message');
    const submitButton = document.querySelector('.create-account-button');

    // --- Client-side Validation ---
    // Retrieve and trim the values from all form fields.
    const name = form.elements['name'].value.trim();
    const email = form.elements['email'].value.trim();
    const username = form.elements['username'].value.trim();
    const password = form.elements['password'].value;
    const confirmPassword = form.elements['confirm-password'].value;
    const role = form.elements['role'].value;

    // Clear any previous status messages.
    statusMessage.textContent = '';
    // Hide the status message div initially.
    statusMessage.style.display = 'none';

    // Check if any fields are empty.
    if (!name || !email || !username || !password || !confirmPassword || !role) {
        statusMessage.textContent = 'Please fill out all fields.';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'red';
        return;
    }

    // Check if the passwords match.
    if (password !== confirmPassword) {
        statusMessage.textContent = 'Passwords do not match.';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'red';
        return;
    }

    // Simple password length validation.
    if (password.length < 8) {
        statusMessage.textContent = 'Password must be at least 8 characters long.';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'red';
        return;
    }

    // --- Form Submission via Fetch API ---
    // Disable the button and change its text to provide user feedback.
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';
    // Display a processing message.
    statusMessage.textContent = 'Processing...';
    statusMessage.style.display = 'block';
    statusMessage.style.color = 'blue';
    
    // Create a FormData object from the form to easily handle form data.
    const formData = new FormData(form);
    // Do not send the confirm password to the server.
    formData.delete('confirm-password');

    // NOTE: logUserAction is defined in the outer DOMContentLoaded scope.
    // Re-defining a local reference for clarity and guaranteed access (closure scope)
    const logUserAction = (actionType, description, targetTable = null, targetId = null) => {
        const bodyData = new URLSearchParams();
        bodyData.append('action', actionType); 
        bodyData.append('description', description); 

        if (targetTable) {
            bodyData.append('target_table', targetTable);
        }
        if (targetId) {
            bodyData.append('target_id', targetId);
        }
        
        fetch('PHP/log_action.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyData.toString()
        })
        .then(response => {
            if (!response.ok) {
                console.warn('Audit log failed to record (Form Handler):', actionType, description);
            }
        })
        .catch(error => {
            console.error('Audit log fetch error (Form Handler):', error);
        });
    };

    try {
        // Send the form data to the PHP script.
        const response = await fetch('PHP/usercreation_handler.php', {
            method: 'POST',
            body: formData
        });

        // Check if the network response was successful.
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Parse the JSON response from the server.
        // ASSUMPTION: The PHP handler now returns the new user's ID as 'user_id'
        const result = await response.json();
        const newUserId = result.user_id || null; // Safely get the ID

        // Check the 'success' property of the server response.
        if (result.success) {
            statusMessage.textContent = result.message;
            statusMessage.style.color = 'green';
            form.reset(); // Clear the form on successful Create User.
            
            // --- LOG SUCCESSFUL USER CREATION ---
            // MODIFIED: Added targetTable ('users') and targetId (newUserId)
            logUserAction(
                'CREATED', 
                `New user created successfully: Username: ${username}, Role: ${role}, Name: ${name}`,
                'users',
                newUserId
            );

        } else {
            statusMessage.textContent = result.message;
            statusMessage.style.color = 'red';

            // --- LOG FAILED USER CREATION (Server-side) ---
            // MODIFIED: Called logUserAction without targetTable/targetId
            logUserAction(
                'CREATED', 
                `Failed to create user: Username: ${username}, Role: ${role}, Message: ${result.message}`
            );
        }
    } catch (error) {
        // Handle any errors that occurred during the fetch request.
        statusMessage.textContent = 'An error occurred. Please try again.';
        statusMessage.style.color = 'red';
        console.error('Submission error:', error);
        
        // --- LOG USER CREATION ERROR (Network/Exception) ---
        // MODIFIED: Called logUserAction without targetTable/targetId
        logUserAction(
            'CREATED', 
            `Error during user creation attempt for Username: ${username}, Details: ${error.message}`
        );

    } finally {
        // Re-enable the button and reset its text, regardless of success or failure.
        submitButton.disabled = false;
        submitButton.textContent = 'Create';
    }
});