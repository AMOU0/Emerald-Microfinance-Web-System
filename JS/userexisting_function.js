document.addEventListener('DOMContentLoaded', function() {
  // Call the session check function as soon as the page loads.
  checkSessionAndRedirect(); 

  // --- Global Logging Function (Re-defined for clarity) ---
  function logUserAction(actionDescription) {
    fetch('PHP/log_action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `action=${encodeURIComponent(actionDescription)}`
    })
    .then(response => {
      if (!response.ok) {
        console.warn('Audit log failed to record:', actionDescription);
      }
    })
    .catch(error => {
      console.error('Audit log fetch error:', error);
    });
  }
  // --------------------------------------------------------

  const navLinks = document.querySelectorAll('.nav-link');
  const logoutButton = document.querySelector('.logout-button');

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

  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault(); 
      navLinks.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      // Normalize the link text for mapping lookup
      const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
      const targetPage = urlMapping[linkText];

      if (targetPage) {
        // 1. Define a clear action for the log
        const actionDescription = `Navigation: Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

        // 2. ASYNCHRONOUS AUDIT LOG: Log the action.
        logUserAction(actionDescription);

        // 3. Perform the page redirect immediately after initiating the log.
        window.location.href = targetPage;
      } else {
        console.error('No page defined for this link:', linkText);
        
        // OPTIONAL: Log the failed navigation attempt
        logUserAction(`Failed Navigation: Clicked link "${this.textContent}" with no mapped page.`);
      }
    });
  });

  // Handle the logout button securely
  // The PHP script 'PHP/check_logout.php' should handle the log *before* session destruction.
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      window.location.href = 'PHP/check_logout.php'; 
    });
  }
});
/*=============================================================================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the buttons by their IDs
    const passwordChangeBtn = document.getElementById('password-change-btn');
    const usernameChangeBtn = document.getElementById('username-change-btn');
    const accountCreationBtn = document.getElementById('account-creation-btn');
    const existingAccountsBtn = document.getElementById('existing-accounts-btn');

    // Add an event listener for each button
    if (passwordChangeBtn) {
        passwordChangeBtn.addEventListener('click', () => {
            window.location.href = 'UserPasswordChange.html';
        });
    }

    if (usernameChangeBtn) {
        usernameChangeBtn.addEventListener('click', () => {
            window.location.href = 'UserUsernameChange.html';
        });
    }

    if (accountCreationBtn) {
        accountCreationBtn.addEventListener('click', () => {
            window.location.href = 'UserCreation.html';
        });
    }

    if (existingAccountsBtn) {
        existingAccountsBtn.addEventListener('click', () => {
            window.location.href = 'UserExisting.html';
        });
    }
});
/*================================= */
const fetchPendingAccounts = () => {
    fetch('PHP/userexisting_handler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector('.pending-account-table-body');
            tableBody.innerHTML = '';

            if (data.length > 0) {
                data.forEach(user => {
                    const row = document.createElement('div');
                    row.classList.add('table-row');
                    row.innerHTML = `
                        <div class="table-cell small-column">
                            <input type="radio" 
                                   id="select-${user.id}" 
                                   name="selected" 
                                   value="${user.id}">
                        </div>
                        <div class="table-cell">${user.id}</div>
                        <div class="table-cell">${user.name}</div>
                        <div class="table-cell">${user.username}</div>
                        <div class="table-cell">${user.role}</div>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                const emptyRow = document.createElement('div');
                emptyRow.classList.add('table-row');
                emptyRow.innerHTML = `<div class="table-cell" style="text-align: center;">No pending accounts found.</div>`;
                tableBody.appendChild(emptyRow);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Failed to load pending accounts. Please try again later.');
        });
};
fetchPendingAccounts();

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