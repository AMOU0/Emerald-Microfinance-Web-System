document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    const accessRules = {
        // --- Main Navigation Links ---
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
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
// Select the buttons in the Tools menu (Corrected to be more specific if possible)
const toolsMenuButtons = document.querySelectorAll('.content-panel .tools-menu .menu-button'); 
// Select the buttons in the User Management sub-menu
const userManagementMenuButtons = document.querySelectorAll('.user-management-menu-button');


// EXISTING: Mapping for the main sidebar navigation links
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

// NEW: Mapping for the sub-menu buttons inside Tools.html
const toolsUrlMapping = {
  'backupandrestore': 'ToolsBR.html', 
  'interestamount': 'ToolsInterest.html', 
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

// --- Tools Menu Button Handler (Existing Logic) ---
toolsMenuButtons.forEach(button => {
  button.addEventListener('click', function(event) {
      event.preventDefault();

      // Normalize the button text for mapping lookup
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


// --- User Management Sub-Menu Button Handler (FIXED/NEW Logic for the inner menu) ---
userManagementMenuButtons.forEach(button => {
  button.addEventListener('click', function(event) {
      event.preventDefault();

      // Remove 'active' class from all, add to clicked one (visual feedback)
      userManagementMenuButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active'); 

      const buttonId = this.id; 
      let mapKey = '';
      
      // Determine the map key based on the ID for cleaner logic
      if (buttonId === 'password-change-btn') {
          mapKey = 'passwordchange';
      } else if (buttonId === 'username-change-btn') {
          mapKey = 'usernamechange';
      } else if (buttonId === 'account-creation-btn') {
          mapKey = 'createuser';
      } else if (buttonId === 'existing-accounts-btn') {
          mapKey = 'existingaccounts';
      }

      const targetPage = userManagementUrlMapping[mapKey];

      if (targetPage) {
          const actionType = 'NAVIGATION'; 
          const description = `Accessed User Management sub-menu "${this.textContent}", loading page ${targetPage}`;

          // Log the action before redirect
          logUserAction(actionType, description);

          // Perform the page redirect
          window.location.href = targetPage;
      } else {
          console.error('No page defined for this User Management button:', this.textContent);
          
          // Log the failed attempt
          const actionType = 'NAVIGATION';
          const description = `FAILED: Clicked User Management sub-menu "${this.textContent}" with no mapped page.`;
          logUserAction(actionType, description);
      }
  });
});
//========================================================================================================================================================================


// userexistingview_function.js (Main Data Handling Logic)

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.account-creation-form');
    const statusMessage = document.getElementById('status-message');
    const updateButton = document.getElementById('update-user-button');
    const resetPasswordToggle = document.getElementById('reset-password-toggle');

    // Form fields
    const accountNameInput = document.getElementById('account-name');
    const accountEmailInput = document.getElementById('account-email');
    const accountUsernameInput = document.getElementById('account-username');
    const accountRoleSelect = document.getElementById('account-role');
    // Status Field
    const accountStatusSelect = document.getElementById('account-status'); 

    // Password fields
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('account-confirm-password');
    const passwordResetFields = document.getElementById('password-reset-fields'); 

    let currentUserId = null; // Variable to store the fetched user ID

    // --- Utility Functions ---

    // Function to get the URL parameter 'id'
    function getUserIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // UPDATED: Added accountStatusSelect to be disabled
    function setFormFieldsDisabled(disabled) {
        accountNameInput.disabled = disabled;
        accountEmailInput.disabled = disabled;
        accountUsernameInput.disabled = disabled;
        accountRoleSelect.disabled = disabled;
        accountStatusSelect.disabled = disabled; // Status Field
        resetPasswordToggle.style.display = disabled ? 'none' : 'block';
        updateButton.disabled = disabled;
    }

    function togglePasswordFields(enabled) {
        passwordResetFields.style.display = enabled ? 'block' : 'none'; 
        newPasswordInput.disabled = !enabled;
        confirmNewPasswordInput.disabled = !enabled;
    }

    function clearPasswordFields() {
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
    }
    
    // Function to populate the role dropdown
    function populateRoleDropdown(roles, currentRole = null) {
        // Clear existing options, but keep the disabled placeholder
        accountRoleSelect.innerHTML = '<option value="" disabled selected>Select a role</option>';
        
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            if (role === currentRole) {
                option.selected = true;
            }
            accountRoleSelect.appendChild(option);
        });
    }

    // --- Fetch User Data ---

    function fetchUserDetails(userId) {
        setFormFieldsDisabled(true);

        fetch(`PHP/userexistingview_handler.php?id=${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.user) {
                    currentUserId = data.user.id;
                    
                    // 1. Populate and set Role
                    populateRoleDropdown(data.roles, data.user.role);
                    
                    // 2. Set Status (This correctly sets the dropdown value)
                    if (data.user.status) {
                        accountStatusSelect.value = data.user.status; 
                    } else {
                        accountStatusSelect.value = 'Active'; 
                    }
                    
                    // 3. Populate other form fields
                    accountNameInput.value = data.user.name;
                    accountEmailInput.value = data.user.email;
                    accountUsernameInput.value = data.user.username;
                    
                    statusMessage.textContent = "User data loaded successfully. Ready to edit.";
                    statusMessage.className = 'mb-4 text-center text-green-600';

                    // Re-enable fields for editing
                    setFormFieldsDisabled(false);

                } else {
                    // Even if user fails to load, populate roles if available
                    if (data.roles) {
                        populateRoleDropdown(data.roles);
                    }
                    statusMessage.textContent = data.message || "Failed to load user details.";
                    statusMessage.className = 'mb-4 text-center text-red-600';
                }
            })
            .catch(error => {
                statusMessage.textContent = "Error connecting to the server.";
                statusMessage.className = 'mb-4 text-center text-red-600';
                console.error('Fetch error:', error);
            });
    }

    // --- Update User Data ---

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Basic client-side validation for non-password fields
        if (!accountNameInput.value || !accountEmailInput.value || !accountUsernameInput.value || !accountRoleSelect.value || !accountStatusSelect.value) {
            statusMessage.textContent = "All fields (Name, Email, Username, Role, Status) are required.";
            statusMessage.className = 'mb-4 text-center text-red-600';
            return;
        }

        let newPassword = null;
        if (!newPasswordInput.disabled) {
            if (!newPasswordInput.value) {
                statusMessage.textContent = "New Password is required when 'Reset User Password' is active.";
                statusMessage.className = 'mb-4 text-center text-red-600';
                return;
            }
            if (newPasswordInput.value !== confirmNewPasswordInput.value) {
                statusMessage.textContent = "New Password and Confirm New Password do not match.";
                statusMessage.className = 'mb-4 text-center text-red-600';
                return;
            }
            if (newPasswordInput.value.length < 8) {
                statusMessage.textContent = "Password must be at least 8 characters long.";
                statusMessage.className = 'mb-4 text-center text-red-600';
                return;
            }
            newPassword = newPasswordInput.value;
        }

        const userData = {
            id: currentUserId,
            name: accountNameInput.value,
            email: accountEmailInput.value,
            username: accountUsernameInput.value,
            role: accountRoleSelect.value,
            status: accountStatusSelect.value, // Status value sent to PHP
            new_password: newPassword 
        };

        // Disable button during submission
        updateButton.disabled = true;
        updateButton.textContent = 'Updating...';

        fetch('PHP/userexistingviewupdate.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                statusMessage.textContent = data.message;
                statusMessage.className = 'mb-4 text-center text-green-600';
                
                // If password was reset, automatically disable password fields and clear them
                if (newPassword) {
                    togglePasswordFields(false);
                    // Reset the button state
                    resetPasswordToggle.textContent = 'Reset User Password';
                    resetPasswordToggle.style.backgroundColor = '#f6ad55'; 
                    clearPasswordFields();
                }

            } else {
                statusMessage.textContent = data.message || "An unknown error occurred during update.";
                statusMessage.className = 'mb-4 text-center text-red-600';
            }
        })
        .catch(error => {
            statusMessage.textContent = "Network error or server connection failed.";
            statusMessage.className = 'mb-4 text-center text-red-600';
            console.error('Update error:', error);
        })
        .finally(() => {
            updateButton.disabled = false;
            updateButton.textContent = 'Update User';
        });
    });

    // --- Event Listeners ---

    // Password reset toggle logic
    resetPasswordToggle.addEventListener('click', function() {
        const isEnabled = newPasswordInput.disabled; // Check current state

        if (isEnabled) {
            // Enable password fields and show the container
            togglePasswordFields(true);
            resetPasswordToggle.textContent = 'Cancel Password Reset';
            resetPasswordToggle.style.backgroundColor = '#f56565'; // Red-ish color
        } else {
            // Disable password fields and hide the container
            togglePasswordFields(false);
            clearPasswordFields();
            resetPasswordToggle.textContent = 'Reset User Password';
            resetPasswordToggle.style.backgroundColor = '#f6ad55'; // Orange-ish color
        }
    });

    // --- Initialization ---

    const userId = getUserIdFromUrl();
    // Default: Disable password fields on load and hide the container
    togglePasswordFields(false); 

    if (userId) {
        fetchUserDetails(userId);
    } else {
        statusMessage.textContent = "No User ID found in URL. Cannot load user details.";
        statusMessage.className = 'mb-4 text-center text-red-600';
        setFormFieldsDisabled(true);
    }
});