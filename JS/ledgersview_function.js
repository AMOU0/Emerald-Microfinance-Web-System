/**
 * Global object to store client data for use by other functions.
 * Initialized to null.
 */
window.CURRENT_CLIENT_DATA = null;

// Function to extract client ID from the URL query string
function getClientIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('client_id');
}

/**
 * Helper function to safely get client data or a default string.
 * This is crucial for handling null, undefined, and empty strings gracefully from the database response.
 * @param {object} client - The client data object (window.CURRENT_CLIENT_DATA).
 * @param {string} key - The key to retrieve from the client object.
 * @param {string} defaultValue - The value to return if the data is missing.
 */
const getClientValue = (client, key, defaultValue = 'N/A') => {
    if (!client || client[key] === null || client[key] === undefined || String(client[key]).trim() === '') {
        return defaultValue;
    }
    return client[key];
};

/**
 * Populates the HTML 'report-viewer' section with data from the global CURRENT_CLIENT_DATA object.
 */
function populateSummaryView() {
    const client = window.CURRENT_CLIENT_DATA;
    const clientId = getClientIdFromUrl();

    // Set Client ID and hidden input regardless of data success
    document.getElementById('client-id-dd').textContent = clientId || 'Not Found';
    document.getElementById('clientIdInput').value = clientId || '';

    if (!client) {
        // Handle no data scenario
        const notLoadedMessage = 'Data Not Loaded';
        document.getElementById('client-name-dd').textContent = notLoadedMessage;
        document.getElementById('marital-status-dd').textContent = 'N/A';
        document.getElementById('gender-dob-dd').textContent = 'N/A';
        document.getElementById('address-dd').textContent = 'N/A';
        document.getElementById('contact-email-dd').textContent = 'N/A';
        document.getElementById('income-collateral-dd').textContent = 'N/A';
        document.getElementById('income-collateral-dd-2').textContent = 'N/A';
        return;
    }

    // --- POPULATE NAME (Full Name) ---
    const firstName = getClientValue(client, 'first_name');
    const middleName = getClientValue(client, 'middle_name', ''); 
    const lastName = getClientValue(client, 'last_name');

    const clientNameParts = [
        firstName,
        middleName,
        lastName
    ];
    
    // Filter out parts that are null/empty or the 'N/A' fallback and join with a single space.
    const clientName = clientNameParts.filter(p => p && p !== 'N/A').join(' '); 
    document.getElementById('client-name-dd').textContent = clientName;

    // --- POPULATE OTHER FIELDS ---
    document.getElementById('marital-status-dd').textContent = getClientValue(client, 'marital_status');

    const dob = getClientValue(client, 'date_of_birth');
    const gender = getClientValue(client, 'gender');
    document.getElementById('gender-dob-dd').textContent = `${gender} / ${dob}`;

    // Address 
    const street = getClientValue(client, 'street_address', '');
    // 💥 FIX: Added 'client' argument to getClientValue for 'barangay'
    const barangay = getClientValue(client, 'barangay', ''); 
    const city = getClientValue(client, 'city', '');
    const postal = getClientValue(client, 'postal_code', '');
    const addressParts = [street, barangay, city, postal].filter(p => p !== '');
    document.getElementById('address-dd').textContent = addressParts.join(', ');

    // Contact / Email
    const email = getClientValue(client, 'email', 'No Email');
    const phoneNumber = getClientValue(client, 'phone_number');
    document.getElementById('contact-email-dd').textContent = `${phoneNumber} / ${email}`;

    // Income / Employment Details
    const occupation = getClientValue(client, 'occupation', 'N/A');
    const yearsInJob = getClientValue(client, 'years_in_job', '0');
    const income = getClientValue(client, 'income', 'Not Stated');
    document.getElementById('income-collateral-dd').textContent = `Employment: ${occupation} (${yearsInJob} yrs) | Income: ${income}`;

    // Collateral
    const collateral = getClientValue(client, 'colateral', 'None Declared');
    document.getElementById('income-collateral-dd-2').textContent = collateral;
}


function loadClientData() {
    const client = window.CURRENT_CLIENT_DATA;
    const clientId = getClientIdFromUrl();
    
    if (!clientId) {
        const headerTitle = document.querySelector('.header-title');
        if (headerTitle) {
            headerTitle.textContent = 'Error: Client ID Not Specified';
        }
        populateSummaryView(); 
        return;
    }
    
    // Update the header
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.textContent = `Ledgers (Client ID: ${clientId})`;
    }
    
    // Construct the PHP script URL
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
                // --- Store client data globally ---
                window.CURRENT_CLIENT_DATA = client;
                
                // Helper to safely populate form inputs (if they exist)
                const safeSet = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.value = value || '';
                };
                
                // --- Populate Hidden Form Inputs ---
                safeSet('lastName', client.last_name);
                safeSet('firstName', client.first_name);
                safeSet('middleName', client.middle_name);
                safeSet('maritalStatus', client.marital_status);
                safeSet('gender', client.gender);
                safeSet('dateOfBirth', client.date_of_birth);
                safeSet('city', client.city);
                safeSet('barangay', client.barangay);
                safeSet('postalCode', client.postal_code);
                safeSet('streetAddress', client.street_address);
                safeSet('phoneNumber', client.phone_number);
                safeSet('email', client.email);
                safeSet('employmentStatus', client.employment_status);
                safeSet('occupationPosition', client.occupation);
                safeSet('yearsInJob', client.years_in_job);
                safeSet('incomeSalary', client.income);
                safeSet('cr', client.colateral);

                // Checkbox logic for requirements
                const barangayClearance = document.getElementById('barangayClearance');
                if (barangayClearance) {
                    barangayClearance.checked = client.has_barangay_clearance;
                }
                
                const validIdName = client.has_valid_id;
                const validIdCheckbox = document.getElementById('validId');
                const validIdLabel = document.querySelector('label[for="validId"]');
                
                if (validIdCheckbox) {
                    validIdCheckbox.checked = validIdName && validIdName !== '0';
                }
                
                if (validIdLabel) {
                    const displayId = validIdName && validIdName !== '0' ? validIdName : 'Not Provided';
                    validIdLabel.textContent = `Valid ID: (${displayId})`;
                }

                // --- Call function to populate the summary report view ---
                populateSummaryView(); 

            } else {
                console.error('Failed to load client data:', data.message);
                window.CURRENT_CLIENT_DATA = null;
                populateSummaryView(); // Display 'N/A'
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            window.CURRENT_CLIENT_DATA = null;
            populateSummaryView(); // Display 'N/A'
        });
}

/*===============================================================================================================*/
/* Sidebar Navigation and Initialization */
/*===============================================================================================================*/

document.addEventListener('DOMContentLoaded', function() {
    // Assuming checkSessionAndRedirect() is available from JS/enforce_login.js
    // checkSessionAndRedirect(); 

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    // Navigation Logic
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            
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

            const targetPage = urlMapping[linkText];
            if (targetPage) {
                const actionDescription = `Maps to ${this.textContent} (${targetPage})`;

                // ASYNCHRONOUS AUDIT LOG: Call PHP to log the action.
                fetch('PHP/log_action.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=${encodeURIComponent(actionDescription)}`
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('Audit log failed to record for navigation:', actionDescription);
                    }
                })
                .catch(error => {
                    console.error('Audit log fetch error:', error);
                })
                
                // Perform the page redirect immediately
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Logout Logic
    logoutButton.addEventListener('click', function() {
        // Redirects to PHP script that handles logging out and session destruction
        window.location.href = 'PHP/check_logout.php'; 
    });

    // CRITICAL: Call the data loading function after DOM is fully ready
    loadClientData();
});
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