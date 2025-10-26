document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    // Ensure the keys here match the text content of your <a> tags or the new button text exactly.
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer'], // Main 'Tools' link access
        
        // 🚨 NEW ACCESS RULES FOR SUBMENU BUTTONS 🚨
        'Backup And Restore': ['Admin'],
        'Interest Amount': ['Admin'],
        // Note: The role in the new button rule should be 'Loan_Officer' to match your existing roles.
        'User Management': ['Admin', 'Manager', 'Loan_Officer']
    };

    // 2. Fetch the current user's role
    fetch('PHP/check_session.php')
        .then(response => {
            // Check if the response is successful (HTTP 200)
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Ensure the session is active and a role is returned
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
            // Optionally hide all nav links on severe error
            // document.querySelector('.sidebar-nav ul').style.display = 'none';
        });

    // 3. Apply Access Control
    function applyAccessControl(userRole) {
        // --- Access Control for Main Navigation Links (a tags) ---
        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');

        navLinks.forEach(link => {
            const linkName = link.textContent.trim();
            const parentListItem = link.parentElement; // The <li> element

            // Check if the link name exists in the access rules
            if (accessRules.hasOwnProperty(linkName)) {
                const allowedRoles = accessRules[linkName];

                // Check if the current user's role is in the list of allowed roles
                if (!allowedRoles.includes(userRole)) {
                    // Hide the entire list item (<li>) if the user role is NOT authorized
                    parentListItem.style.display = 'none';
                }
            } else {
                console.warn(`No main navigation access rule defined for: ${linkName}`);
            }
        });

        // --- Access Control for Tools Submenu Buttons (new logic) ---
        const toolsButtons = document.querySelectorAll('.tools-menu .menu-button');

        toolsButtons.forEach(button => {
            const buttonName = button.textContent.trim();

            // Check if the button name exists in the access rules
            if (accessRules.hasOwnProperty(buttonName)) {
                const allowedRoles = accessRules[buttonName];

                // Check if the current user's role is in the list of allowed roles
                if (!allowedRoles.includes(userRole)) {
                    // Hide the button if the user role is NOT authorized
                    button.style.display = 'none';
                }
            } else {
                console.warn(`No tools submenu access rule defined for: ${buttonName}`);
            }
        });
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

  // Handle the logout button securely (Existing Logic)
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      window.location.href = 'PHP/check_logout.php'; 
    });
  }
});
/*=======================================================================================================================================*/
// JS/toolsinterest_function.js

/**
 * Generates the HTML structure for the Interest Rate History table.
 * @param {Array<Object>} ratesData - Array of rate objects to populate the table.
 * @returns {string} The HTML string for the table history section.
 */
function generateInterestRateHistoryHtml(ratesData = []) {
    
    // Function to generate the table rows (body content)
    const generateTableBody = (rates) => {
        if (!rates || rates.length === 0) {
            // Updated colspan to 4
            return `<tr><td colspan="4" style="text-align: center;">No interest rate history available.</td></tr>`;
        }

        return rates.map(rate => {
            const statusColor = rate.status === 'activated' ? 'green' : 'red';
            const statusText = rate.status;
            
            // Removed actionCellContent and isActivated logic as the action column is gone.

            return `
                <tr data-interest-id="${rate.interest_ID}" data-status="${rate.status}">
                    <td style="border: 1px solid #ddd; padding: 8px;">${rate.interest_ID}</td>
                    <td class="rate-value editable" style="border: 1px solid #ddd; padding: 8px;">${rate.Interest_Pecent}%</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${rate.date_created}</td>
                    <td class="rate-status" style="border: 1px solid #ddd; padding: 8px; color: ${statusColor}; font-weight: bold;">${statusText}</td>
                    </tr>
            `;
        }).join('');
    };

    const tableBodyContent = generateTableBody(ratesData);

    // This returns the complete structure, including the H3, container, THEAD, and TFOOT
    return `
        <div class="tool-section">
            <h3>Interest Rate History</h3>
            <div class="table-container" style="max-height: 350px; overflow-y: auto; border: 1px solid #ccc; padding: 5px;">
                <table id="interest-history-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px;">Rate ID</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Percentage</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Date Created</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
                            </tr>
                    </thead>
                    <tbody id="interest-rates-body">
                        ${tableBodyContent}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ---------------------------------------------------------------------
// Primary Application Logic
// ---------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Target the container ID in the HTML
    const container = document.getElementById('interest-history-container'); 
    
    // Only proceed if the container exists
    if (container) {
        // Fetch the data and render the complete table
        fetchInterestRates(container);
    }
    
    // Add event listener for the new interest rate form (optional, but good practice)
    const newInterestForm = document.getElementById('new-interest-form');
    if (newInterestForm) {
        newInterestForm.addEventListener('submit', handleNewRateSubmission);
    }

    // Set today's date on the disabled input
    const dateStartInput = document.getElementById('date_start');
    if (dateStartInput) {
        dateStartInput.value = new Date().toISOString().split('T')[0];
    }
});

/**
 * Fetches all interest rates from the backend and renders the table.
 */
function fetchInterestRates(container) {
    // Inject a loading message before fetching
    container.innerHTML = `<p style="text-align: center; padding: 20px;">Loading interest rate history...</p>`;

    fetch('PHP/toolsinterest_handler.php')
        .then(response => {
            // Check if the response is valid JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                 // Handle non-JSON responses (e.g., PHP error page)
                console.error('Received non-JSON response from API:', response);
                throw new Error('Server returned non-JSON response.');
            }
        })
        .then(data => {
            if (data.success && data.data) {
                // Re-render the entire component with fetched data
                container.innerHTML = generateInterestRateHistoryHtml(data.data);
                // Removed attachDeactivateListeners() call since the buttons are gone
                
                // OPTIONAL: Update the active rate display
                const activeRate = data.data.find(rate => rate.status === 'activated');
                const activeRateElement = document.getElementById('active-interest-rate');
                if (activeRate && activeRateElement) {
                     activeRateElement.textContent = `${activeRate.Interest_Pecent}%`;
                } else if (activeRateElement) {
                     activeRateElement.textContent = `N/A (No active rate)`;
                     activeRateElement.style.color = '#dc3545';
                }

            } else {
                // Render with an empty array to show "No rates found" or custom message
                container.innerHTML = generateInterestRateHistoryHtml([]);
                const tbody = container.querySelector('#interest-rates-body');
                if(tbody) {
                    // Updated colspan to 4
                    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #007bff;">${data.message || 'No interest rates found.'}</td></tr>`;
                }
                console.error(data.message || 'Error fetching rates.');
            }
        })
        .catch(error => {
            console.error('Initial Fetch Error:', error);
            // Modified to render a generic error message
            container.innerHTML = generateInterestRateHistoryHtml([]); 
            const tbody = container.querySelector('#interest-rates-body');
            if(tbody) {
                // Updated colspan to 4
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error connecting to API or fetching data. Check server logs.</td></tr>`;
            }
        });
}

/*=======================================================================================================================================*/


 document.addEventListener('DOMContentLoaded', () => {
        const activeRateSpan = document.getElementById('active-interest-rate');
        const form = document.getElementById('new-interest-form');
        const container = document.getElementById('interest-history-container'); // Get the container reference

        // Function to fetch and display the active rate
        const fetchActiveRate = async () => {
            // ... (rest of the fetchActiveRate function remains the same)
            try {
                const response = await fetch('PHP/toolinterestactive_handler.php'); // Assuming a new file for GET
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                if (data.success) {
                    activeRateSpan.textContent = `${data.rate}%`;
                } else {
                    console.error('Failed to fetch active rate:', data.message);
                    activeRateSpan.textContent = 'N/A';
                }
            } catch (error) {
                console.error('Error fetching active rate:', error);
                // Fallback to the value from the HTML
            }

        };
        
        // **Initial fetch (or use the value pre-filled in the HTML)**
        // fetchActiveRate(); // Uncomment this if you implement the separate GET endpoint

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newRateInput = document.getElementById('new_rate');
            const newRate = parseInt(newRateInput.value);
            
            if (isNaN(newRate) || newRate < 1 || newRate > 100) {
                alert('Please enter a valid interest rate between 1 and 100.');
                return;
            }

            const formData = new FormData();
            formData.append('new_rate', newRate);

            try {
                const response = await fetch('PHP/toolsinterestupdate_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();

                if (data.success) {
                    alert(data.message);
                    // Update the displayed active rate
                    activeRateSpan.textContent = `${data.new_rate}%`; 
                    // Clear the input field
                    newRateInput.value = '';
                    
                    // 🚀 ADDED: Re-fetch and re-render the table history!
                    if (container) {
                        fetchInterestRates(container);
                    }
                    
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Submission error:', error);
                alert('An unexpected error occurred during submission.');
            }
        });
        
    });