document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    // Ensure the keys here match the text content of your <a> tags exactly.
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer']
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
                // If not logged in, you might want to hide everything or redirect
                // For now, we'll assume the 'none' role has no access, which the loop handles.
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
        // Select all navigation links within the sidebar
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
                // Optional: Hide links that are not defined in the accessRules for safety
                // parentListItem.style.display = 'none';
                console.warn(`No access rule defined for: ${linkName}`);
            }
        });
    }
});
//==============================================================================================================================================
document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    // Ensure the keys here match the text content of your <a> tags exactly.
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer']
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
                // If not logged in, you might want to hide everything or redirect
                // For now, we'll assume the 'none' role has no access, which the loop handles.
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
        // Select all navigation links within the sidebar
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
                // Optional: Hide links that are not defined in the accessRules for safety
                // parentListItem.style.display = 'none';
                console.warn(`No access rule defined for: ${linkName}`);
            }
        });
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
  
  // *** Make the logging function globally accessible for use in other blocks ***
  window.logUserAction = logUserAction;
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
        // 1. Define clear action type and description for the log
        const actionType = 'NAVIGATION'; // Use the fixed type for filtering
        const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

        // 2. ASYNCHRONOUS AUDIT LOG: Log the action.
        logUserAction(actionType, description);

        // 3. Perform the page redirect immediately after initiating the log.
        window.location.href = targetPage;
      } else {
        console.error('No page defined for this link:', linkText);
        
        // OPTIONAL: Log the failed navigation attempt
        const actionType = 'NAVIGATION';
        const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
        logUserAction(actionType, description);
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
/*======================================================================================================== */
// Note: I'm defining a dummy logUserAction for this example since it was in your original code
        window.logUserAction = (action, details) => {
            console.log(`[USER ACTION] ${action}: ${details}`);
        };
        
        // *** DASHBOARD CLICK HANDLER ***
        document.addEventListener('DOMContentLoaded', () => {
            // 1. Define the mapping of tile keys (from HTML) to their respective URLs
            const tileUrlMap = {
                'tile-1': 'AccountsReceivable.html', 
                'tile-2': 'ReportsRelease.html', 
                'tile-3': 'ReportsDuePayments.html', // Due Today (Report)
                'tile-5': 'ReportsDelinquentAccounts.html', 
                'tile-6': 'PendingAccount.html', 
                'tile-7': 'Ledgers.html', 
                'tile-9': 'ReportsExistingClient.html' 
            };
            
            // Select all elements with the 'data-tile-key' attribute in the tiles-grid section
            const clickableTiles = document.querySelectorAll('.tiles-grid [data-tile-key]');

            // Attach a click listener to each tile
            clickableTiles.forEach(tile => {
                tile.addEventListener('click', () => {
                    // Get the unique key from the data attribute
                    const tileKey = tile.getAttribute('data-tile-key');
                    
                    // Look up the corresponding target URL from the map
                    const targetUrl = tileUrlMap[tileKey];
                    const tileTitle = tile.querySelector('h3') ? tile.querySelector('h3').textContent : 'Dashboard Tile';

                    // --- FILTER LOGIC FOR REPORTS (SIMPLIFIED for tile-3) ---
                    if (tileKey === 'tile-3') {
                        // The filter logic for localStorage is REMOVED.
                        // The log is simplified to a standard navigation log.
                        if (window.logUserAction) {
                            window.logUserAction('NAVIGATION', `Clicked dashboard tile: ${tileTitle}, redirecting to ${targetUrl}`);
                        }
                    } else if (window.logUserAction) {
                        // Log other tile clicks as general navigation
                        window.logUserAction('NAVIGATION', `Clicked dashboard tile: ${tileTitle}, redirecting to ${targetUrl}`);
                    }
                    // --- END FILTER LOGIC ---

                    // Check if a target URL exists before redirecting
                    if (targetUrl) {
                        console.log(`Redirecting from key ${tileKey} to: ${targetUrl}`);
                        // Perform the redirection
                        window.location.href = targetUrl;
                    } else {
                        console.warn(`Clickable tile with key '${tileKey}' has no target URL defined in JavaScript map.`);
                    }
                });
            });
        });
/* ======================================================================================================================*/

document.addEventListener('DOMContentLoaded', function() {
    fetchLoanCounts();
});

function fetchLoanCounts() {
    // Make sure the URL matches the PHP file you created (e.g., fetch_loan_counts.php)
    const url = 'PHP/dashboardfetchcount_handler.php'; 

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const counts = data.counts;

                // Update Pending Loans (Tile 6)
                const pendingElement = document.getElementById('pending-loans-count');
                if (pendingElement) {
                    pendingElement.textContent = counts.pending_loans_count;
                }

                // Update Active Loans (Tile 7)
                const activeElement = document.getElementById('active-loans-count');
                if (activeElement) {
                    activeElement.textContent = counts.active_loans_count;
                }
            } else {
                console.error('PHP script failed to fetch counts:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching loan counts:', error);
        });
}

/*=================================================================================================*/

// Function to fetch the client count from the PHP endpoint
function fetchTotalClients() {
    // 1. Call the PHP script (fetch_client_count.php)
    fetch('PHP/dashboardclientcount_handler.php')
        .then(response => {
            // Check for a successful HTTP status (200 OK)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // 2. Parse the JSON response
            return response.json();
        })
        .then(data => {
            // 3. Check for the 'success' flag from the PHP script
            if (data.success) {
                const totalClientsElement = document.getElementById('total-clients-value');
                
                // 4. Update the HTML element with the fetched count
                if (totalClientsElement) {
                    // Use toLocaleString() for better number formatting (e.g., with commas)
                    totalClientsElement.textContent = data.totalClients.toLocaleString(); 
                }
            } else {
                console.error('Failed to fetch total clients:', data.message);
                // Optional: Display an error message to the user
                document.getElementById('total-clients-value').textContent = 'Error';
            }
        })
        .catch(error => {
            console.error('Fetch operation failed:', error);
            document.getElementById('total-clients-value').textContent = 'Net Error';
        });
}

// Execute the function once the entire page is loaded
document.addEventListener('DOMContentLoaded', fetchTotalClients);
/*=====================================================================================================================================*/

// Function to set the current date in the dashboard header
function setCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        // Date options for M/D/YYYY format
        const dateOptions = {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        };
        const dateOnlyInPH = new Date().toLocaleString('en-US', dateOptions);

        // Time options for live display
        const timeOptions = {
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
        };
        const timeOnlyInPH = new Date().toLocaleTimeString('en-US', timeOptions);

        // Update the element text
        dateElement.textContent = `${dateOnlyInPH} - ${timeOnlyInPH}`;
    }
}

// Start the clock: call once immediately, then repeat every second
setCurrentDate();
setInterval(setCurrentDate, 1000);
/*=====================================================================================================================================*/
// Function to update the existing "For Release" tile 
async function updateReleaseTile() {
    // 1. Get the elements using the IDs
    const valueElement = document.getElementById('release-value-display');
    const dateElement = document.getElementById('release-date-display');

    if (!valueElement || !dateElement) {
        console.error('ERROR: Required tile elements not found (IDs: release-value-display or release-date-display).');
        return;
    }

    try {
        // 2. Fetch the data from the PHP script
        const response = await fetch('PHP/dashboardrelease_handler.php');
        
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            console.error('SERVER ERROR:', data.error);
            valueElement.textContent = `PHP N/A`;
            dateElement.textContent = `Error: Check Server Log`;
            return;
        }

        const { date, day, amount, currency } = data; // Uses 'date' and 'day' from PHP
 
        // 3. Update the existing HTML elements
        valueElement.textContent = `${currency} ${amount}`; 
        dateElement.textContent = `${day} ${date}`; // Now outputs "For Release (date)"

    } catch (error) {
        console.error('FETCH ERROR: Failed to load "For Release" tile data:', error);
        valueElement.textContent = `PHP N/A`;
        dateElement.textContent = `Error Loading Data`;
    }
}

// Execute all functions once the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    updateReleaseTile();
});
/*=====================================================================================================================================*/

document.addEventListener('DOMContentLoaded', (event) => {
    
    // Function to fetch the amount paid today
async function fetchAmountPaidToday() {
        const displayElement = document.getElementById('collection-today-value');
        if (!displayElement) {
            console.error('Display element with ID "collection-today-value" not found.');
            return;
        }

        try {
            // Make a request to the PHP endpoint
            const response = await fetch('PHP/dashboardpaidtoday_handler.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Format the amount as currency (e.g., "P 1,200.00")
                const formattedAmount = new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                }).format(data.amount);
                
                // Update the dashboard tile
                displayElement.textContent = formattedAmount;
            } else {
                // Display error message from the backend
                displayElement.textContent = 'Error: ' + data.message;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            displayElement.textContent = 'Error fetching data';
        }
    }

fetchAmountPaidToday();
});

/*=================================================================================================*/


/**
 * Calculates payment due dates for a single loan and checks if it's due today.
 * @param {object} loan - The loan object with date_start, date_end, and payment_frequency.
 * @param {Date} today - Today's date (at midnight).
 * @returns {boolean} - True if a payment is due today, false otherwise.
 */
function checkDueDates(loan, today) {
 const startDate = new Date(loan.date_start + 'T00:00:00'); // Ensure timezone neutrality
    const endDate = new Date(loan.date_end + 'T23:59:59');     // End of day
    const frequency = loan.payment_frequency ? loan.payment_frequency.toLowerCase() : '';
    
    let isDueToday = false;

    // Helper to add days/weeks/months to a date without modifying the original
    const addTime = (date, count, unit) => {
        const newDate = new Date(date.getTime());
        if (unit === 'daily') newDate.setDate(newDate.getDate() + count);
        if (unit === 'weekly') newDate.setDate(newDate.getDate() + count * 7);
        // Handle monthly overflow (e.g., adding a month to Jan 31st resulting in Feb 28/29)
        if (unit === 'monthly') newDate.setMonth(newDate.getMonth() + count);
        return newDate;
    };
    
    let intervalUnit = null;
    switch (frequency) {
        case 'daily': intervalUnit = 'daily'; break;
        case 'weekly': intervalUnit = 'weekly'; break;
        case 'monthly': intervalUnit = 'monthly'; break;
        default: return false; // Skip unhandled frequency
    }

    // --- Modification: Determine the FIRST payment date (base date) ---
    let firstPaymentBaseDate = startDate;
    // Date.getDay() returns 0 for Sunday, 1 for Monday, ..., 2 for Tuesday.
    // If the loan start date is a Tuesday (getDay() === 2)
    if (startDate.getDay() === 2) {
        // Set the base date to 1 week (7 days) after the start date.
        // The first payment will be calculated as '1 * interval' after this new base date.
        // However, since the current loop starts at i=1, the first payment is calculated
        // as 1 interval *after* the startDate.
        
        // A simpler and more common approach in loan calculation is to treat 
        // the first payment *period* differently. If the first due date 
        // (which is 1 interval after startDate) is not satisfactory, 
        // we should adjust the *start date* for the iteration.
        
        // To achieve "date start after tuesday 1week after":
        // This implies the **first payment** is one week after the start date, *regardless*
        // of the loan frequency.
        firstPaymentBaseDate = addTime(startDate, 7, 'daily');
        // Now, we need to ensure the iteration logic starts correctly.
        // The current loop starts at i=1, calculating the **1st** payment date.
        
        // If the first payment is 7 days after the start date:
        // 1. If 'daily': 7 days (the 7th day payment)
        // 2. If 'weekly': 7 days (the 1st weekly payment)
        // 3. If 'monthly': 7 days (the 1st monthly payment, which is wrong)
        
        // The existing logic calculates: DueDate = startDate + i * (interval).
        // If the *first payment* is always one week after the start date, 
        // regardless of frequency, we need a special check for the first iteration.
    }
    // Let's stick to the original structure but calculate the first due date explicitly.
    // The requirement "get with date start after tuesday 1week after" is ambiguous.
    // Assuming it means: **If the loan starts on a Tuesday, the FIRST payment is 1 week later.**

    // --- Recalculating the loop start and base date ---
    let loopStartDate = startDate;
    let loopStartIndex = 1; // Start with the first payment (1 * interval)

    // Check for the Tuesday rule: Day 2 is Tuesday (0=Sun, 1=Mon, 2=Tue, 3=Wed...)
    if (startDate.getDay() === 2) {
        // If it starts on Tuesday, the first payment is 7 days after the start date.
        // We will calculate the 1st payment separately and start the loop from the 2nd payment (i=2).
        
        // Calculate the special first due date (7 days after startDate)
        let firstDueDate = addTime(startDate, 7, 'daily');

        // Check Due Today for the special first due date
        const firstDueDateString = firstDueDate.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];
        
        if (firstDueDateString === todayString) {
            return true; // Payment due today
        }

        // If the first due date is after today or the end date, we're done.
        if (firstDueDate > endDate || firstDueDate > today) {
            return false;
        }

        // The sequence for payments 2, 3, 4, etc., *must* be based on the loan frequency,
        // starting from the *first due date*.
        // Therefore, we set the new loop start date to the *first due date* // and start the iteration from i=1 (which calculates the second payment: 
        // firstDueDate + 1 * interval).
        loopStartDate = firstDueDate;
        loopStartIndex = 1; // Start the interval counting from the first due date
    }


    // Iterate through potential payment dates
    // If Tuesday rule applied, loopStartDate is the first due date, and i=1 calculates the second.
    // Otherwise, loopStartDate is the original startDate, and i=1 calculates the first.
    for (let i = loopStartIndex; ; i++) {
        let dueDate = addTime(loopStartDate, i, intervalUnit);
        
        // Stop checking if the due date is after the loan's end date or after today
        if (dueDate > endDate || dueDate > today) {
            break; 
        }

        // Check Due Today
        // We compare the date strings to ignore time component
        const dueDateString = dueDate.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];
        if (dueDateString === todayString) {
            isDueToday = true;
            break; // Found a match for today, no need to check further dates
        }
    }
    
    return isDueToday;
}

/**
 * Fetches loan data from the PHP handler and calculates/updates the dashboard tiles.
 */
function fetchDueCounts() {
    const handlerUrl = 'PHP/dashboardduetoday_handler.php'; 

    // --- Date Calculation ---
    // 1. Today (for comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for date-only comparison

    // --- Fetch Data ---
    fetch(handlerUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let dueTodayCount = 0;
            // Removed: dueThisWeekCount

            if (data.success && Array.isArray(data.loans)) {
                // Iterate over all approved loans returned by PHP
                data.loans.forEach(loan => {
                    // Check payment dates for this loan
                    const isDueToday = checkDueDates(loan, today);
                    
                    if (isDueToday) {
                        dueTodayCount++;
                    }
                });

                // 1. Update the 'Due Today' tile
                document.getElementById('due-today-count').textContent = dueTodayCount;
                
                // Removed: Logic for 'Due this Week' tile
                
            } else {
                console.error('Error fetching due counts:', data.message || 'Data structure invalid.');
                document.getElementById('due-today-count').textContent = 'E';
                // Removed: Error state for 'Due this Week' tile
            }
        })
        .catch(error => {
            console.error('Network or processing error:', error);
            document.getElementById('due-today-count').textContent = 'X';
            // Removed: Error state for 'Due this Week' tile
        });
}

// Execute the function once the entire page content is loaded
document.addEventListener('DOMContentLoaded', fetchDueCounts);
/*==============================================================================================================*/


// JS/xx.js
// Calculates and displays Total Delinquent Accounts and Total Past Due Amount.

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const PHP_FETCH_ENDPOINT = 'PHP/dashboardoverdue_handler.php'; 

    // --- DOM Elements ---
    // UPDATED SELECTOR: Targets the <p class="value"> inside the tile with data-color="overdue"
    const totalDelinquentAccountsEl = document.querySelector('.tile[data-color="overdue"] .value'); 
    
    // NOTE: This assumes a second KPI box exists for the total currency amount.
    const totalDueAmountEl = document.querySelector('.kpi-box:not(.red) .kpi-value'); 
    

    // --- Core Calculation Logic ---

    /**
     * Calculates the number of payments due between the start date and today.
     */
    function calculateExpectedPaymentsDue(startDateString, frequency, today) {
        let startDate = new Date(startDateString);
        startDate.setHours(0, 0, 0, 0);

        if (startDate > today) return 0;

        let count = 0;
        let currentDate = new Date(startDate);
        const maxIterations = 365 * 10; 
        let iteration = 0;
        
        while (currentDate <= today && iteration < maxIterations) {
            count++;
            iteration++;
            
            const freqLower = frequency.toLowerCase();
            if (freqLower.includes('weekly')) {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (freqLower.includes('monthly')) {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (freqLower.includes('daily')) {
                currentDate.setDate(currentDate.getDate() + 1);
            } else {
                currentDate.setMonth(currentDate.getMonth() + 1); 
            }
            
            if (currentDate > today) break;
        }
        
        return count > 0 ? count : 0;
    }
    
    /**
     * Calculates the required fixed installment amount (Principal + Interest / Total Installments).
     */
    function calculateAmortizationDetails(principal_amount, interest_rate, date_start, date_end, payment_frequency) {
        const principal = parseFloat(principal_amount);
        const rate = parseFloat(interest_rate);
        const totalDurationDays = (new Date(date_end) - new Date(date_start)) / (1000 * 3600 * 24);
        const totalInterest = principal * (rate / 100) * (totalDurationDays / 365);
        const totalLoanAmount = principal + totalInterest;
        
        let totalInstallments = 0;
        const durationMonths = totalDurationDays / 30.4375;

        const freqLower = payment_frequency.toLowerCase();
        if (freqLower.includes('weekly')) {
            totalInstallments = Math.round(totalDurationDays / 7);
        } else if (freqLower.includes('monthly')) {
            totalInstallments = Math.round(durationMonths);
        } else {
            totalInstallments = 1; 
        }

        const installmentAmount = totalInstallments > 0 ? totalLoanAmount / totalInstallments : totalLoanAmount;

        return { installment_amount: installmentAmount };
    }


    /**
     * Calculates the Total Delinquent Accounts count and the total currency amount past due.
     */
    function calculateDelinquency(loans) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        let totalDelinquentCount = 0;
        let totalDueAmount = 0;

        loans.forEach(loan => {
            const totalPaid = parseFloat(loan.total_amount_paid);
            
            const amortization = calculateAmortizationDetails(
                loan.principal_amount, loan.interest_rate, loan.date_start, loan.date_end, loan.payment_frequency
            );
            
            // 1. Get count of all installments that should have been paid by today
            const paymentsDueCount = calculateExpectedPaymentsDue(
                loan.date_start, loan.payment_frequency, today
            );
            
            // 2. Calculate total amount that should have been paid
            const expectedAmountDue = paymentsDueCount * amortization.installment_amount;
            
            // 3. Delinquency = Expected Due - Actual Paid
            const delinquencyAmount = expectedAmountDue - totalPaid;
            
            // 4. Update KPIs only if the account is delinquent
            if (delinquencyAmount > 0.01) { 
                totalDelinquentCount++;
                totalDueAmount += delinquencyAmount;
            }
        });

        return {
            totalDelinquentAccounts: totalDelinquentCount,
            totalDueAmount: totalDueAmount,
        };
    }

    // --- Rendering and Fetching Functions ---

    function renderReport(calculatedData) {
        // 1. Update KPI Boxes
        if (totalDelinquentAccountsEl) {
            // UPDATED: Displays the count in the <p class="value"> of the overdue tile
            totalDelinquentAccountsEl.textContent = calculatedData.totalDelinquentAccounts; 
        }
        
        const formatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });
        
        if (totalDueAmountEl) {
            totalDueAmountEl.textContent = formatter.format(calculatedData.totalDueAmount).replace('PHP', '₱'); 
        }
    }

    async function fetchDelinquentAccounts() {
        try {
            const response = await fetch(PHP_FETCH_ENDPOINT);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server Response Text (for diagnosis):", errorText);
                throw new Error(`HTTP error! status: ${response.status}. Check PHP file path/name, and database credentials.`);
            }

            const data = await response.json();

            if (data.success && data.loans) {
                const calculatedData = calculateDelinquency(data.loans); 
                renderReport(calculatedData);
            } else {
                console.error("Backend error:", data.message);
                // Optionally alert the user here
            }

        } catch (error) {
            console.error("Fetch error:", error);
            // Optionally alert the user here
        }
    }
    
    // --- Initialization ---
    fetchDelinquentAccounts();
});