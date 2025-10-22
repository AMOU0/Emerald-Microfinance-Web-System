document.addEventListener('DOMContentLoaded', function() {
            enforceRoleAccess(['admin','Manager','Loan Officer']); 
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
      'accountcreation': 'UserCreation.html',
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



//===================================================================================================================================
// =========================================================
    // --- 4. User Existing View Logic (Data Fetching & Constraints) ---
    // =========================================================
    
    // Helper function to get the ID from a URL
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Element Selections for this page
    const userIdToView = getUrlParameter('id');
    const nameField = document.getElementById('account-name'); // Added for name
    const emailField = document.getElementById('account-email'); // Added for email
    const usernameField = document.getElementById('account-username'); // Added for username
    const passwordField = document.getElementById('account-password');
    const confirmPasswordField = document.getElementById('account-confirm-password');
    const updateButton = document.getElementById('update-user-button');
    const resetPasswordToggle = document.getElementById('reset-password-toggle');
    const userRoleSelect = document.getElementById('account-role');
    const userForm = document.querySelector('form'); 

    // 1. Fetch User Data and Configure View
    if (userIdToView) {
        fetch(`PHP/userexistingview_handler.php?user_id=${userIdToView}`)
            .then(response => {
                // Check for HTTP errors (like the 500 error) before trying to parse JSON
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.user) {
                    const user = data.user;
                    const loggedInRole = user.current_user_role;
                    
                    // --- Populate Form Fields ---
                    // The following lines were ADDED to populate the fields
                    nameField.value = `${user.first_name} ${user.last_name}`; 
                    emailField.value = user.email;
                    usernameField.value = user.username;
                    // End of added lines
                    
                    userRoleSelect.value = user.role; 

                    // --- Constraint Logic (Client-side UI Control) ---
                    if (loggedInRole === 'Admin') {
                        // Admin can edit name, email, username
                        nameField.disabled = false;
                        emailField.disabled = false;
                        usernameField.disabled = false;
                        userRoleSelect.disabled = false;
                        updateButton.style.display = 'block';
                        resetPasswordToggle.style.display = 'block';

                        // Toggle functionality for Admin to enable password reset fields
                        resetPasswordToggle.addEventListener('click', () => {
                            const isEnabled = passwordField.disabled; 
                            
                            passwordField.disabled = !isEnabled;
                            confirmPasswordField.disabled = !isEnabled;
                            
                            passwordField.required = isEnabled; 
                            confirmPasswordField.required = isEnabled; 

                            resetPasswordToggle.textContent = isEnabled ? 'Cancel Password Reset' : 'Reset User Password';

                            if (!isEnabled) {
                                passwordField.value = ''; 
                                confirmPasswordField.value = '';
                            }
                            logUserAction('UI_TOGGLE', `Admin enabled password reset for User ID: ${userIdToView}.`);
                        });
                    } else {
                        // Non-Admin: View-only mode 
                        const inputs = userForm.querySelectorAll('input, select, textarea');
                        inputs.forEach(input => {
                            input.disabled = true; 
                        });
                        
                        updateButton.style.display = 'none'; 
                        resetPasswordToggle.style.display = 'none';
                        
                        logUserAction('VIEW_USER', `Non-Admin (${loggedInRole}) viewed User ID: ${userIdToView}.`);
                    }
                } else {
                    alert(`Error: ${data.message}`);
                    logUserAction('ERROR', `Failed to view user: ${data.message}.`);
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                alert(`Error fetching user data. Please check the server and database connection. Details: ${error.message}`);
            });
    } else {
        alert('Missing user ID in the URL. Cannot fetch user data.');
    }


    // 2. Handle Form Submission (Update)
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            event.preventDefault(); 

            // Client-side validation for password match
            if (!passwordField.disabled) {
                if (passwordField.value.length < 8) { 
                    alert('New password must be at least 8 characters long.');
                    return;
                }
                if (passwordField.value !== confirmPasswordField.value) {
                    alert('New Password and Confirm Password do not match!');
                    logUserAction('FORM_ERROR', 'Password mismatch on update attempt.');
                    return; 
                }
            }
            
            // Server-side will only process fields the user is authorized to update.
            const formData = new FormData(userForm);
            formData.append('user_id', userIdToView); 
            formData.delete('confirm-password');
            
            // Extract Name into first_name and last_name for server
            const fullName = formData.get('name').split(/\s+/);
            const firstName = fullName.shift() || '';
            const lastName = fullName.join(' ');
            formData.set('first_name', firstName);
            formData.set('last_name', lastName);
            formData.delete('name');
            
            const bodyData = new URLSearchParams(formData);

            fetch('PHP/userexistingview_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: bodyData.toString()
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    logUserAction('UPDATE_SUCCESS', data.message + ` for User ID: ${userIdToView}`);
                } else {
                    alert(`Update failed: ${data.message}`);
                    logUserAction('UPDATE_FAILED', data.message + ` for User ID: ${userIdToView}`);
                }
            })
            .catch(error => {
                console.error('Update fetch error:', error);
                alert('An error occurred while updating the user data.');
            });
        });
    }
    // End of new logic section