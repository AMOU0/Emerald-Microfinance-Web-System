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
        // Assuming PHP/reports_loan_handler.php returns clientName and clientId if it gets modified
        renderLoanTable(result.data, result.clientName || 'Client Name N/A', clientId);
    } catch (error) {
        console.error('Error fetching loan applications:', error);
        showMessageBox('Could not load loan applications. Please try again later.', 'error');
        document.getElementById('loanTableContainer').innerHTML = '<p>Error loading loan applications. Please try again later.</p>';
    }
}

/**
 * Generates an amortization schedule for a loan.
 * @param {number} amount - The loan amount.
 * @param {string} frequency - The payment frequency ('monthly', 'weekly', etc.).
 * @param {string} startDateStr - The loan start date in 'YYYY-MM-DD' format.
 * @param {string} endDateStr - The loan end date in 'YYYY-MM-DD' format.
 * @param {number} interestRate - The annual interest rate in percent (e.g., 20 for 20%).
 * @returns {Array<Object>} An array of objects, each representing a payment period.
 */
function generateLoanSchedule(amount, frequency, startDateStr, endDateStr, interestRate) {
    const schedule = [];
    let currentDate = new Date(startDateStr + 'T00:00:00'); // Ensure date is treated correctly
    const endDate = new Date(endDateStr + 'T00:00:00');

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
            // Handle edge case where months count is zero but start/end date are the same
            if (months === 0 && currentDate.getTime() <= endDate.getTime()) {
                months = 1;
            }
            totalPayments = months; 
            break;
        default:
            totalPayments = 1; // Handle single payment case
    }
    
    // Safety check for payment calculation
    if (totalPayments <= 0) totalPayments = 1;

    const paymentAmount = totalRepaymentAmount / totalPayments;
    const interestPerPayment = totalInterest / totalPayments;

    let tempDate = new Date(currentDate);

    for (let i = 0; i < totalPayments; i++) {
        if (remainingBalance <= 0) break;

        // Calculate the date for this installment
        let installmentDate = new Date(tempDate);
        
        // Calculate remaining balance for this theoretical payment
        let currentRemainingBalance = remainingBalance - paymentAmount;
        if (i === totalPayments - 1) {
            // Last payment ensures remaining balance hits exactly 0
            currentRemainingBalance = 0;
        }
        if (currentRemainingBalance < 0) currentRemainingBalance = 0; // Prevent negative

        schedule.push({
            'date-of-payment': installmentDate.toISOString().split('T')[0],
            'amount-to-pay': paymentAmount, // This is the total installment (Principal + Interest)
            'interest-amount': interestPerPayment,
            'remaining-balance': currentRemainingBalance
        });
        
        remainingBalance = currentRemainingBalance;

        // Advance the date based on frequency
        switch (frequency) {
            case 'daily':
                tempDate.setDate(tempDate.getDate() + 1);
                break;
            case 'weekly':
                tempDate.setDate(tempDate.getDate() + 7);
                break;
            case 'monthly':
                tempDate.setMonth(tempDate.getMonth() + 1);
                break;
        }
    }

    return schedule;
}

/**
 * Merges the calculated loan schedule with the actual payments made.
 * Handles overpayments by applying them to the next scheduled payment.
 * @param {Array<Object>} schedule - The generated loan schedule.
 * @param {Array<Object>} payments - The actual payments made for the loan.
 * @returns {Array<Object>} The updated schedule with payment details.
 */
function mergeScheduleWithPayments(schedule, payments) {
    let paymentIndex = 0;
    let currentPaymentAmount = payments.length > 0 ? payments[0]['amount_paid'] : 0;
    let currentPaymentDate = payments.length > 0 ? payments[0]['date_paid'] : '';
    
    // Use a deep copy of the schedule to modify it and initialize payment columns
    const updatedSchedule = schedule.map(row => ({
        ...row,
        'amount-paid': 0,
        'date-of-amount-paid': ''
    }));

    for (let i = 0; i < updatedSchedule.length; i++) {
        let row = updatedSchedule[i];
        const requiredPayment = row['amount-to-pay'];
        let paymentAppliedToRow = 0;
        let firstPaymentDate = '';
        
        while (paymentAppliedToRow < requiredPayment - 0.01 && paymentIndex < payments.length) {
            
            // If the current payment chunk is exhausted, load the next payment transaction
            if (currentPaymentAmount < 0.01) {
                paymentIndex++;
                if (paymentIndex < payments.length) {
                    currentPaymentAmount = payments[paymentIndex]['amount_paid'];
                    currentPaymentDate = payments[paymentIndex]['date_paid'];
                } else {
                    currentPaymentAmount = 0;
                    break; // No more payments left
                }
            }
            
            // Calculate how much is needed to complete the required payment for this row
            const amountNeeded = requiredPayment - paymentAppliedToRow;
            
            // Determine how much to apply from the current payment chunk
            const amountToApply = Math.min(currentPaymentAmount, amountNeeded);
            
            // Apply the amount
            paymentAppliedToRow += amountToApply;
            currentPaymentAmount -= amountToApply;
            
            // Set the date of the FIRST payment transaction used for this row
            if (firstPaymentDate === '') {
                firstPaymentDate = currentPaymentDate;
            }
        }
        
        row['amount-paid'] = paymentAppliedToRow;
        row['date-of-amount-paid'] = firstPaymentDate;
    }
    
    // If there are still payments left, create extra rows for outstanding balance/remaining payments
    // NOTE: This part is for visual completeness if the payments exceed the schedule rows
    if (paymentIndex < payments.length || currentPaymentAmount > 0.01) {
        
        // Ensure the remaining current payment is added to the total
        if (currentPaymentAmount > 0.01) {
            updatedSchedule.push({
                'date-of-payment': 'N/A (Overpayment)',
                'amount-to-pay': 0,
                'interest-amount': 0,
                'remaining-balance': 0,
                'amount-paid': currentPaymentAmount,
                'date-of-amount-paid': currentPaymentDate
            });
        }
        
        // Add any remaining unused payments
        for (let j = paymentIndex + 1; j < payments.length; j++) {
            updatedSchedule.push({
                'date-of-payment': 'N/A (Overpayment)',
                'amount-to-pay': 0,
                'interest-amount': 0,
                'remaining-balance': 0,
                'amount-paid': payments[j]['amount_paid'],
                'date-of-amount-paid': payments[j]['date_paid']
            });
        }
    }

    return updatedSchedule;
}


/**
 * Dynamically creates and displays the loan details and schedule modal.
 * @param {Object} data - The loan application data from the PHP response, including guarantor info and payments.
 */
function createLoanDetailsModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content modal-content-transition';

    // Parse necessary data for calculation
    const loanAmount = parseFloat(data['loan-amount']);
    const interestRate = parseFloat(data['interest-rate']);

    // Generate the baseline payment schedule (Principal + Interest)
    const baselineSchedule = generateLoanSchedule(
        loanAmount,
        data['payment-frequency'],
        data['date-start'],
        data['date-end'],
        interestRate
    );
    
    // --- NEW CALCULATIONS ---
    const totalPayments = baselineSchedule.length;
    
    // The base payment amount is the total repayment amount divided by the number of payments
    const installmentAmount = totalPayments > 0 ? baselineSchedule[0]['amount-to-pay'] : 0;
    
    // Total Interest is the base amount * rate / 100
    const totalInterestAmount = loanAmount * (interestRate / 100);
    
    // Total Repayment Amount is Principal + Total Interest
    const totalRepaymentAmount = loanAmount + totalInterestAmount;
    // ------------------------

    
    // Merge the schedule with actual payments
    const scheduleWithPayments = mergeScheduleWithPayments(baselineSchedule, data.payments || []);

    // Helper function for currency formatting
    const formatCurrency = (amount) => {
        return `PHP ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    let scheduleTableHTML = `
        <h3>Amortization Schedule</h3>
        <table>
            <thead>
                <tr>
                    <th>Date of Payment</th>
                    <th>Installment Amount</th>
                    <th>Interest Component</th>
                    <th>Amount Paid</th>
                    <th>Date of Amount Paid</th>
                    <th>Remaining Balance</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    scheduleWithPayments.forEach(row => {
        // Display 'Amount Paid' and 'Date of Amount Paid'
        const amountPaid = row['amount-paid'] > 0 
            ? formatCurrency(row['amount-paid'])
            : '';
        const dateOfAmountPaid = row['date-of-amount-paid'] || '';

        scheduleTableHTML += `
            <tr>
                <td>${row['date-of-payment']}</td>
                <td>${formatCurrency(row['amount-to-pay'])}</td>
                <td>${formatCurrency(row['interest-amount'])}</td>
                <td>${amountPaid}</td>
                <td>${dateOfAmountPaid}</td>
                <td>${formatCurrency(row['remaining-balance'])}</td>
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
                <p><strong>Client ID:</strong> ${data.clientID}</p>
                <p><strong>Client Name:</strong> ${data.clientName}</p>
                
                <h3>Loan Information</h3>
                <p><strong>Loan ID:</strong> ${data.loanID}</p>
                <p><strong>Loan Amount (Principal):</strong> ${formatCurrency(loanAmount)}</p>
                <p><strong>Interest Rate:</strong> ${data['interest-rate']}%</p>
                <p><strong>Total Interest:</strong> ${formatCurrency(totalInterestAmount)}</p>
                <p><strong>Total Repayment Amount (Principal + Interest):</strong> ${formatCurrency(totalRepaymentAmount)}</p>
                <p><strong>Installment Amount:</strong> ${formatCurrency(installmentAmount)} (${data['payment-frequency']})</p>
                <p><strong>Total Payments:</strong> ${totalPayments}</p>
                <p><strong>Start Date:</strong> ${data['date-start']}</p>
                <p><strong>End Date:</strong> ${data['date-end']}</p>
                <p><strong>Payment Frequency:</strong> ${data['payment-frequency']}</p>
                
                <h3>Guarantor Information</h3>
                <p><strong>Guarantor Name:</strong> ${data.guarantorFirstName} ${data.guarantorMiddleName} ${data.guarantorLastName}</p>
                <p><strong>Address:</strong> ${data.guarantorStreetAddress}</p>
                <p><strong>Phone Number:</strong> ${data.guarantorPhoneNumber}</p>

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
        row.addEventListener('click', async () => {
            const loanData = JSON.parse(row.dataset.loan);
            
            try {
                // Fetch full loan details including client info, interest rate, guarantor, and PAYMENTS
                const response = await fetch(`PHP/reports_get_full_loan_details.php?loan_id=${loanData.loan_application_id}`);
                const fullLoanData = await response.json();
                
                if (fullLoanData && fullLoanData.loanID) { // Check if data is valid
                    createLoanDetailsModal(fullLoanData);
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