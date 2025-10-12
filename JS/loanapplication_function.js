document.addEventListener('DOMContentLoaded', function() {
    // =================================================================================
    // Global Variables and Constants
    // =================================================================================
    // Call the session check function as soon as the page loads.
    // NOTE: checkSessionAndRedirect() is assumed to be defined elsewhere (e.g., a shared utility file).
    if (typeof checkSessionAndRedirect === 'function') {
        checkSessionAndRedirect();
    } else {
        console.warn('checkSessionAndRedirect function is not defined. Session check skipped.');
    }

    // Selectors for Navigation and Logout (Consolidated)
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    // Selectors for Loan Application Form
    const showClientsBtn = document.getElementById('showClientsBtn');
    const clientIDInput = document.getElementById('clientID');
    const loanApplicationForm = document.getElementById('loanApplicationForm');
    const startDateInput = document.getElementById('date-start');
    const endDateInput = document.getElementById('date-end');
    const durationInput = document.getElementById('duration-of-loan');
    const guarantorLastNameInput = document.getElementById('guarantorLastName');
    const guarantorFirstNameInput = document.getElementById('guarantorFirstName');
    const guarantorMiddleNameInput = document.getElementById('guarantorMiddleName');
    const guarantorPhoneNumberInput = document.getElementById('guarantorPhoneNumber');

    // REMOVED: Selectors for Target Table and Target ID (No longer needed from HTML)

    const nameInputs = [guarantorLastNameInput, guarantorFirstNameInput, guarantorMiddleNameInput];

    let clientName = '';
    let globalInterestRate = 0;

    const NAME_REGEX_VALIDATE = /^[a-zA-Z\s]+$/;
    const NAME_REGEX_FILTER = /[^a-zA-Z\s]/g;
    const PHONE_REGEX = /^\d{11}$/;


    // =================================================================================
    // Helper Functions
    // =================================================================================

    /**
     * Displays a custom message box.
     */
    function showMessageBox(message, type) {
        const existingBox = document.querySelector('.message-box');
        if (existingBox) existingBox.remove();
        const box = document.createElement('div');
        box.className = `message-box fixed top-4 right-4 p-4 rounded-lg text-white shadow-lg transition-transform duration-300 transform translate-y-0`;
        box.classList.add(type === 'error' ? 'bg-red-500' : 'bg-green-500');
        box.textContent = message;
        document.body.appendChild(box);
        setTimeout(() => {
            box.classList.add('translate-y-full');
            setTimeout(() => box.remove(), 300);
        }, 3000);
    }

    /**
     * Helper function to show error feedback on an input element.
     */
    function showInputError(event, inputElement, errorMessage) {
        if (event) event.preventDefault();
        showMessageBox(errorMessage, 'error');
        inputElement.classList.add('input-error');
        inputElement.focus();
        logUserAction('VIEWED', `Validation FAILED: ${errorMessage}`); 
    }

    /**
     * Helper function to close any active modal.
     */
    function closeModal() {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            const modalContent = modalOverlay.querySelector('.modal-content');
            if (modalContent) {
                 modalContent.classList.remove('is-active');
            }
            setTimeout(() => {
                modalOverlay.remove();
            }, 300);
        }
    }
    window.closeModal = closeModal;

    /**
     * Helper function to generate a loan payment schedule.
     */
    function generateLoanSchedule(amount, frequency, startDateStr, endDateStr, interestRate) {
        const schedule = [];
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const totalInterest = amount * (interestRate / 100);
        const totalRepaymentAmount = amount + totalInterest;
        let remainingBalance = totalRepaymentAmount;
        let totalPayments = 0;
        const oneDay = 24 * 60 * 60 * 1000;
        const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / oneDay);

        switch (frequency) {
            case 'daily': totalPayments = totalDays; break;
            case 'weekly': totalPayments = Math.floor(totalDays / 7); break;
            case 'monthly':
                let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
                months += endDate.getMonth() - startDate.getMonth();
                totalPayments = months > 0 ? months : 1;
                break;
            default: totalPayments = 1;
        }

        if (totalPayments <= 0) {
            totalPayments = 1;
        }

        const paymentAmount = totalRepaymentAmount / totalPayments;
        const interestPerPayment = totalInterest / totalPayments;
        let currentDate = new Date(startDate);

        for (let i = 0; i < totalPayments; i++) {
            let paymentDate = new Date(currentDate);

            if (i > 0) {
                 switch (frequency) {
                     case 'daily': paymentDate.setDate(currentDate.getDate() + 1); break;
                     case 'weekly': paymentDate.setDate(currentDate.getDate() + 7); break;
                     case 'monthly': paymentDate.setMonth(currentDate.getMonth() + 1); break;
                 }
                 currentDate = paymentDate;
            }

            remainingBalance -= paymentAmount;

            schedule.push({
                'date-of-payment': paymentDate.toISOString().split('T')[0],
                'amount-to-pay': paymentAmount,
                'interest-amount': interestPerPayment,
                'remaining-balance': Math.max(0, remainingBalance)
            });
        }

        if (schedule.length > 0) {
            const lastPayment = schedule[schedule.length - 1];
            const paidSoFar = schedule.slice(0, -1).reduce((sum, p) => sum + p['amount-to-pay'], 0);
            const remainingToPay = totalRepaymentAmount - paidSoFar;

            lastPayment['amount-to-pay'] = remainingToPay;
            lastPayment['remaining-balance'] = 0;
        }

        return schedule;
    }


    // =================================================================================
    // A. NAVIGATION & LOGOUT
    // =================================================================================

    // --- Global Logging Function (UPDATED to accept DML parameters) ---
    /**
     * Logs a user action with optional DML (Data Manipulation Language) context.
     */
    function logUserAction(actionType, description, targetTable = null, targetID = null, beforeState = null, afterState = null) {
        const bodyData = new URLSearchParams();
        bodyData.append('action', actionType); 
        bodyData.append('description', description); 
        
        // Add the optional DML parameters
        if (targetTable) bodyData.append('target_table', targetTable);
        if (targetID) bodyData.append('target_id', targetID);
        if (beforeState) bodyData.append('before_state', beforeState);
        if (afterState) bodyData.append('after_state', afterState);

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

            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            const targetPage = urlMapping[linkText];
            
            if (targetPage) {
                const actionType = 'NAVIGATION';
                const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

                logUserAction(actionType, description);

                window.location.href = targetPage;
            } else {
                const actionType = 'NAVIGATION';
                const description = `Clicked link "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.location.href = 'PHP/check_logout.php'; 
        });
    }

    // =================================================================================
    // B. REAL-TIME INPUT FILTERING
    // =================================================================================
    function filterNameInput() {
        this.value = this.value.replace(NAME_REGEX_FILTER, '');
        this.classList.remove('input-error');
    }

    nameInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', filterNameInput);
        }
    });

    if (guarantorPhoneNumberInput) {
        guarantorPhoneNumberInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            this.classList.remove('input-error');
        });
    }
    
    // The targetIDInput check is no longer needed as the element is removed from HTML

    // =================================================================================
    // C. LOAN DURATION CALCULATION
    // =================================================================================
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            if (this.value && endDateInput && durationInput) {
                const startDate = new Date(this.value);
                const loanDuration = 100;
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + loanDuration);
                const formattedEndDate = endDate.toISOString().split('T')[0];

                endDateInput.value = formattedEndDate;
                durationInput.value = loanDuration + ' days';
            } else if (endDateInput && durationInput) {
                endDateInput.value = '';
                durationInput.value = '';
            }
        });
    }

    // =================================================================================
    // D. LOAN APPLICATION SUBMISSION LOGIC & VALIDATION
    // =================================================================================

    /**
     * Handles the asynchronous submission of the loan application data.
     */
    async function handleLoanApplicationSubmission() {
        const loanAmountInput = document.getElementById('loan-amount');
        const paymentFrequencyInput = document.getElementById('payment-frequency');
        const colateralInput = document.getElementById('colateral');
        const guarantorStreetAddressInput = document.getElementById('guarantorStreetAddress');
        
        // Target Table/ID are now handled exclusively by the JS log calls, not passed to PHP
        
        const data = {
            clientID: clientIDInput.value.trim(),
            clientName: clientName,
            colateral: colateralInput ? colateralInput.value.trim() : '',
            guarantorLastName: guarantorLastNameInput.value.trim(),
            guarantorFirstName: guarantorFirstNameInput.value.trim(),
            guarantorMiddleName: guarantorMiddleNameInput.value.trim(),
            guarantorStreetAddress: guarantorStreetAddressInput ? guarantorStreetAddressInput.value.trim() : '',
            guarantorPhoneNumber: guarantorPhoneNumberInput.value.trim(),
            'loan-amount': parseFloat(loanAmountInput ? loanAmountInput.value : 0),
            'payment-frequency': paymentFrequencyInput ? paymentFrequencyInput.value : '',
            'date-start': startDateInput.value,
            'duration-of-loan': durationInput.value,
            'date-end': endDateInput.value,
            'interest-rate': globalInterestRate
        };

        try {
            const response = await fetch('PHP/loanapplication_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const result = await response.json();

            if (result.status === 'success') {
                showMessageBox(result.message, 'success');
                loanApplicationForm.reset();
                data.loanID = result.loan_application_id; // Get the newly created ID
                createLoanDetailsModal(data);
                
                // === LOG FIX: Target Table set to 'loan_applications' and Target ID uses the new loan ID ===
                const loanDataString = JSON.stringify(data);
                const newLoanID = result.loan_application_id;
                
                logUserAction(
                    'CREATED', 
                    `Loan application successfully created. Loan ID: ${newLoanID}. Client ID: ${data.clientID}.`,
                    'loan_applications', // Correct Target Table
                    newLoanID,         // Correct Target ID (the newly created loan_application_id)
                    null,                // Before State (New record)
                    loanDataString       // After State (The complete submitted loan data)
                );
                // =======================================================
            } else {
                showMessageBox(result.message, 'error');
                logUserAction('CREATED', `Loan application submission failed. Msg: ${result.message}`); 
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showMessageBox('An error occurred during submission. Please try again.', 'error');
            logUserAction('CREATED', `Fetch error during loan submission: ${error.message}`); 
        }
    }

    if (loanApplicationForm) {
        loanApplicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 0. Validate Client ID
            if (!clientIDInput.value.trim()) {
                showInputError(e, clientIDInput, 'Error: Client ID is required. Please use the "Show Clients" button.');
                return;
            }

            // 1. Validate Names
            for (const input of nameInputs) {
                const value = input.value.trim();
                if (!input) continue;

                const friendlyName = input.id.replace('guarantor', '').replace(/([A-Z])/g, ' $1').trim();

                if (value === "") {
                    showInputError(e, input, `Error: Guarantor ${friendlyName} is required.`);
                    return;
                }
                if (!NAME_REGEX_VALIDATE.test(value)) {
                    showInputError(e, input, `Error: Guarantor ${friendlyName} must contain only letters and spaces.`);
                    return;
                }
            }

            // 2. Validate Phone Number
            if (guarantorPhoneNumberInput) {
                const phoneNumber = guarantorPhoneNumberInput.value;
                if (!PHONE_REGEX.test(phoneNumber.trim())) {
                    showInputError(e, guarantorPhoneNumberInput, 'Error: Guarantor Phone Number must contain exactly 11 digits and only numbers.');
                    return;
                }
            }

            // 3. Validate Loan Details
            const loanAmountInput = document.getElementById('loan-amount');
            const paymentFrequencyInput = document.getElementById('payment-frequency');
            
            const loanAmount = loanAmountInput ? loanAmountInput.value : '';
            const paymentFrequency = paymentFrequencyInput ? paymentFrequencyInput.value : '';
            const dateStart = startDateInput ? startDateInput.value : '';
            const dateEnd = endDateInput ? endDateInput.value : '';
            
            // === REMOVED HTML-DEPENDENT VALIDATION BLOCK ===
            // This block is no longer needed as we're defining the log variables in code
            // =============================================

            if (!loanAmount || isNaN(parseFloat(loanAmount)) || parseFloat(loanAmount) <= 0) {
                showInputError(e, loanAmountInput, 'Error: Please enter a valid loan amount greater than zero.');
                return;
            }
            if (!paymentFrequency) {
                showInputError(e, paymentFrequencyInput, 'Error: Please select a payment frequency.');
                return;
            }
            if (!dateStart) {
                showInputError(e, startDateInput, 'Error: Please select a loan start date.');
                return;
            }
            if (!dateEnd) {
                showInputError(e, endDateInput, 'Error: Loan end date is missing (check start date selection).');
                return;
            }
            
            // === Define Log Context from Logic ===
            const logTargetTable = 'loan_applications';
            const logTargetID = clientIDInput.value.trim(); // Use Client ID as the target ID for the creation attempt log
            // =====================================

            // Log attempt before submission
            logUserAction(
                'CREATED', 
                `Attempting submission for Client ID: ${clientIDInput.value.trim()}. Target: ${logTargetTable} (${logTargetID})`,
                logTargetTable,
                logTargetID
            );

            handleLoanApplicationSubmission();
        });
    }

    // =================================================================================
    // E. MODAL CREATION AND LOAN SCHEDULE DISPLAY
    // =================================================================================

    /**
     * Dynamically creates and displays the loan details and schedule modal.
     */
    function createLoanDetailsModal(data) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-content-transition';

        const schedule = generateLoanSchedule(
            data['loan-amount'],
            data['payment-frequency'],
            data['date-start'],
            data['date-end'],
            data['interest-rate']
        );

        let scheduleTableHTML = `
            <div class="schedule-table-container mt-6">
                <h3 class="text-xl font-semibold mb-3">Amortization Schedule</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Payment</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal + Interest</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Amount</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Amount Paid</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Balance</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
        `;
        schedule.forEach(row => {
            scheduleTableHTML += `
                <tr>
                    <td class="px-3 py-2 whitespace-nowrap">${row['date-of-payment']}</td>
                    <td class="px-3 py-2 whitespace-nowrap">PHP ${row['amount-to-pay'].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="px-3 py-2 whitespace-nowrap">PHP ${row['interest-amount'].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="px-3 py-2 whitespace-nowrap"></td>
                    <td class="px-3 py-2 whitespace-nowrap"></td>
                    <td class="px-3 py-2 whitespace-nowrap">PHP ${row['remaining-balance'].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `;
        });
        scheduleTableHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // When displaying the modal after success, the target log information is not available
        // in the `data` object, so we use the final values.
        const modalTargetTable = 'loan_applications'; 
        const modalTargetID = data.loanID;

        modalContent.innerHTML = `
            <div class="modal-header flex justify-between items-center p-4 border-b">
                <h2 class="text-2xl font-bold">Loan Details & Schedule</h2>
                <button class="close-modal-btn text-3xl leading-none text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <div class="modal-body p-6 overflow-y-auto max-h-[80vh]">
                <div class="loan-info grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Client Information</h3>
                        <p><strong>Client ID:</strong> ${data.clientID}</p>
                        <p><strong>Client Name:</strong> ${data.clientName}</p>
                        <h3 class="text-lg font-semibold mt-4 mb-2">Loan Information</h3>
                        <p><strong>Loan ID:</strong> ${data.loanID}</p>
                        <p><strong>Loan Amount:</strong> PHP ${data['loan-amount'].toLocaleString('en-US')}</p>
                        <p><strong>Interest Rate:</strong> ${data['interest-rate']}%</p>
                        <p><strong>Start Date:</strong> ${data['date-start']}</p>
                        <p><strong>End Date:</strong> ${data['date-end']}</p>
                        <p><strong>Payment Frequency:</strong> ${data['payment-frequency']}</p>
                        
                        <h3 class="text-lg font-semibold mt-4 mb-2">Internal Log Information</h3>
                        <p><strong>Log Target Table:</strong> ${modalTargetTable}</p>
                        <p><strong>Log Target ID:</strong> ${modalTargetID}</p>

                    </div>
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Guarantor Information</h3>
                        <p><strong>Guarantor Name:</strong> ${data.guarantorFirstName} ${data.guarantorMiddleName} ${data.guarantorLastName}</p>
                        <p><strong>Address:</strong> ${data.guarantorStreetAddress}</p>
                        <p><strong>Phone Number:</strong> ${data.guarantorPhoneNumber}</p>
                        <p><strong>Colateral:</strong> ${data.colateral}</p>
                    </div>
                </div>
                <div class="loan-schedule">
                    ${scheduleTableHTML}
                </div>
            </div>
            <div class="modal-footer p-4 border-t flex justify-end">
                <button class="print-btn bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">Print</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        setTimeout(() => modalContent.classList.add('is-active'), 10);
        
        // Log: VIEWED
        logUserAction(
            'VIEWED', 
            `Opened Loan Details Modal for Loan ID: ${data.loanID}. Target: ${modalTargetTable} (${modalTargetID})`
        );


        const closeBtn = modalContent.querySelector('.close-modal-btn');
        const printBtn = modalContent.querySelector('.print-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal();
                logUserAction('VIEWED', `Closed Loan Details Modal for Loan ID: ${data.loanID}`);
            }); 
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
                logUserAction('VIEWED', `Printed Loan Details for Loan ID: ${data.loanID}`); 
            });
        }
    }


    // =================================================================================
    // F. CLIENT SEARCH MODAL LOGIC
    // =================================================================================

    if (showClientsBtn) {
        showClientsBtn.addEventListener('click', async () => {
            // Log when opening the modal (Viewing the clients table)
            logUserAction('VIEWED', 'Opened Client Search Modal.', 'clients', null, null, null);

            try {
                if (!clientIDInput) {
                    showMessageBox('Error: Client ID input field not found.', 'error');
                    return;
                }

                const [clientsResponse, interestResponse] = await Promise.all([
                    fetch('PHP/getclient_handler.php'),
                    fetch('PHP/getactiveinterest_handler.php')
                ]);

                if (!clientsResponse.ok) {
                    throw new Error(`HTTP error! Status: ${clientsResponse.status} (Clients)`);
                }
                if (!interestResponse.ok) {
                    throw new Error(`HTTP error! Status: ${interestResponse.status} (Interest)`);
                }

                const clientsResult = await clientsResponse.json();
                const interestResult = await interestResponse.json();

                if (clientsResult.status === 'error') {
                    showMessageBox(clientsResult.message, 'error');
                    logUserAction('VIEWED', `Could not fetch client list. Msg: ${clientsResult.message}`, 'clients', null, null, null);
                    return;
                }

                if (interestResult.status === 'success' && interestResult.interestRate !== undefined) {
                    globalInterestRate = parseFloat(interestResult.interestRate);
                    logUserAction('VIEWED', `Fetched Interest Rate: ${globalInterestRate}%`, 'interest_pecent', null, null, null);
                } else {
                    console.error(interestResult.message || 'Interest rate not found in successful response.');
                    showMessageBox('Could not load interest rate.', 'error');
                    globalInterestRate = 0;
                    logUserAction('VIEWED', 'Could not load active interest rate.', 'interest_pecent', null, null, null);
                }

                const clients = clientsResult.data || [];
                createClientModal(clients, globalInterestRate);
            } catch (error) {
                console.error('Error fetching data:', error);
                showMessageBox('Could not load client list. Please try again later. Details: ' + error.message, 'error');
                logUserAction('VIEWED', `Fetch error loading clients/interest: ${error.message}`);
            }
        });
    }

    function createClientModal(clients, interestRate) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-content-transition bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto';

        function renderClientList(clientArray, ulElement) {
            if (!ulElement) return;
            ulElement.innerHTML = clientArray.map(client => `
                <li class="client-list-item p-3 border-b cursor-pointer rounded-lg hover:bg-gray-100 transition-colors duration-150" data-client-id="${client.id}" data-client-name="${client.name}">
                    <span class="font-medium">${client.name}</span>
                    <span class="text-gray-500 text-sm block">ID: ${client.id}</span>
                </li>
            `).join('');
        }

        modalContent.innerHTML = `
            <div class="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
                <h2 class="text-2xl font-bold">Select a Client</h2>
                <button class="close-button text-gray-400 hover:text-gray-600 transition-colors duration-200" onclick="closeModal()">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="search-container mb-4">
                <input type="text" id="clientSearchInput" class="form-input w-full p-2 border border-gray-300 rounded" placeholder="Search by name...">
            </div>
            <div class="mb-4 text-center p-2 bg-blue-50 rounded-lg">
                <h3 class="text-lg font-medium text-blue-700">Active Interest Rate: ${interestRate}%</h3>
            </div>
            <ul class="client-list overflow-y-auto max-h-64 border border-gray-200 rounded-lg p-2">
                </ul>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        setTimeout(() => modalContent.classList.add('is-active'), 10);

        const clientList = modal.querySelector('.client-list');
        const searchInput = modal.querySelector('#clientSearchInput');
        const closeBtn = modal.querySelector('.close-button');

        renderClientList(clients, clientList);

        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value.toLowerCase();
                const filteredClients = clients.filter(client => client.name.toLowerCase().includes(searchTerm));
                renderClientList(filteredClients, clientList);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                logUserAction('VIEWED', 'Closed Client Selection Modal.');
            });
        }


        if (clientList) {
            clientList.addEventListener('click', (event) => {
                const selectedItem = event.target.closest('li');
                if (selectedItem) {
                    const id = selectedItem.getAttribute('data-client-id');
                    const name = selectedItem.getAttribute('data-client-name');
                    if (id && name) {
                        // Capture the current value before setting the new one
                        const beforeID = clientIDInput.value;
                        const beforeName = clientName;

                        clientIDInput.value = id;
                        clientName = name;
                        closeModal();
                        
                        // === UPDATED LOG CALL: Include Target Table/ID and Before/After States ===
                        const beforeState = JSON.stringify({ clientID: beforeID, clientName: beforeName });
                        const afterState = JSON.stringify({ clientID: id, clientName: name });
                        
                        logUserAction(
                            'UPDATED', 
                            `Selected Client ID ${id} (${name}) for loan application.`,
                            'clients', // Target Table
                            id,          // Target ID (client_ID)
                            beforeState, // Before State (previous selection)
                            afterState   // After State (new selection)
                        );
                        // =======================================================================
                    }
                }
            });
        }
    }
});