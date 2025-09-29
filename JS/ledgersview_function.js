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

function getClientIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('client_id');
}

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



/**
 * Formats a number as currency (e.g., 10000.00 -> 10,000.00).
 * @param {string | number} value - The number to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(value) {
    // Ensure the value is treated as a number with 2 decimal places
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Creates the HTML table based on the fetched loan data.
 * @param {Array<Object>} loans - An array of loan objects from the API.
 * @returns {string} The complete HTML string for the table.
 */
function createLoansTable(loans) {
    if (loans.length === 0) {
        // NOTE: Keeping utility classes here for the container and message is acceptable
        return '<div class="text-center p-6 text-gray-500 bg-white shadow-md rounded-lg mt-4">No active or historical loans found for this client.</div>';
    }

    let tableHtml = `
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
        // NOTE: loan.loan_amount now holds the Total Repayable Amount (Principal + Interest)
        const loanAmountRepayable = parseFloat(loan.loan_amount); 
        const totalPaid = parseFloat(loan.total_paid);
        const remaining = parseFloat(loan.amount_remaining);
        
        // Use custom classes for conditional styling
        const remainingClass = remaining <= 0 ? 'status-green' : 'status-red';

        // NOTE: Status styling logic is kept but not used in the table cell anymore.
        // let statusClass;
        // if (loan.status === 'approved') {
        //     statusClass = 'status-badge status-badge-yellow';
        // } else if (loan.status === 'fully_paid') {
        //     statusClass = 'status-badge status-badge-green';
        // } else {
        //     statusClass = 'status-badge status-badge-gray';
        // }

        tableHtml += `
            <tr class="loan-row">
                <td class="loan-data-cell id-col">${loan.loan_application_id}</td>
                <td class="loan-data-cell amount-col amount-color">${formatCurrency(loanAmountRepayable)}</td>
                <td class="loan-data-cell amount-col">${formatCurrency(totalPaid)}</td>
                <td class="loan-data-cell amount-col ${remainingClass}">${formatCurrency(remaining)}</td>
                <td class="loan-data-cell term-col">${loan.duration_of_loan} (${loan.payment_frequency})</td>
                <td class="loan-data-cell date-col">${loan.date_start}</td>
                <td class="loan-data-cell date-col">${loan.date_end}</td>
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

// Get the client ID from the URL now
const CLIENT_ID_TO_FETCH = getClientIdFromUrl();

/**
 * Fetches loan data for a specific client and renders the table.
 * @param {string} clientId - The ID of the client to fetch loans for.
 */
async function fetchClientLoans(clientId) {
    const container = document.getElementById('loanTableContainer');
    if (!container) {
        console.error('Error: Loan table container #loanTableContainer not found.');
        return;
    }

    // Set loading state
    container.innerHTML = '<div class="text-center p-6"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 inline-block"></div><p class="mt-2 text-indigo-600">Loading loan data...</p></div>';

    // Check if client ID is valid before proceeding
    if (!clientId) {
        container.innerHTML = `<div class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg" role="alert">
                                     <p class="font-bold">Missing Client ID</p>
                                     <p>The client ID could not be found in the URL parameter 'client_id'.</p>
                                   </div>`;
        console.error('Error: client_id parameter is missing from the URL.');
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
            // Render the table with the fetched data
            container.innerHTML = createLoansTable(result.loans);
        } else {
            // Display error message from PHP
            container.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
                                             <p class="font-bold">Error Loading Loans</p>
                                             <p>${result.message || 'An unknown error occurred on the server.'}</p>
                                           </div>`;
            console.error('Server error:', result.message);
        }

    } catch (error) {
        // Display generic network/parsing error
        container.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
                                   <p class="font-bold">Network Error</p>
                                   <p>Could not connect to the loan data service. Details: ${error.message}</p>
                                 </div>`;
        console.error('Fetch error:', error);
    }
}

// Start the process when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Pass the extracted CLIENT_ID_TO_FETCH to the fetch function
    fetchClientLoans(CLIENT_ID_TO_FETCH);
});