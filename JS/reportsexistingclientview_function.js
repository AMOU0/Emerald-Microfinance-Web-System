/* ========================================================= */
/* --- GLOBAL LOGGING FUNCTIONS (Moved to Global Scope) --- */
/* ========================================================= */

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

// Global DETAILED Logging Function for actions involving target data
function logDetailedUserAction(actionType, description, targetTable, targetId, beforeState = null, afterState = null) {
    const bodyData = new URLSearchParams();
    bodyData.append('action', actionType); 
    bodyData.append('description', description); 
    bodyData.append('target_table', targetTable); 
    bodyData.append('target_id', targetId);
    
    // Append optional states if provided
    if (beforeState !== null) bodyData.append('before_state', beforeState);
    if (afterState !== null) bodyData.append('after_state', afterState);

    fetch('PHP/log_action.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData.toString()
    })
    .then(response => {
        if (!response.ok) {
            console.warn('Detailed Audit log failed to record:', actionType, description);
        }
    })
    .catch(error => {
        console.error('Detailed Audit log fetch error:', error);
    });
}

/* ========================================================= */
/* --- FIRST DOMContentLoaded BLOCK (Navigation Handlers) --- */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    // NOTE: Logging functions are now globally defined above.
    
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    const reportButtons = document.querySelectorAll('.report-button'); 

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
        'overduepayments': 'ReportsOverduePayments.html', 
        'delinquentaccounts': 'ReportsDelinquentAccounts.html', 
        'audittrail': 'ReportsAuditTrail.html'
    };

    // --- Primary Navigation Handler (e.g., Dashboard, Reports) ---
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
          const actionType = 'NAVIGATION'; 
          const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

          // 2. ASYNCHRONOUS AUDIT LOG: Log the action.
          logUserAction(actionType, description);

          // 3. Perform the page redirect immediately after initiating the log.
          window.location.href = targetPage;
        } else {
          console.error('No page defined for this link:', linkText);
          
          // Log the failed navigation attempt
          const actionType = 'NAVIGATION'; // Used a specific failed type
          const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
          logUserAction(actionType, description);
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

    // Handle the logout button securely
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        window.location.href = 'PHP/check_logout.php'; 
      });
    }
});
/*=============================================================================================================================================================================*/
// Function to get the client ID from the URL query parameters
function getClientIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    // CHANGE THIS LINE: from 'client_id' to 'clientId'
    return urlParams.get('clientId'); // Corrected to use 'clientId'
}

// Function to populate a single data description element
function populateDataElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value || 'N/A'; // Use 'N/A' if value is null/undefined/empty
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

    // Set the hidden input field for potential form submission
    document.getElementById('clientIdInput').value = clientId;
    populateDataElement('client-id-dd', clientId); // Display the ID  while loading

    // The URL for your server-side script
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

        // Populate the client details section using the data received
        populateDataElement('client-name-dd', data.client_name);
        populateDataElement('marital-status-dd', data.marital_status);
        populateDataElement('gender-dob-dd', data.gender_dob);
        populateDataElement('address-dd', data.address);
        populateDataElement('contact-email-dd', data.contact_email);

        populateDataElement('income-collateral-dd', data.employment_income); 
        populateDataElement('income-collateral-dd-2', data.collateral); 
        

    } catch (error) {
        console.error("Could not fetch client details:", error);
        // Display a general error message to the user
        populateDataElement('client-name-dd', 'Failed to load details.');
    }
}

// Execute the function when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayClientDetails);

/*=============================================================================================================================================================================*/


function loadLoanDetailsFromDatabase(clientId) {
    const container = document.getElementById('dynamicLoanContent');
    container.innerHTML = '<p>Fetching loan details...</p>'; // Show loading state

    // Fetch data, passing the client ID as a query parameter (clientId)
    fetch(`PHP/reportsexistingviewclientstable_handler.php?clientId=${clientId}`)
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

            container.innerHTML = ''; // Clear loading text

            // --- 1. Display Client Info (Only Once) ---
            const clientInfo = data[0]; // All objects in the array should have the same client info
            
            // Assuming the client info has 'Client Name' and 'Client ID' keys.
            // Add a dedicated section for client details above the table
            const clientDetailsDiv = document.createElement('div');
            clientDetailsDiv.innerHTML = `
                <h2>Loan History for ${clientInfo['Client Name'] || 'Unknown Client'}</h2>
                <hr>
            `;
            container.appendChild(clientDetailsDiv);

            // --- 2. Define headers for the LOAN TABLE ---
            // Remove the redundant Client ID and Client Name from the table columns
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
                // IMPORTANT: Add a class and set a data attribute for the Loan ID
                dataRow.classList.add('clickable-loan-row');
                dataRow.setAttribute('data-loan-id', loan['Loan ID']); // Store Loan ID

                headers.forEach(headerKey => {
                    const td = document.createElement('td');
                    let value = loan[headerKey]; 
                    
                    // Format currency fields (PHP)
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

            // New logic to make rows clickable for the MODAL!
            document.querySelectorAll('.clickable-loan-row').forEach(row => {
                row.style.cursor = 'pointer'; // Make it visually clickable
                row.addEventListener('click', function() {
                    const loanId = this.getAttribute('data-loan-id');
                    if (loanId) {
                        // This event is redundant if document.body listener works, 
                        // but is kept here based on original structure.
                        showLoanDetailsModal(loanId);
                        console.log(`Attempting to show modal for Loan ID: ${loanId}`);
                    }
                });
            });


        })
        .catch(error => {
            console.error('Error fetching loan data:', error);
            container.innerHTML = `<p>Error loading loan details: ${error.message}</p>`;
        });
}

// Execute the function with the specific client ID extracted from the URL
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('dynamicLoanContent');
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for the 'clientId' parameter
    const targetClientId = urlParams.get('clientId'); 

    if (targetClientId) {
        // Use the ID from the URL to load all related loans
        loadLoanDetailsFromDatabase(targetClientId);
    } else {
        // If no ID is found in the URL, display an error message
        container.innerHTML = '<p>🛑 **Error**: No client ID found in the URL. Please ensure the URL contains <code>?clientId=CLIENT_ID</code>.</p>';
        console.error('No clientId parameter found in the URL.');
    }
});

/*=============================================================================================================================================================================*/



/**
 * ## Modal Box Logic 
 * This function will fetch the specific loan details and populate a modal.
 * @param {string} loanId - The ID of the loan to display in the modal.
 */
function showLoanDetailsModal(loanId) {
    const modal = document.getElementById('loanDetailModal');
    const modalContent = document.getElementById('modalBodyContent');

    // 1. Show a loading state in the modal
    modalContent.innerHTML = `<p class="loading-message">Loading details for Loan ID: ${loanId}...</p>`;
    
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-open'); 
    }

    // 2. Fetch the detailed loan data
    fetch(`PHP/reportsexistingclientviewloandetail_handler.php?loanId=${loanId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(details => {
            if (details && details.error) {
                modalContent.innerHTML = `<p class="error-message">Server Error: ${details.error}</p>`;
                return;
            }

            // 3. Render the details into the modal
            if (details) {
                
                const paymentsTableHTML = createPaymentsTable(details['Payments']);

                // Updated modalContent.innerHTML to use CSS classes
                modalContent.innerHTML = `
                    <h3 class="loan-detail-header">Loan ID: ${details['Loan ID'] || loanId}</h3>
                    
                    <div class="info-box">
                        <h4 class="info-header">Loan and Client Information</h4>
                        
                        <div class="info-columns">
                            <div class="info-item">
                                <span class="info-label">Client Name:</span>
                                <strong class="info-value">${details['ClientName'] || 'N/A'}</strong>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Principal Amount:</span>
                                <strong class="info-value">PHP ${details['Principal'] || 'N/A'}</strong>
                            </div>
                        </div>

                        <div class="info-columns">
                            <div class="info-item">
                                <span class="info-label">Date Issued:</span>
                                <strong class="info-value">${details['IssueDate'] || 'N/A'}</strong>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Interest Rate:</span>
                                <strong class="info-value">${details['InterestRate'] || 'N/A'}</strong>
                            </div>
                        </div>

                        <div class="info-columns">
                            <div class="info-item">
                                <span class="info-label">Status:</span>
                                <strong class="info-value">${details['Status'] || 'N/A'}</strong>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Terms:</span>
                                <strong class="info-value">${details['Duration'] || 'N/A'} (${details['Frequency'] || 'N/A'})</strong>
                            </div>
                        </div>
                    </div>

                    <div class="info-box">
                        <h4 class="info-header">Guarantor Information</h4>
                        
                        <div class="info-columns">
                            <div class="info-item">
                                <span class="info-label">Guarantor Name:</span>
                                <strong class="info-value">${details['GuarantorName'] || 'N/A'}</strong>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Phone Number:</span>
                                <strong class="info-value">${details['GuarantorPhone'] || 'N/A'}</strong>
                            </div>
                        </div>
                        
                        <div class="info-item" style="width: 100%; padding: 5px 0;">
                            <span class="info-label">Address:</span>
                            <strong class="info-value">${details['GuarantorAddress'] || 'N/A'}</strong>
                        </div>
                    </div>
                    
                    ${paymentsTableHTML} 
                `;
            } else {
                modalContent.innerHTML = `<p class="info-message">No detailed data returned for Loan ID: ${loanId}.</p>`;
            }

        })
        .catch(error => {
            console.error('Error fetching single loan data:', error);
            modalContent.innerHTML = `<p class="error-message">Failed to load loan details: ${error.message}</p>`;
        });
}

// ------------------------------------------------------------------
// createPaymentsTable (Updated to use CSS classes)
// ------------------------------------------------------------------

/**
 * Generates the HTML table for loan payments, showing Date, Amount Paid, and Balance After Payment.
 * Uses CSS classes for styling.
 * @param {Array<Object>} payments - An array of payment objects.
 * @returns {string} The HTML string for the payments table or a 'No payments' message.
 */
function createPaymentsTable(payments) {
    if (!payments || payments.length === 0) {
        return '<h4>Payment History</h4><p class="info-message">No payments recorded for this loan.</p>';
    }

    let tableRows = '';
    // Generate a row for each payment
    payments.forEach((payment) => {
        const formattedAmount = payment['Amount'] || 'N/A';
        const formattedBalance = payment['RemainingBalance'] || 'N/A';
        
        // Rows are styled using CSS classes (e.g., .payment-table tbody tr:nth-child(even))
        tableRows += `
            <tr>
                <td>${payment['PaymentDate'] || 'N/A'}</td>
                <td class="amount-column">${formattedAmount}</td>
                <td class="amount-column">${formattedBalance}</td>
            </tr>
        `;
    });

    return `
        <h4>Payment History</h4>
        <div class="table-responsive">
            <table class="payment-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th class="amount-column">Amount Paid</th>
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

// ------------------------------------------------------------------
// CLOSURE AND EVENT LISTENERS (Updated Loan Selection Handler)
// ------------------------------------------------------------------

/**
 * Function to close the modal.
 */
function closeModal() {
    const modal = document.getElementById('loanDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.getElementById('modalBodyContent').innerHTML = ''; 
    }
}

// Attach event listeners after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('closeModalButton');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    const modal = document.getElementById('loanDetailModal');
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    // *** UPDATED: Log action when a loan is selected (Delegated to document.body) ***
    document.body.addEventListener('click', (e) => {
        const targetElement = e.target.closest('[data-loan-id]');
        
        if (targetElement) {
            const loanId = targetElement.dataset.loanId;
            
            // --- AUDIT LOGGING ---
            const actionType = 'VIEW';
            const description = `Accessed detailed view modal for Loan ID: ${loanId}`;
            const targetTable = 'loans'; 
            const targetId = loanId;     
            
            logDetailedUserAction(
                actionType, 
                description, 
                targetTable, 
                targetId,
                null, // beforeState
                null  // afterState
            );
            // --- END AUDIT LOGGING ---
            
            showLoanDetailsModal(loanId);
        }
    });
});