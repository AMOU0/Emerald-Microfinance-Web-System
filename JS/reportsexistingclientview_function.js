document.addEventListener('DOMContentLoaded', function() {
            enforceRoleAccess(['admin','Manager','Loan Officer']); 
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
    const reportButtons = document.querySelectorAll('.report-button'); // Added for report handler
    const returnButton = document.querySelector('.return-btn');

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
    const reportUrlMapping = {
        'existingclients': 'ReportsExistingClient.html',
        'duepayments': 'ReportsDuePayments.html',
 'overdue': 'ReportsDelinquentAccounts.html', 
        'audittrail': 'ReportsAuditTrail.html',
        'reportsrelease': 'ReportsRelease.html'
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
          const targetTable = 'NAVIGATION';
          const targetId = targetPage;

          logUserAction(action, description, targetTable, targetId);

          window.location.href = targetPage;
        } else {
          console.error('No page defined for this link:', linkText);
          logUserAction('FAILED_NAVIGATION', `Failed Navigation: Clicked link "${this.textContent}" with no mapped page.`, 'NAVIGATION', this.textContent);
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

    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        logUserAction('LOGOUT_CLICK', 'User clicked the Logout button to terminate session.', 'SESSION', null);
        window.location.href = 'PHP/check_logout.php'; 
      });
    }

    if (returnButton) {
        returnButton.addEventListener('click', returnToReportsExistingClient);
    }
});

/**
 * Function to navigate the browser directly to Ledgers.html WITH logging.
 */
function returnToReportsExistingClient() {
    const targetPage = 'ReportsExistingClient.html';
    const description = `Executed 'returnToReportsExistingClient' function, redirecting to ${targetPage}`;
    
    logUserAction('NAVIGATION', description, 'NAVIGATION', targetPage);

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

    // Ensure this path is correct relative to the HTML file
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
        
        // <--- NEW LINE ADDED TO HANDLE CONTACT DATA
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
                        logUserAction('VIEW', `Opened Loan Detail Modal for Loan ID: ${loanId}.`, 'loan_applications', loanId);
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
 * Opens the browser's native print dialog for the loan ledger.
 * It temporarily adds a class to the body, allowing the CSS @media print
 * rules to isolate and correctly style the modal content for printing.
 */
function printLoanDetails() {
    // 1. Add the class required by the print CSS (reportsexistingclientview_style.css)
    // This class is expected to hide the main page content and make the modal visible/full-screen
    document.body.classList.add('print-modal-active');

    // 2. Call the native print function
    window.print();

    // 3. Remove the class after a short delay (or listen for 'afterprint')
    // A timeout is a simple way to ensure the print dialog has time to launch/close.
    setTimeout(() => {
        document.body.classList.remove('print-modal-active');
    }, 500); // 500ms delay to ensure the print job completes or is cancelled
}


/**
  * ## Modal Box Logic (Combined View)
  * Fetches both the standard loan details/payments and the reconstruction payments and displays them in a single modal.
  * @param {string} loanId - The ID of the loan to display in the modal.
  */
function showLoanDetailsModal(loanId) {
      const modal = document.getElementById('loanDetailModal');
      const modalContent = document.getElementById('modalBodyContent');
      // NOTE: modalHeader is now guaranteed to exist in the updated HTML
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
            
            // This class triggers the page shift fix (padding-right) in ledgersview_style.css
            document.body.classList.add('modal-open'); 
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

            // Check if the Payments array exists and has at least one item
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
                            <div class="info-item full-width-item final-balance">
                                <span class="info-label">Recon Calculated Balance:</span>
                                <strong class="info-value">PHP ${reconstructSchedule['Final_Calculated_Balance'] || '0.00'}</strong>
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


                  // 4. Render the combined view
                  modalContent.innerHTML = `
                        <div class="ledger-content">
                              
                              <div class="info-box simplified-summary">
                                    <h4 class="info-header">Loan Summary</h4>
                                    
                                    <div class="summary-section">
                                          <h5>Loan Summary</h5>
                                          <div class="info-columns">
                                                <div class="info-item">
                                                      <span class="info-label">Original Principal:</span>
                                                      <strong class="info-value">PHP ${standardSchedule['Loan_Amount'] || 'N/A'}</strong>
                                                </div>
                                                <div class="info-item">
                                                      <span class="info-label">Annual Interest Rate:</span>
                                                      <strong class="info-value">${standardSchedule['Interest_Rate'] || 'N/A'}%</strong>
                                                </div>
                                                <div class="info-item">
                                                      <span class="info-label">Total Payments Recorded:</span>
                                                      <strong class="info-value">${standardSchedule['Total_Payments_Recorded'] || '0'}</strong>
                                                </div>
                                                <div class="info-item full-width-item final-balance">
                                                      <span class="info-label">Final Calculated Balance:</span>
                                                      <strong class="info-value">PHP ${standardSchedule['Final_Calculated_Balance'] || '0.00'}</strong>
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
                <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors" onclick="printLoanDetails()">Print Ledger</button>
                        <button class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors" onclick="closeModal()">Close</button>
                  </div>
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
        document.body.classList.remove('modal-open');
        document.getElementById('modalBodyContent').innerHTML = '';
        
        // Removed logic to remove the dynamically added print button on close
    }
}

// Attach event listeners after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Listener for the static close button
    const closeButton = document.getElementById('closeModalButton');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
             logUserAction('VIEW', 'Closed Loan Detail Modal via button.', 'UI_ACTION', 'loanDetailModal');
             closeModal();
        });
    }
    
    // Listener for outside click (when modal is visible)
    const modal = document.getElementById('loanDetailModal');
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                logUserAction('VIEW', 'Closed Loan Detail Modal via outside click.', 'UI_ACTION', 'loanDetailModal');
                closeModal();
            }
        });
    }
});