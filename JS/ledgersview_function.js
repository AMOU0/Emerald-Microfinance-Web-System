document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    // NOTE: Assuming checkSessionAndRedirect() is defined in enforce_login.js
    // checkSessionAndRedirect(); // Uncomment if you want to use it here

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            
            // NOTE: Keep links pointing to .php if you want server-side security, 
            // otherwise keep them as .html.
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

            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button securely
    logoutButton.addEventListener('click', function() {
        // Redirect to the PHP script that handles session destruction
        window.location.href = 'PHP/check_logout.php'; 
    });
});

/*===============================================================================================================*/
/**
 * Global object to store client data for use by other functions (like the modal builder).
 * Initialized to null. Will hold { last_name, first_name, middle_name, etc. }
 */
window.CURRENT_CLIENT_DATA = null;


function loadClientData() {
    const clientId = getClientIdFromUrl();
    // 1. Check if the client ID is available in the URL
    if (!clientId) {
        console.error('Error: client_id parameter is missing from the URL.');
        // Update the header to reflect the error
        const headerTitle = document.querySelector('.header-title');
        if (headerTitle) {
            headerTitle.textContent = 'Error: Client ID Not Specified';
        }
        return; // Stop execution if ID is missing
    }
    // Update the header with the dynamic ID
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.textContent = `Ledgers (Client ID: ${clientId})`;
    }
    // 2. Construct the PHP script URL with the dynamic client ID
    const phpScript = `PHP/ledgersview_handler.php?client_id=${clientId}`;

    fetch(phpScript)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const client = data.client;
                // --- CRITICAL FIX: Store client data globally ---
                window.CURRENT_CLIENT_DATA = client;
                
                // --- Populate Personal Information ---
                document.getElementById('lastName').value = client.last_name || '';
                document.getElementById('firstName').value = client.first_name || '';
                document.getElementById('middleName').value = client.middle_name || '';
                document.getElementById('maritalStatus').value = client.marital_status || '';
                document.getElementById('gender').value = client.gender || '';
                document.getElementById('dateOfBirth').value = client.date_of_birth || '';
                document.getElementById('city').value = client.city || '';
                document.getElementById('barangay').value = client.barangay || '';
                document.getElementById('postalCode').value = client.postal_code || '';
                document.getElementById('streetAddress').value = client.street_address || '';
                document.getElementById('phoneNumber').value = client.phone_number || '';
                document.getElementById('email').value = client.email || '';

                // --- Populate Employment & Income Information ---
                document.getElementById('employmentStatus').value = client.employment_status || '';
                document.getElementById('occupationPosition').value = client.occupation || '';
                document.getElementById('yearsInJob').value = client.years_in_job || '';
                document.getElementById('incomeSalary').value = client.income || '';

                // --- Populate Loan & Requirements Information ---
                document.getElementById('cr').value = client.colateral || '';
                // Checkbox for Barangay Clearance (Uses boolean value from PHP)
                document.getElementById('barangayClearance').checked = client.has_barangay_clearance;
                // Valid ID details
                const validIdName = client.has_valid_id;
                const validIdCheckbox = document.getElementById('validId');
                validIdCheckbox.checked = validIdName && validIdName !== '0';
                // Update the label to include the specific ID name for clarity
                const validIdLabel = document.querySelector('label[for="validId"]');
                if (validIdLabel) {
                    const displayId = validIdName && validIdName !== '0' ? validIdName : 'Not Provided';
                    validIdLabel.textContent = `Valid ID: (${displayId})`;
                }
            } else {
                console.error('Failed to load client data:', data.message);
                alert(`Client data not found: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('An error occurred while fetching data. Check server connection.');
        });
}
window.onload = loadClientData;

/*===============================================================================================================*/








// =========================================================================================
// UTILITY FUNCTIONS
// =========================================================================================

/**
 * Parses the URL query parameters to retrieve the 'client_id'.
 * @returns {string | null} The client ID or null if not found.
 */
function getClientIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('client_id'); 
}

/**
 * Formats a number as currency (e.g., 10000.00 -> 10,000.00).
 * @param {string | number} value - The number to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// =========================================================================================
// DATA FETCHING FUNCTIONS (Replaces Mock Data)
// =========================================================================================

/**
 * Fetches the detailed loan information, including guarantor data, from the database.
 * @param {string} loanId - The ID of the loan.
 * @returns {Promise<Object>} The loan details object.
 */
async function fetchLoanDetails(loanId) {
    const formData = new FormData();
    formData.append('loan_application_id', loanId);

    // Call the new PHP handler to get loan and guarantor details
    const response = await fetch('PHP/ledgersviewguarantor_handler.php', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.success) {
        // The PHP script now returns a single object containing all necessary details
        return result; 
    } else {
        throw new Error(result.message || 'Failed to fetch loan details from the server.');
    }
}

/**
 * Fetches the amortization schedule. (Kept separate as it was originally)
 */
async function fetchAmortizationSchedule(loanId) {
    const formData = new FormData();
    formData.append('loan_application_id', loanId);

    const response = await fetch('PHP/ledgersviewschedule_handler.php', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `HTTP Error ${response.status}: Failed to connect to server.`);
        } catch (e) {
            throw new Error(`HTTP Error ${response.status}: Server did not return a valid JSON response.`);
        }
    }

    const result = await response.json();
    if (result.success) {
        return result;
    } else {
        throw new Error(result.message || 'An unknown server error occurred while fetching the schedule.');
    }
}

// =========================================================================================
// MODAL & AMORTIZATION FUNCTIONS (RESPONSIVENESS ADJUSTED)
// =========================================================================================

/**
 * Creates and displays the generic modal container.
 */
function createModal(contentHtml, title, maxWidthClass = 'max-w-4xl') {
    document.getElementById('customModal')?.remove();

    const closeAction = "document.getElementById('customModal').remove();";
    
    const modalHtml = `
        <div id="customModal" class="modal-overlay is-active fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 flex justify-center items-center">
            <div class="modal-content modal-content-transition is-active m-4 ${maxWidthClass} w-full relative bg-white rounded-lg shadow-xl">
                
                <div class="modal-header p-4 sm:p-6 border-b flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-900">${title}</h2>
                    <button onclick="${closeAction}" 
                            class="close-modal-btn text-gray-500 hover:text-gray-900 text-3xl font-light leading-none transition duration-150 ease-in-out"
                            aria-label="Close modal">
                        &times; 
                    </button>
                </div>
                
                <div class="modal-body p-4 sm:p-6 overflow-y-auto max-h-[80vh]">
                    ${contentHtml}
                </div>
                
                <div class="modal-footer p-4 sm:p-6 text-right border-t">
                    <button onclick="window.print()"
                            class="print-btn px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mr-2">
                        Print
                    </button>
                    <button onclick="${closeAction}" 
                            class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Displays a non-schedule related error in the modal.
 */
function displayErrorModal(title, message) {
    const contentHtml = `
        <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
            <p class="font-bold">${title}</p>
            <p class="mt-1">${message}</p>
        </div>
    `;
    createModal(contentHtml, 'Error Occurred', 'max-w-lg');
}

/**
 * **MODIFIED:** Only displays Guarantor Information and minimal Loan Context.
 * @param {Object} details - The detailed loan information from the database.
 * @returns {string} The HTML string for the info section.
 */
function createLoanDetailsSection(details) {
    
    // --- Guarantor Section (Mandatory) ---
    const guarantorInfo = `
        <div class="md:col-span-1">
            <h3 class="text-lg font-bold text-gray-900 mb-2 border-b-2 pb-1">Guarantor Information</h3>
            <p><strong>Guarantor Name:</strong> ${details.guarantor_name}</p>
            <p><strong>Address:</strong> ${details.guarantor_address}</p>
            <p><strong>Phone Number:</strong> ${details.guarantor_phone}</p>
        </div>
    `;

    // --- Minimal Loan Terms Details (To provide context for the guarantor) ---
    const loanTerms = `
        <div class="md:col-span-1">
            <h3 class="text-lg font-bold text-gray-900 mb-2 border-b-2 pb-1">Loan Details</h3>
            <p><strong>Loan ID:</strong> ${details.loan_application_id}</p>
            <p><strong>Client Name:</strong> ${details.client_name}</p>
            <p><strong>Principal Amount:</strong> PHP ${formatCurrency(details.loan_amount_principal)}</p>
        </div>
    `;

    // Note: The original request was ONLY for the guarantor. The loan terms 
    // are included here for context, as per the modified PHP fetch.
    
    return `
        <div class="loan-info grid grid-cols-1 md:grid-cols-2 gap-6 text-base mb-6">
            ${guarantorInfo}
            ${loanTerms}
        </div>
        
        <h3 class="text-xl font-bold text-gray-900 mt-6 mb-4 pt-4 border-t">Amortization Schedule</h3>
    `;
}

/**
 * Creates the HTML for the amortization schedule table.
 * **MODIFIED** to interleave scheduled payments with actual payments chronologically.
 * It assumes the 'schedule' array is a chronologically merged list of all events 
 * (schedule installments and payments) from the server.
 */
function createScheduleTableHtml(schedule, title) {
    const HEADING_COLOR = 'text-gray-900'; 
    const EMPTY_CELL = `<td class="px-3 py-1 whitespace-nowrap text-sm text-gray-500">&mdash;</td>`;

    if (!schedule || schedule.length === 0) {
        return `<h3 class="text-lg font-semibold mt-4 mb-2 ${HEADING_COLOR}">${title}</h3><p class="text-gray-500 italic mt-2">No schedule data available.</p>`;
    }

    const rows = schedule.map(item => {
        // Check for a scheduled installment (has a due date and installment amount)
        const isScheduledInstallment = item.due_date && item.payment_amount;

        // Check for an independent payment event (has a payment date and amount paid)
        const isActualPayment = item.date_payed && item.amount_paid;

        // Determine the row style
        const rowClass = isActualPayment && !isScheduledInstallment ? 'bg-green-50/50 font-medium' : '';

        // --- SCHEDULED COLUMNS ---
        const dueDateCell = isScheduledInstallment ? `<td class="px-3 py-1 whitespace-nowrap text-sm text-gray-900">${item.due_date}</td>` : EMPTY_CELL;
        const installmentAmountCell = isScheduledInstallment ? `<td class="px-3 py-1 whitespace-nowrap text-sm text-gray-900">PHP ${formatCurrency(item.payment_amount)}</td>` : EMPTY_CELL;
        const principalCell = isScheduledInstallment ? `<td class="px-3 py-1 whitespace-nowrap text-sm text-gray-900">PHP ${formatCurrency(item.principal_paid)}</td>` : EMPTY_CELL;
        const interestCell = isScheduledInstallment ? `<td class="px-3 py-1 whitespace-nowrap text-sm text-gray-900">PHP ${formatCurrency(item.interest_paid)}</td>` : EMPTY_CELL;
        const balanceCell = isScheduledInstallment ? `<td class="px-3 py-1 whitespace-nowrap text-sm text-gray-900">PHP ${formatCurrency(item.remaining_balance)}</td>` : EMPTY_CELL;
        
        // --- PAYMENT COLUMNS ---
        // Note: The server should use 'date_payed' and 'amount_paid' for payments.
        const paymentDateCell = isActualPayment ? `<td class="px-3 py-1 whitespace-nowrap text-sm text-gray-900">${item.date_payed}</td>` : EMPTY_CELL;
        const amountPaidCell = isActualPayment ? `<td class="px-3 py-1 whitespace-nowrap text-sm text-green-700">PHP ${formatCurrency(item.amount_paid)}</td>` : EMPTY_CELL;


        return `
            <tr class="${rowClass}">
                ${dueDateCell}
                ${installmentAmountCell}
                ${principalCell}
                ${interestCell}
                ${balanceCell}
                ${paymentDateCell}
                ${amountPaidCell}
            </tr>
        `;
    }).join('');

    return `
        <h3 class="text-lg font-semibold mt-4 mb-2 ${HEADING_COLOR}">${title}</h3>
        <div class="loan-schedule schedule-table-container max-h-60 overflow-y-auto border rounded-lg shadow-sm">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-indigo-100 sticky top-0">
                    <tr>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Due Date</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Installment Amount</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Principal Amount</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Interest Amount</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Balance</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Payment Date</th>                        
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Payment Amount</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">${rows}</tbody>
            </table>
        </div>
    `;
}

/**
 * Displays the full loan details and amortization schedule in a modal.
 */
function displayLoanDetailsModal(loanId, details, scheduleData) {
    let contentHtml = createLoanDetailsSection(details);

    // 2. Original Loan Schedule
    contentHtml += createScheduleTableHtml(scheduleData.original_schedule, 'Original Loan Schedule');

    // 3. Reconstruct Schedule (if available)
    if (scheduleData.reconstruct_schedule && scheduleData.reconstruct_schedule.length > 0) {
        contentHtml += `
            <div class="mt-6 border-t pt-4">
                ${createScheduleTableHtml(scheduleData.reconstruct_schedule, 'LATEST Reconstructed Loan Schedule')}
                <p class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">⚠️ **Note:** The current loan balance in the main table is based on the terms of this latest reconstruction.</p>
            </div>
        `;
    }
    
    createModal(contentHtml, `Guarantor and Loan Details for ID: ${loanId}`);
}

/**
 * Function to handle the amortization fetching and modal display
 */
async function handleAmortizationClick(loanId, clickedElement) {
    // Check if client data is available before proceeding
    if (!window.CURRENT_CLIENT_DATA) {
        // This check is often for the main client table data, less critical now 
        // that details are fetched by the new PHP script, but kept for safety.
        // displayErrorModal('Client Data Unavailable', 'Client demographic data has not loaded yet. Cannot show full loan details.');
        // return; 
    }

    const row = clickedElement.closest('.loan-row');
    if (!row) return;

    row.classList.add('loading-row'); 

    try {
        // 1. Fetch Loan and Guarantor Details from the database
        const loanDetails = await fetchLoanDetails(loanId); 
        
        // 2. Fetch Amortization Schedule (kept separate as per original structure)
        const scheduleData = await fetchAmortizationSchedule(loanId);

        // 3. Display the modal with the fetched data
        displayLoanDetailsModal(loanId, loanDetails, scheduleData);
    } catch (error) {
        console.error('Data fetch error:', error);
        displayErrorModal('Failed to Fetch Loan Data', error.message);
    } finally {
        row.classList.remove('loading-row');
    }
}

// Global click handler for the clickable rows
document.addEventListener('click', async (event) => {
    const clickedRow = event.target.closest('.loan-row');
    
    if (clickedRow) {
        const loanId = clickedRow.dataset.loanId;
        if (loanId) {
            handleAmortizationClick(loanId, event.target);
        }
    }
});

// =========================================================================================
// Original Loan Table Functions (for completeness)
// =========================================================================================

/**
 * Creates the HTML table based on the fetched loan data.
 */
function createLoansTable(loans) {
    if (loans.length === 0) {
        return '<div class="text-center p-6 text-gray-500 bg-white shadow-md rounded-lg mt-4">No active or historical loans found for this client.</div>';
    }

    let tableHtml = `
        <style>
            .loan-row {
                cursor: pointer;
                transition: background-color 0.1s ease;
            }
            .loan-row:hover {
                background-color: #f3f4f6;
            }
            .loan-row.loading-row {
                pointer-events: none;
                opacity: 0.7;
            }
            .modal-content {
                max-width: 90%;
            }
        </style>
        <div class="loan-table-container">
            <table class="loan-table">
                <thead class="loan-header-group">
                    <tr>
                        <th class="loan-header">Loan ID</th>
                        <th class="loan-header amount-col">Amount (w/ Interest)</th>
                        <th class="loan-header amount-col">Total Paid</th>
                        <th class="loan-header amount-col">Remaining Balance</th>
                        <th class="loan-header term-col">Term (Duration / Freq.)</th>
                        <th class="loan-header date-col">Start Date</th>
                        <th class="loan-header date-col">End Date</th>
                        </tr>
                </thead>
                <tbody class="loan-body">
    `;

    loans.forEach(loan => {
        const loanAmountRepayable = parseFloat(loan.loan_amount); 
        const totalPaid = parseFloat(loan.total_paid);
        const remaining = parseFloat(loan.amount_remaining);
        
        const remainingClass = remaining <= 0 ? 'text-green-600' : 'text-red-600';

        tableHtml += `
            <tr class="loan-row hover:bg-gray-100" data-loan-id="${loan.loan_application_id}">
                <td class="loan-data-cell id-col px-3 py-2 whitespace-nowrap">${loan.loan_application_id}</td>
                <td class="loan-data-cell amount-col amount-color px-3 py-2 whitespace-nowrap">PHP ${formatCurrency(loanAmountRepayable)}</td>
                <td class="loan-data-cell amount-col px-3 py-2 whitespace-nowrap">PHP ${formatCurrency(totalPaid)}</td>
                <td class="loan-data-cell amount-col ${remainingClass} px-3 py-2 whitespace-nowrap">PHP ${formatCurrency(remaining)}</td>
                <td class="loan-data-cell term-col px-3 py-2 whitespace-nowrap">${loan.duration_of_loan} (${loan.payment_frequency})</td>
                <td class="loan-data-cell date-col px-3 py-2 whitespace-nowrap">${loan.date_start}</td>
                <td class="loan-data-cell date-col px-3 py-2 whitespace-nowrap">${loan.date_end}</td>
                </tr>
        `;
    });

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    return tableHtml;
}

/**
 * Fetches loan data for a specific client and renders the table.
 */
async function fetchClientLoans(clientId) {
    const container = document.getElementById('loanTableContainer');
    if (!container) {
        console.error('Error: Loan table container #loanTableContainer not found.');
        return;
    }

    container.innerHTML = '<div class="text-center p-6"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 inline-block"></div><p class="mt-2 text-indigo-600">Loading loan data...</p></div>';

    if (!clientId) {
        displayErrorModal('Missing Client ID', 'The client ID could not be found in the URL parameter. Please check the URL.');
        container.innerHTML = `<div class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg" role="alert"><p class="font-bold">Missing Client ID</p><p>Check the URL parameters.</p></div>`;
        return;
    }
    
    const formData = new FormData();
    formData.append('client_id', clientId);

    try {
        const response = await fetch('PHP/ledgersviewfetchloan_handler.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            container.innerHTML = createLoansTable(result.loans);
        } else {
            container.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert"><p class="font-bold">Error Loading Loans</p><p>${result.message || 'An unknown error occurred on the server.'}</p></div>`;
            console.error('Server error:', result.message);
        }

    } catch (error) {
        container.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert"><p class="font-bold">Network Error</p><p>Could not connect to the loan data service. Details: ${error.message}</p></div>`;
        console.error('Fetch error:', error);
    }
}

// Get the client ID from the URL now
const CLIENT_ID_TO_FETCH = getClientIdFromUrl(); 

//Start the process when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    fetchClientLoans(CLIENT_ID_TO_FETCH);
});