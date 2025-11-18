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
            enforceRoleAccess(['admin','Manager','Loan_Officer']); 
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


/*===================================================================================================================================================*/





document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('username-change-form');
    const oldUsernameInput = document.getElementById('old-username');
    const newUsernameInput = document.getElementById('new-username');
    const confirmNewUsernameInput = document.getElementById('confirm-new-username');
    const feedbackMessage = document.getElementById('feedback-message');
    const saveButton = document.getElementById('save-button');
    
    // --- Custom Modal Elements (Must be added to UserUsernameChange.html for proper functionality) ---
    // NOTE: Since I can only edit one file, I'll define a simple UI structure here.
    // In a real app, you would add this HTML structure to UserUsernameChange.html.
    const modalHtml = `
        <div id="confirmation-modal" style="display:none; position:fixed; z-index:100; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.4);">
            <div style="background-color:#fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 400px; border-radius: 8px;">
                <p>Are you sure you want to change your username to <strong id="new-username-display"></strong>?</p>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button id="modal-cancel-btn" style="padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; background-color: #ccc;">Cancel</button>
                    <button id="modal-confirm-btn" style="padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; background-color: #4CAF50; color: white;">Confirm Change</button>
                </div>
            </div>
        </div>
    `;
    
    // Append modal structure to the body (not ideal, but necessary in this single-JS context)
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const confirmationModal = document.getElementById('confirmation-modal');
    const newUsernameDisplay = document.getElementById('new-username-display');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    // ---------------------------------------------------------------------------------


    /**
     * Displays a feedback message to the user.
     * @param {string} message The message to display.
     * @param {boolean} isSuccess Whether the message is a success or an error.
     */
    function showFeedback(message, isSuccess) {
        feedbackMessage.textContent = message;
        feedbackMessage.style.display = 'block';
        feedbackMessage.style.backgroundColor = isSuccess ? '#d4edda' : '#f8d7da';
        feedbackMessage.style.color = isSuccess ? '#155724' : '#721c24';
        feedbackMessage.style.borderColor = isSuccess ? '#c3e6cb' : '#f5c6cb';
    }

    /**
     * Fetches the current user's username and populates the input field.
     */
    async function fetchCurrentUsername() {
        try {
            const response = await fetch('PHP/userusernamechangegetusername_handler.php', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            
            const result = await response.json();

            if (result.success) {
                oldUsernameInput.value = result.username;
                oldUsernameInput.readOnly = true; 
            } else {
                oldUsernameInput.value = 'Error fetching username';
                showFeedback(result.message || 'Could not fetch current username.', false);
                saveButton.disabled = true; 
            }
        } catch (error) {
            console.error('Fetch username network error:', error);
            oldUsernameInput.value = 'Network Error';
            showFeedback('A network error occurred while loading your username.', false);
            saveButton.disabled = true;
        }
    }

    // Call the function on page load
    fetchCurrentUsername();

    /**
     * Handles the actual AJAX submission to change_username.php
     * @param {string} oldUsername 
     * @param {string} newUsername 
     */
    async function submitUsernameChange(oldUsername, newUsername) {
        saveButton.disabled = true; 
        saveButton.textContent = 'SAVING...';
        confirmationModal.style.display = 'none'; // Hide modal

        try {
            const response = await fetch('PHP/userusernamechange_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    old_username: oldUsername, 
                    new_username: newUsername
                }),
            });

            const result = await response.json();

            if (result.success) {
                showFeedback(result.message, true);
                fetchCurrentUsername();
                newUsernameInput.value = '';
                confirmNewUsernameInput.value = '';
            } else {
                showFeedback(result.message, false);
            }

        } catch (error) {
            console.error('Fetch error:', error);
            showFeedback('A network error occurred. Could not connect to the server.', false);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'SAVE';
        }
    }

    // --- FORM SUBMISSION (Opens Modal) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        feedbackMessage.style.display = 'none';

        const oldUsername = oldUsernameInput.value.trim();
        const newUsername = newUsernameInput.value.trim();
        const confirmNewUsername = confirmNewUsernameInput.value.trim();

        // 1. Client-side validation
        if (oldUsername === 'Error fetching username' || oldUsername === 'Loading...' || oldUsername === 'Network Error') {
            showFeedback('Cannot submit. Current username is not loaded correctly.', false);
            return;
        }

        if (newUsername.length < 4) {
            showFeedback('New username must be at least 4 characters long.', false);
            return;
        }

        if (newUsername !== confirmNewUsername) {
            showFeedback('New username and confirmation do not match.', false);
            return;
        }

        if (oldUsername === newUsername) {
            showFeedback('The new username cannot be the same as the current username.', false);
            return;
        }
        
        // 2. Show Confirmation Modal
        newUsernameDisplay.textContent = newUsername;
        confirmationModal.style.display = 'block';

        // Set up one-time listener for confirmation
        const confirmHandler = () => {
            // Remove listeners to prevent memory leak/double-fire
            modalConfirmBtn.removeEventListener('click', confirmHandler);
            modalCancelBtn.removeEventListener('click', cancelHandler);
            
            // Proceed with submission
            submitUsernameChange(oldUsername, newUsername);
        };

        const cancelHandler = () => {
            // Remove listeners
            modalConfirmBtn.removeEventListener('click', confirmHandler);
            modalCancelBtn.removeEventListener('click', cancelHandler);

            // Close modal
            confirmationModal.style.display = 'none';
            saveButton.disabled = false;
            saveButton.textContent = 'SAVE';
        };

        // Re-attach listeners every time the modal is opened
        modalConfirmBtn.addEventListener('click', confirmHandler);
        modalCancelBtn.addEventListener('click', cancelHandler);
    });
});
