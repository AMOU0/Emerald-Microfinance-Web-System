document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Prevent the default link behavior
            event.preventDefault(); 
            // Remove 'active' class from all links
            navLinks.forEach(nav => nav.classList.remove('active'));
            // Add 'active' class to the clicked link
            this.classList.add('active');

            // Get the text from the link
            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            // Define the URL based on the link's text
            const urlMapping = {
                'dashboard': 'Dashboard.html',
                'clientcreation': 'ClientCreationForm.html',
                'loanapplication': 'LoanApplication.html',
                'pendingaccounts': 'PendingAccount.html',
                'accountsreceivable': 'AccountsReceivable.html',
                'ledger': 'Ledgers.html',
                'reports': 'Reports.html',
                'usermanagement': 'UserManagement.html',
                'tools': 'Tools.html'
            };
            // Navigate to the correct page
            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button separately
    logoutButton.addEventListener('click', function() {
        // You would typically handle a logout process here (e.g., clearing session data)
        window.location.href = 'login.html'; // Redirect to the login page
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const reportButtons = document.querySelectorAll('.report-button');

    // Logic for the reports sidebar buttons
    reportButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            // Prevent default button behavior
            event.preventDefault();
            // Get the text from the button
            const buttonText = this.textContent.toLowerCase().replace(/\s/g, '');
            // Define the URL mapping for report buttons
            const reportUrlMapping = {
                'existingclients': 'ReportsExistingClient.html',
                'duepayments': 'ReportsDuePayments.html',
                'overduepayments': 'ReportsOverduePayments.html'
            };
            // Navigate to the correct report page
            if (reportUrlMapping[buttonText]) {
                window.location.href = reportUrlMapping[buttonText];
            } else {
                console.error('No page defined for this report button:', buttonText);
            }
        });
    });
});
/*================================= */


function fillClientData(clientData) {
    document.getElementById('lastName').value = clientData.last_name || '';
    document.getElementById('firstName').value = clientData.first_name || '';
    document.getElementById('middleName').value = clientData.middle_name || '';
    document.getElementById('maritalStatus').value = clientData.marital_status || '';
    document.getElementById('gender').value = clientData.gender || '';
    document.getElementById('dateOfBirth').value = clientData.date_of_birth || '';
    document.getElementById('city').value = clientData.city || '';
    document.getElementById('barangay').value = clientData.barangay || '';
    document.getElementById('postalCode').value = clientData.postal_code || '';
    document.getElementById('streetAddress').value = clientData.street_address || '';
    document.getElementById('phoneNumber').value = clientData.phone_number || '';
    document.getElementById('email').value = clientData.email || '';
    document.getElementById('employmentStatus').value = clientData.employment_status || '';
    document.getElementById('occupationPosition').value = clientData.occupation || '';
    document.getElementById('yearsInJob').value = clientData.years_in_job || '';
    document.getElementById('incomeSalary').value = clientData.income || '';
    document.getElementById('cr').value = clientData.has_cr || '';
    document.getElementById('barangayClearance').checked = clientData.has_barangay_clearance === '1';
    document.getElementById('validId').checked = clientData.has_valid_id === '1';
}

function showMessageBox(message, type) {
    const existingBox = document.querySelector('.message-box');
    if (existingBox) existingBox.remove();
    const box = document.createElement('div');
    box.className = `message-box fixed top-4 right-4 p-4 rounded-lg text-white shadow-lg transition-transform duration-300 transform translate-y-0`;
    if (type === 'error') {
        box.classList.add('bg-red-500');
    } else if (type === 'info') {
        box.classList.add('bg-blue-500');
    } else {
        box.classList.add('bg-green-500');
    }
    box.textContent = message;
    document.body.appendChild(box);
    setTimeout(() => {
        box.classList.add('translate-y-full');
        setTimeout(() => box.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    const clientIdInput = document.getElementById('clientIdInput');
    const clientNameDisplay = document.getElementById('clientNameDisplay');
    const urlParams = new URLSearchParams(window.location.search);
    const clientIdFromUrl = urlParams.get('clientId');

    async function fetchClientData(clientId) {
        try {
            const clientResponse = await fetch(`PHP/reportsexistingclientview_handler.php?client_id=${clientId}`);
            const clientResult = await clientResponse.json();
            if (clientResponse.ok && clientResult.status === 'success') {
                fillClientData(clientResult.data);
                if (clientNameDisplay) clientNameDisplay.value = `${clientResult.data.first_name} ${clientResult.data.last_name}`;
            } else {
                showMessageBox(clientResult.message || 'Client data could not be loaded.', 'error');
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
            showMessageBox('Could not load client details. Please check the network connection and server logs.', 'error');
        }
    }

    if (clientIdFromUrl) {
        clientIdInput.value = clientIdFromUrl;
        fetchClientData(clientIdFromUrl);
    } else {
        showMessageBox('No client ID found in URL.', 'info');
    }
});
/*======================*/
// Function to show a message box
function showMessageBox(message, type) {
    console.log(message, type);
    // You'd typically implement a UI element here to display the message
}

document.addEventListener('DOMContentLoaded', () => {
    // Get the client ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientId');

    if (clientId) {
        document.getElementById('clientIdInput').value = clientId;
        fetchLoanApplications(clientId);
    } else {
        showMessageBox('No client ID provided in the URL.', 'error');
        document.getElementById('loanTableContainer').innerHTML = '<p>No client selected. Please go back and select a client from the list.</p>';
    }
});

async function fetchLoanApplications(clientId) {
    try {
        const response = await fetch(`PHP/reports_loan_handler.php?client_id=${clientId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();

        if (result.status === 'error') {
            showMessageBox(result.message, 'error');
            document.getElementById('loanTableContainer').innerHTML = `<p>${result.message}</p>`;
            return;
        }

        // Pass the complete data to the render function
        renderLoanTable(result.data, result.clientName, result.clientId); // Assuming PHP returns this
    } catch (error) {
        console.error('Error fetching loan applications:', error);
        showMessageBox('Could not load loan applications. Please try again later.', 'error');
        document.getElementById('loanTableContainer').innerHTML = '<p>Error loading loan applications. Please try again later.</p>';
    }
}

/**
 * Dynamically creates and displays the loan details and schedule modal.
 * @param {Object} data - The loan application data from the PHP response.
 */
function createLoanDetailsModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content modal-content-transition';

    // Generate the payment schedule table
    const schedule = generateLoanSchedule(
        parseFloat(data.loan_amount),
        data.payment_frequency,
        data.date_start,
        data.date_end,
        parseFloat(data.interest_rate)
    );

    let scheduleTableHTML = `
        <h3>Amortization Schedule</h3>
        <table>
            <thead>
                <tr>
                    <th>Date of Payment</th>
                    <th>Principal Amount</th>
                    <th>Interest Amount</th>
                    <th>Amount Paid</th>
                    <th>Date of Amount Paid</th>
                    <th>Remaining Balance</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    schedule.forEach(row => {
        scheduleTableHTML += `
            <tr>
                <td>${row['date-of-payment']}</td>
                <td>PHP ${row['amount-to-pay'].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>PHP ${row['interest-amount'].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td></td>
                <td></td>
                <td>PHP ${row['remaining-balance'].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    });
    
    scheduleTableHTML += `
                </tbody>
            </table>
        `;

    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>Loan Details</h2>
            <button class="close-modal-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="loan-info">
                <h3>Client Information</h3>
                <p><strong>Client Name:</strong> ${data.client_name}</p>
                <p><strong>Client ID:</strong> ${data.client_id}</p>
                <h3>Loan Information</h3>
                <p><strong>Loan ID:</strong> ${data.loan_application_id}</p>
                <p><strong>Loan Amount:</strong> PHP ${parseFloat(data.loan_amount).toLocaleString('en-US')}</p>
                <p><strong>Interest Rate:</strong> ${parseFloat(data.interest_rate)}%</p>
                <p><strong>Start Date:</strong> ${data.date_start}</p>
                <p><strong>End Date:</strong> ${data.date_end}</p>
                <p><strong>Payment Frequency:</strong> ${data.payment_frequency}</p>
            </div>
            <div class="loan-schedule">
                ${scheduleTableHTML}
            </div>
        </div>
        <div class="modal-footer">
            <button class="print-btn">Print</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // This is the added line to fix the issue
    modal.classList.add('is-active');

    setTimeout(() => {
        modalContent.classList.add('is-active');
    }, 10);

    const closeBtn = modalContent.querySelector('.close-modal-btn');
    const printBtn = modalContent.querySelector('.print-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modalContent.classList.remove('is-active');
            setTimeout(() => modal.remove(), 300);
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

// Updated function to make rows clickable
function renderLoanTable(loans, clientName, clientId) {
    const tableContainer = document.getElementById('loanTableContainer');

    if (loans.length === 0) {
        tableContainer.innerHTML = '<p>No loan applications found for this client.</p>';
        return;
    }

    let tableHTML = `
        <table class="loan-table">
            <thead>
                <tr>
                    <th>Loan ID</th>
                    <th>Amount</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Paid</th>
                </tr>
            </thead>
            <tbody>
    `;

    loans.forEach(loan => {
        const isPaid = loan.paid == 1 ? 'Yes' : 'No';
        // Add client data as a data attribute to the row
        loan.clientName = clientName;
        loan.clientID = clientId;
        tableHTML += `
            <tr class="loan-row" data-loan='${JSON.stringify(loan)}'>
                <td>${loan.loan_application_id}</td>
                <td>₱${parseFloat(loan.loan_amount).toFixed(2)}</td>
                <td>${loan.date_start}</td>
                <td>${loan.date_end}</td>
                <td>${loan.status}</td>
                <td>${isPaid}</td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
    `;
    tableContainer.innerHTML = tableHTML;

    // Add event listeners after the table is rendered
    addLoanRowClickListeners();
}
/**
 * Adds click event listeners to each loan table row to display the modal.
 * This function should be called inside renderLoanTable().
 */
function addLoanRowClickListeners() {
    const loanRows = document.querySelectorAll('.loan-row');
    loanRows.forEach(row => {
        row.addEventListener('click', async () => { // Add async here
            const loanData = JSON.parse(row.dataset.loan);
            
            try {
                // Fetch full loan details including client info and interest rate
                const response = await fetch(`PHP/reports_get_full_loan_details.php?loan_id=${loanData.loan_application_id}`);
                const fullLoanData = await response.json();
                
                if (fullLoanData && fullLoanData.loanID) { // Check if data is valid
                    // Create a new object with the correct keys for the modal function
                    const formattedData = {
                        client_name: fullLoanData.clientName,
                        client_id: fullLoanData.clientID,
                        loan_application_id: fullLoanData.loanID,
                        loan_amount: fullLoanData['loan-amount'],
                        interest_rate: fullLoanData['interest-rate'],
                        date_start: fullLoanData['date-start'],
                        date_end: fullLoanData['date-end'],
                        payment_frequency: fullLoanData['payment-frequency']
                    };
                    createLoanDetailsModal(formattedData);
                } else {
                    showMessageBox('Could not retrieve full loan details.', 'error');
                }
            } catch (error) {
                console.error('Error fetching full loan details:', error);
                showMessageBox('Error loading loan details. Please try again.', 'error');
            }
        });
    });
}

/**
 * Generates an amortization schedule for a loan.
 * @param {number} principal - The loan amount.
 * @param {string} frequency - The payment frequency ('monthly', 'weekly', etc.).
 * @param {string} startDate - The loan start date in 'YYYY-MM-DD' format.
 * @param {string} endDate - The loan end date in 'YYYY-MM-DD' format.
 * @param {number} interestRate - The annual interest rate in percent (e.g., 20 for 20%).
 * @returns {Array<Object>} An array of objects, each representing a payment period.
 */
   function generateLoanSchedule(amount, frequency, startDateStr, endDateStr, interestRate) {
        const schedule = [];
        let currentDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Calculate the total amount to be paid, including interest
        const totalInterest = amount * (interestRate / 100);
        const totalRepaymentAmount = amount + totalInterest;

        let remainingBalance = totalRepaymentAmount;

        let totalPayments = 0;

        // Calculate total number of payments based on frequency
        const oneDay = 24 * 60 * 60 * 1000;
        const totalDays = Math.round((endDate - currentDate) / oneDay);

        switch (frequency) {
            case 'daily':
                totalPayments = totalDays + 1;
                break;
            case 'weekly':
                totalPayments = Math.floor(totalDays / 7) + 1;
                break;
            case 'monthly':
                let months = (endDate.getFullYear() - currentDate.getFullYear()) * 12;
                months -= currentDate.getMonth();
                months += endDate.getMonth();
                totalPayments = months + 1;
                break;
            default:
                totalPayments = 1; // Handle single payment case
        }

        const paymentAmount = totalRepaymentAmount / totalPayments;
        const interestPerPayment = totalInterest / totalPayments;

        for (let i = 0; i < totalPayments; i++) {
            if (remainingBalance <= 0) break;

            remainingBalance -= paymentAmount;
            if (remainingBalance < 0) remainingBalance = 0; // Prevent negative balance

            schedule.push({
                'date-of-payment': currentDate.toISOString().split('T')[0],
                'amount-to-pay': paymentAmount,
                'interest-amount': interestPerPayment,
                'remaining-balance': remainingBalance
            });

            // Advance the date based on frequency
            switch (frequency) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
            }
        }

        return schedule;

    }
