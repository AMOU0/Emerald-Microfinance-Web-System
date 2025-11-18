
// Global Logging Function
function logUserAction(actionType, description) {
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
document.addEventListener('DOMContentLoaded', function() {

    /*===============================================================================================================*/
    // Global Utility Function: LOG USER ACTIONS
    // This function sends user interaction data to a PHP script for logging purposes.


    /*===============================================================================================================*/

    // 1. Define ALL Access Rules
    // The role 'loan officer' has been changed to 'loan_officer' everywhere.
    // All roles are stored in lowercase for robust, case-insensitive matching.
    const accessRules = {
        // Main Navigation Links (.sidebar-nav ul li a)
        'Dashboard': ['admin', 'manager', 'loan_officer'],
        'Client Creation': ['admin', 'loan_officer'],
        'Loan Application': ['admin', 'loan_officer'],
        'Pending Accounts': ['admin', 'manager'],
        'For Release': ['admin', 'manager', 'loan_officer'],
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
                const userName = data.user_name || 'System User';
                window.currentUserName = userName;
                // Pass the normalized role to the single control function
                applyAccessControl(userRole);
            } else {
                                const defaultName = data.user_name || 'Guest';
                window.currentUserName = defaultName;
                // Treat inactive session as having a 'none' role (hides everything)
                applyAccessControl('none');
            }
        })
        .catch(error => {
            console.error('Error fetching user session:', error);
                        console.error('There was a problem with the fetch operation:', error);
            window.currentUserName = 'Error User';
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

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    const reportButtons = document.querySelectorAll('.report-button');
    const returnButton = document.querySelector('.return-btn');

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
     const reportUrlMapping = {
        'existingclients': 'ReportsExistingClient.html',
        'releasedlist': 'ReleasedLoan.html',
        'collectionlist': 'CollectionToday.html',
        'duepayments': 'ReportsDuePayments.html',
        'overdue': 'ReportsDelinquentAccounts.html', 
        'audittrail': 'ReportsAuditTrail.html',
    };

    navLinks.forEach(link => {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        navLinks.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');

        const linkText = this.textContent.toLowerCase().replace(/\s/g, '');
        const targetPage = urlMapping[linkText];

        if (targetPage) {
          const action = 'NAVIGATION';
          const description = `Mapsd from Ledgers View to ${this.textContent} page.`;

          logUserAction(action, description);

          window.location.href = targetPage;
        } else {
          console.error('No page defined for this link:', linkText);
          logUserAction('FAILED_NAVIGATION', `Failed Navigation: Clicked link "${this.textContent}" with no mapped page.`);
        }
      });
    });

        // --- Reports Sidebar Navigation Handler ---
    reportButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();

            const buttonText = this.textContent.toLowerCase().replace(/\s/g, '');
            const targetPage = reportUrlMapping[buttonText];

            if (targetPage) {
                const actionType = 'VIEW';
                const description = `Viewed Report: ${this.textContent} (${targetPage})`;

                logUserAction(actionType, description);

                window.location.href = targetPage;
            } else {
                console.error('No page defined for this report button:', buttonText);

                const actionType = 'VIEW';
                const description = `FAILED: Clicked report button "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });

    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        logUserAction('LOGOUT_CLICK', 'User clicked the Logout button to terminate session.');
        window.location.href = 'PHP/check_logout.php';
      });
    }

    if (returnButton) {
        returnButton.addEventListener('click', returnToReportsExistingClient);
    }
});

/**
 * Function to navigate the browser directly to ReportsExistingClient.html WITH logging.
 */
function returnToReportsExistingClient() {
    const targetPage = 'ReportsExistingClient.html';
    const description = `Executed 'returnToReportsExistingClient' function, redirecting to ${targetPage}`;

    logUserAction('NAVIGATION', description);

    window.location.href = targetPage;
}
/*===============================================================================================================*/

// Function to get the client ID from the URL query parameters
function getClientIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('clientId');
}

// Function to populate a single data description element
function populateDataElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value || 'N/A';
    }
}

// Main function to fetch and display client details
async function fetchAndDisplayClientDetails() {
    const clientId = getClientIdFromUrl();

    if (!clientId) {
        console.error("No Client ID found in URL.");
        populateDataElement('client-id-dd', 'Error: ID missing');
        return;
    }

    document.getElementById('clientIdInput').value = clientId;
    populateDataElement('client-id-dd', clientId);

    const apiUrl = `PHP/reportsexistingclientview_handler.php?client_id=${clientId}`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error("Server Error:", data.error);
            populateDataElement('client-name-dd', data.error);
            return;
        }

        populateDataElement('client-name-dd', data.client_name);
        populateDataElement('marital-status-dd', data.marital_status);
        populateDataElement('gender-dob-dd', data.gender_dob);
        populateDataElement('address-dd', data.address);

        populateDataElement('contact-dd', data.contact);

        populateDataElement('income-collateral-dd', data.employment_income);
        populateDataElement('income-collateral-dd-2', data.collateral);

    } catch (error) {
        console.error("Could not fetch client details:", error);
        populateDataElement('client-name-dd', 'Failed to load details.');
    }
}

// Execute the function when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayClientDetails);

/*=============================================================================================================================================================================*/


function loadLoanDetailsFromDatabase(clientId) {
    const container = document.getElementById('dynamicLoanContent');
    container.innerHTML = '<p>Fetching loan details...</p>';

    fetch(`PHP/reportsexistingclientviewschedule_handler.php?clientId=${clientId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.error) {
                 container.innerHTML = `<p>Error from server: ${data.error}</p>`;
                 return;
            }

            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = `<p>No loan details found for Client ID: <strong>${clientId}</strong>.</p>`;
                return;
            }

            container.innerHTML = '';

            // --- 1. Display Client Info (Only Once) ---
            const clientInfo = data[0];

            const clientDetailsDiv = document.createElement('div');
            clientDetailsDiv.innerHTML = `
                <h2>Loan History for ${clientInfo['Client Name'] || 'Unknown Client'}</h2>
                <hr>
            `;
            container.appendChild(clientDetailsDiv);

            // --- 2. Define headers for the LOAN TABLE ---
            const headers = [
                'Loan ID',
                'Amount (w/ Interest)',
                'Total Paid',
                'Remaining Balance',
                'Term (Duration / Freq.)',
                'Start Date',
                'End Date'
            ];

            // --- 3. Create Table Elements ---
            const table = document.createElement('table');
            table.classList.add('loan-details-table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            // Create Header Row
            const headerRow = document.createElement('tr');
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // --- 4. Create Data Rows (Loop through ALL loans) ---
            data.forEach(loan => {
                const dataRow = document.createElement('tr');
                dataRow.classList.add('clickable-loan-row');
                dataRow.setAttribute('data-loan-id', loan['Loan ID']);

                headers.forEach(headerKey => {
                    const td = document.createElement('td');
                    let value = loan[headerKey];

                    if (['Amount (w/ Interest)', 'Total Paid', 'Remaining Balance'].includes(headerKey) && value !== undefined) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                            value = `PHP ${numValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        } else {
                            value = 'N/A';
                        }
                    } else if (value === undefined || value === null) {
                        value = 'N/A';
                    }

                    td.textContent = value;
                    dataRow.appendChild(td);
                });

                tbody.appendChild(dataRow);
            });

            table.appendChild(tbody);

            // --- 5. Append Table and Add Click Handlers ---
            container.appendChild(table);

            document.querySelectorAll('.clickable-loan-row').forEach(row => {
                row.style.cursor = 'pointer';
                row.addEventListener('click', function() {
                    const loanId = this.getAttribute('data-loan-id');
                    if (loanId) {
                        showLoanDetailsModal(loanId);
                        logUserAction('VIEW', `Opened Loan Detail Modal for Loan ID: ${loanId}.`);
                    }
                });
            });


        })
        .catch(error => {
            console.error('Error fetching loan data:', error);
            container.innerHTML = `<p>Error loading loan details: ${error.message}</p>`;
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('dynamicLoanContent');
    const urlParams = new URLSearchParams(window.location.search);

    const targetClientId = urlParams.get('clientId');
    if (targetClientId) {
        loadLoanDetailsFromDatabase(targetClientId);
    } else {
        container.innerHTML = '<p>🛑 **Error**: No client ID found in the URL. Please ensure the URL contains <code>?client_id=CLIENT_ID</code>.</p>';
        console.error('No client_id parameter found in the URL.');
    }
});
/*=======================================================================================================================================================================*/


/**
  * ## Modal Box Logic (Combined View)
  * Fetches both the standard loan data sets and displays them in a single modal.
  * @param {string} loanId - The ID of the loan to display in the modal.
  */
function showLoanDetailsModal(loanId) {
      const modal = document.getElementById('loanDetailModal');
      const modalContent = document.getElementById('modalBodyContent');
      const modalHeader = modal.querySelector('.modal-header');

      // 1. Set Header Title
      const headerTitle = document.getElementById('modalTitle');
      if (headerTitle) {
            headerTitle.textContent = `Loan Ledger (ID: ${loanId})`;
      }

      // 2. Show a loading state in the modal
      modalContent.innerHTML = `<p class="loading-message">Loading ledger details for Loan ID: ${loanId}...</p>`;

      if (modal) {
            // Use 'flex' here to enable the CSS centering properties
            modal.style.display = 'flex';

            // This was the print preparation step, removing it as printing is removed.
            // document.body.classList.add('modal-open');
      }

      // 3. Fetch both detailed loan data sets concurrently
      const fetchStandard = fetch(`PHP/reportsexistingclientviewfetchloan_handler.php?loanId=${loanId}`).then(res => {
            if (!res.ok) throw new Error(`Standard Ledger fetch failed with status: ${res.status}`);
            return res.json();
      });
      const fetchReconstruct = fetch(`PHP/reportsexistingviewreconstruct_handler.php?loanId=${loanId}`).then(res => {
            if (!res.ok) throw new Error(`Reconstruction Ledger fetch failed with status: ${res.status}`);
            return res.json();
      });

      Promise.all([fetchStandard, fetchReconstruct])
            .then(([standardDetails, reconstructDetails]) => {

                  // Check for server-side errors
                  if (standardDetails.error || reconstructDetails.error) {
                          modalContent.innerHTML = `<p class="error-message">Server Error: ${standardDetails.error || reconstructDetails.error}</p>`;
                          return;
                  }

                  // Standard Details (used for main summary and ALL payments)
                  const standardSchedule = standardDetails.Schedule || {};
                  // Use the comprehensive payment list from standardDetails
                  const allPaymentsTableHTML = createPaymentsTable(standardDetails.Payments, 'All Payments (Standard & Reconstruction)');


                  // Reconstruction Details (used for secondary summary and specific payments)
                  const reconstructSchedule = reconstructDetails.Schedule || {};

            // ** START: CONDITIONAL LOGIC FOR RECONSTRUCTION SECTION **
            let reconstructionSummaryHTML = '';
            let reconstructionPaymentsHTML = '';

            const hasReconstructionPayments = Array.isArray(reconstructDetails.Payments) && reconstructDetails.Payments.length > 0;

            if (hasReconstructionPayments) {
                const reconstructPaymentsTableHTML = createPaymentsTable(reconstructDetails.Payments, 'Reconstruction');

                // 1. Build the Reconstruction Summary block
                reconstructionSummaryHTML = `
                    <hr class="summary-separator">
                    <div class="summary-section">
                        <h5>Reconstruction Summary (Separate Table)</h5>
                        <div class="info-columns">
                            <div class="info-item">
                                <span class="info-label">Reconstruction Payments:</span>
                                <strong class="info-value">${reconstructSchedule['Total_Payments_Recorded'] || '0'}</strong>
                            </div>
                        </div>
                    </div>
                `;

                // 2. Build the Reconstruction Payments table block
                reconstructionPaymentsHTML = `
                    <div class="payment-history-section reconstruction-payments-table">
                        <h4 class="section-title-payments">Reconstruction Payments</h4>
                        ${reconstructPaymentsTableHTML}
                    </div>
                `;
            }

            // ** END: CONDITIONAL LOGIC FOR RECONSTRUCTION SECTION **


                  // 4. Render the combined view (Printing HTML/footer removed)
                  modalContent.innerHTML = `
                        <div class="ledger-content">
<h1 class="print-header">Emerald Microfinance</h4>
<p class="print-header">Northern Hill Phase 2, San Rafael, Tarlac City</p>
                              <div class="info-box simplified-summary">
                                    <h4 class="info-header">Loan Summary</h4>

                                    <div class="summary-section">
                                          <div class="info-columns">
                                                <div class="info-item">
                                                      <span class="info-label">Original Principal:</span>
                                                      <strong class="info-value">PHP ${standardSchedule['Loan_Amount'] || 'N/A'}</strong>
                                                </div>
                                                <div class="info-item"></div>
                                                <div class="info-item">
                                                      <span class="info-label">Annual Interest Rate:</span>
                                                      <strong class="info-value">${standardSchedule['Interest_Rate'] || 'N/A'}%</strong>
                                                </div>
                                                <div class="info-item">
                                                      <span class="info-label">Total Payments Recorded:</span>
                                                      <strong class="info-value">${standardSchedule['Total_Payments_Recorded'] || '0'}</strong>
                                                </div>
                                          </div>
                                    </div>

                                    ${reconstructionSummaryHTML}
                              </div>


                              <div class="payment-history-section">
                                    <h4 class="section-title-payments">Payment History</h4>
                                    ${allPaymentsTableHTML}
                              </div>

                              ${reconstructionPaymentsHTML}
                      <div class="modal-footer p-4 border-t flex justify-end space-x-2 print-hide">
                <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors" onclick="printLoanDetails()">Print</button>
                  </div>
                        </div>
                        <div class="footer">
    <div class="value">Prepared by: <span class="prepared-by-user-name">${window.currentUserName}</span></div>
</div>
                  `;
            })
            .catch(error => {
                  console.error('Error fetching combined loan data:', error);
                  modalContent.innerHTML = `<p class="error-message">Failed to load ledger details: ${error.message}</p>`;
            });
}
/**
 * Generates the HTML table for loan payments.
 * @param {Array<Object>} payments - An array of payment objects.
 * @param {string} type - 'Standard' or 'Reconstruction' for context in message.
 * @returns {string} The HTML string for the payments table or a 'No payments' message.
 */
function createPaymentsTable(payments, type) {
    if (!payments || payments.length === 0) {
        return `<p class="info-message">No ${type.toLowerCase()} payments recorded for this loan.</p>`;
    }

    let tableRows = '';
    // Generate a row for each payment
    payments.forEach((payment) => {
        const formattedAmount = `PHP ${payment['Amount'] || 'N/A'}`;
        const formattedBalance = `PHP ${payment['RemainingBalance'] || 'N/A'}`;

        // Use the new 'Type' field from the PHP handler
        tableRows += `
            <tr>
                <td>${payment['PaymentDate'] || 'N/A'}</td>
                <td>${payment['Type'] || 'N/A'}</td> <td class="amount-column">${formattedAmount}</td>
                <td class="amount-column">${formattedBalance}</td>
            </tr>
        `;
    });

    return `
        <div class="table-responsive">
            <table class="payment-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Payment Type/ID</th> <th class="amount-column">Amount Paid</th>
                        <th class="amount-column">Balance After Payment</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}
/*===============================================================================================================*/
/* OTHER MODAL FUNCTIONS */
/*===============================================================================================================*/

/**
 * Function to close the modal.
 */
function closeModal() {
    const modal = document.getElementById('loanDetailModal');

    if (modal) {
        modal.style.display = 'none';
        // document.body.classList.remove('modal-open'); // Removed as modal-open is no longer used for printing
        document.getElementById('modalBodyContent').innerHTML = '';
    }
}

// Attach event listeners after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('loanDetailModal');

    // 1. Listener for the static close button ('X')
    const closeButton = document.getElementById('closeModalButton');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
             logUserAction('VIEW', 'Closed Loan Detail Modal via button.');
             closeModal();
        });
    }

    // 2. Listener for outside click (on the modal backdrop)
    if (modal) {
        window.addEventListener('click', (event) => {
            // Check if the modal is currently visible AND the click target is the modal backdrop
            if (modal.style.display === 'flex' && event.target === modal) {
                logUserAction('VIEW', 'Closed Loan Detail Modal via outside click.');
                closeModal();
            }
        });
    }

    // 3. Listener for the Escape Key
    document.addEventListener('keydown', (event) => {
        // Check if the key pressed is 'Escape' and the modal is visible
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            logUserAction('VIEW', 'Closed Loan Detail Modal via Escape key.');
            closeModal();
        }
    });
});


/**
 * Triggers the browser's print dialog for the loan details modal content.
 * It temporarily hides all other page elements for a clean printout.
 */
function printLoanDetails() {
    // 1. Get the content of the modal body
    const contentToPrint = document.getElementById('modalBodyContent').innerHTML;

    // 2. Open a new window/tab for printing
    // A more modern and robust approach is to directly print the modal content
    // after styling the main body and the content for print media, but for
    // simplicity and compatibility, we can use a new window/iframe or
    // simply rely on CSS media queries.

    // *** RECOMMENDED METHOD: Use CSS Media Queries and window.print() ***

    // We'll rely on a temporary print wrapper for this method to ensure
    // only the desired content is printed, especially if the modal is not
    // positioned at the top of the page.

    const printWindow = window.open('', '_blank');

    // Construct the print-friendly HTML page
    printWindow.document.write('<html><head><title>Loan Ledger Printout</title>');

    // Include necessary styles for tables/layout to look good in print
    // **NOTE**: You should ideally copy over the relevant CSS styles from your main page
    // or link your main stylesheet here. For a minimum, include basic structure.
    printWindow.document.write('<style>');
    printWindow.document.write(`
        body { font-family: Arial, sans-serif; margin: 20px; }

        .ledger-content { max-width: 800px; margin: 0 auto; }
        h4, h5 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
        .info-box { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
        .info-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .info-item { padding: 5px 0; border-bottom: 1px dotted #eee; }
        .info-label { font-weight: normal; color: #555; display: inline-block; min-width: 150px; }
        .info-value { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f2f2f2; }
    `);
    printWindow.document.write('</style></head><body>');

    // Write the content to the new window
    printWindow.document.write(contentToPrint);

    // Exclude the modal footer with the buttons from the printout
    // We can do this by wrapping the *printable* content in the modal in an ID,
    // but a quick fix is to remove the footer from the content to print if it was included.
    // Since we're taking the `modalBodyContent`'s innerHTML, the footer is not included,
    // which is perfect.

    printWindow.document.write('</body></html>');
    printWindow.document.close(); // Close the document writing stream

    // Wait for content to render, then print
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close(); // Close the window after printing (or canceling)
    };
}