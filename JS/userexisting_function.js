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


/*================================= */
const fetchPendingAccounts = () => {
    fetch('PHP/userexisting_handler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Ensure response is parsed as JSON
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector('.pending-account-table-body');
            tableBody.innerHTML = '';

            if (data.length > 0) {
                data.forEach(user => {
                    const row = document.createElement('div');
                    row.classList.add('table-row');
                    // Add a data attribute to store the user ID
                    row.dataset.userId = user.id; 
                    
                    row.innerHTML = `
                        <div class="table-cell">${user.id}</div>
                        <div class="table-cell">${user.name}</div>
                        <div class="table-cell">${user.username}</div>
                        <div class="table-cell">${user.role}</div>
                        <div class="table-cell">${user.status}</div>
                    `;
                    tableBody.appendChild(row);

                    // NEW: Add a click listener to the entire row
                    row.addEventListener('click', function() {
                        // 1. Check the radio button inside this row
                        const radio = this.querySelector('input[type="radio"]');
                        if (radio) {
                            radio.checked = true;
                        }

                        // 2. Simulate clicking the View button (or directly navigate)
                        // This directly navigates to the view page on row click
                        const userId = this.dataset.userId;
                        window.location.href = `UserExistingView.html?id=${userId}`;
                    });

                });
            } else {
                // ... (rest of the empty row logic)
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Failed to load user accounts. Please try again later.');
        });
};
fetchPendingAccounts();

// NEW: Implement the functionality for the dedicated "View" button
document.querySelector('.view-button-pending').addEventListener('click', () => {
    const selectedRadio = document.querySelector('input[name="selected"]:checked');
    if (selectedRadio) {
        // Navigate to the user view page using the selected ID
        const userId = selectedRadio.value;
        // Ensure you use the correct file name: UserExistingView.html
        window.location.href = `UserExistingView.html?id=${userId}`; 
    } else {
        alert('Please select a user account first by clicking on a row.');
    }
});
// ... (rest of the file remains the same)

// This part of the JS is based on a different context (loan approvals)
// and doesn't match the new HTML table for user accounts. 
// It is recommended to create new functionality to match the "View" button
// or other actions you want to perform on user accounts.
// For now, the 'View' button functionality is commented out or needs a new purpose.
// For a user account table, you might want "Activate," "Deactivate," or "Edit" buttons
// rather than "Approve" or "Deny" which were for loan applications.
/*
// Corrected event listener for the "View" button
document.querySelector('.view-button-pending').addEventListener('click', () => {
    const selectedRadio = document.querySelector('input[name="selected"]:checked');
    if (selectedRadio) {
        // Here you would navigate to a user profile view page
        const userId = selectedRadio.value;
        window.location.href = `UserAccountView.html?id=${userId}`; // Example URL
    } else {
        alert('Please select a user account first.');
    }
});
*/