document.addEventListener('DOMContentLoaded', function() {
            enforceRoleAccess(['admin','Loan Officer']); 
        });
/*=============================================================================*/

document.addEventListener('DOMContentLoaded', function() {
    // =================================================================================
    // Global Variables and Constants
    // =================================================================================
    // Call the session check function as soon as the page loads.
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
    
    // NEW SELECTOR for Loan Amount Select and Client Name Display
    const loanAmountSelect = document.getElementById('loan-amount'); // Changed from Input to Select
    const displayClientName = document.getElementById('displayClientName'); 
    
    const interestRateInput = document.createElement('input'); // Create a hidden input for the interest rate
    interestRateInput.setAttribute('type', 'hidden');
    interestRateInput.setAttribute('id', 'interest-rate');
    interestRateInput.setAttribute('name', 'interest-rate');
    loanApplicationForm.appendChild(interestRateInput); // Append it to the form

    const nameInputs = [guarantorLastNameInput, guarantorFirstNameInput, guarantorMiddleNameInput];

    let clientName = '';
    let globalInterestRate = 0;
    let originalLoanOptions = []; // Stores the full list of options
    let maxFirstLoanAmount = 5000; // Fixed maximum limit

    const NAME_REGEX_VALIDATE = /^[a-zA-Z\s]+$/;
    const NAME_REGEX_FILTER = /[^a-zA-Z\s]/g;
    const PHONE_REGEX = /^\d{11}$/;
    
    // Currency formatter
    const formatCurrency = (amount) => `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


    // =================================================================================
    // NEW FUNCTION: Loan History Check and Option Filtering (Frontend Enforcement)
    // =================================================================================
    /**
     * Checks if the client has prior loans and modifies the loan amount SELECT options.
     * @param {string} clientID The ID of the currently selected client.
     */
    async function checkFirstLoanAndApplyFilter(clientID) {
        if (!loanAmountSelect) return; 

        // 1. Store original options if not already done
        if (originalLoanOptions.length === 0) {
            originalLoanOptions = Array.from(loanAmountSelect.options).map(option => ({
                value: option.value,
                text: option.text,
                originalElement: option.cloneNode(true)
            }));
        }

        // 2. Clear current options and reset to original
        loanAmountSelect.innerHTML = '';
        originalLoanOptions.forEach(opt => loanAmountSelect.appendChild(opt.originalElement.cloneNode(true)));
        
        try {
            const response = await fetch(`PHP/loanapplicationcheckfirstloan_handler.php?clientID=${clientID}`);
            const result = await response.json();

            if (result.status === 'success' && result.is_first_loan) {
                // Client is a first-time borrower: Filter out options > ₱5000
                
                // Keep the 'Select...' option
                const selectOption = loanAmountSelect.querySelector('option[value=""]');

                // Filter out all options whose value is greater than the max limit
                const optionsToRemove = Array.from(loanAmountSelect.options).filter(option => 
                    parseFloat(option.value) > maxFirstLoanAmount
                );

                optionsToRemove.forEach(option => {
                    loanAmountSelect.removeChild(option);
                });
                
                // If the currently selected value is > ₱5000, reset it
                if (parseFloat(loanAmountSelect.value) > maxFirstLoanAmount) {
                    loanAmountSelect.value = "";
                }

                // Alert the user about the restriction
                alert(`⚠️ IMPORTANT: This is the client's first loan. The maximum loan amount is set to ₱${maxFirstLoanAmount.toLocaleString('en-US')}. Options above this amount have been removed.`);

            } else if (result.status === 'success' && !result.is_first_loan) {
                // Client has loan history: All options are already available (due to reset above)
                console.log("Client has existing loan history. All loan options are available.");
            } else {
                console.error('Failed to check loan history:', result.message);
            }
        } catch (error) {
            console.error('Error checking loan history:', error);
        }
    }


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
        if(typeof logUserAction === 'function') logUserAction('VIEWED', `Validation FAILED: ${errorMessage}`); 
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
     * Helper function to generate a loan payment schedule (Equal Principal Payment Method).
     */
    function generateLoanSchedule(principal, frequency, startDateStr, durationInPeriods, interestRate) {
        const schedule = [];
        const startDate = new Date(startDateStr);
        let currentDate = new Date(startDateStr);
        
        let remainingBalance = principal;
        const principalPerPayment = principal / durationInPeriods;

        const totalInterest = principal * (interestRate / 100);
        const interestPerPayment = totalInterest / durationInPeriods;

        // Helper to determine the next payment date based on frequency
        const getNextPaymentDate = (date, freq) => {
            let nextDate = new Date(date);
            switch (freq) {
                case 'daily':
                    nextDate.setDate(date.getDate() + 1);
                    break;
                case 'weekly':
                    nextDate.setDate(date.getDate() + 7);
                    break;
                case 'monthly':
                    nextDate.setMonth(date.getMonth() + 1);
                    if (nextDate.getDate() !== date.getDate()) {
                        nextDate.setDate(0); 
                    }
                    break;
                default:
                    nextDate.setDate(date.getDate() + 1);
            }
            return nextDate;
        };

        for (let i = 1; i <= durationInPeriods; i++) {
            
            let paymentDate = currentDate;

            if (i > 1) {
                 paymentDate = getNextPaymentDate(currentDate, frequency);
                 currentDate = paymentDate;
            }

            const principalPayment = (i === durationInPeriods) ? remainingBalance : principalPerPayment;
            const interestPayment = interestPerPayment; 
            const totalPayment = principalPerPayment + interestPerPayment;
            
            remainingBalance = Math.max(0, remainingBalance - principalPayment);
            
            schedule.push({
                'period': i,
                'dueDate': paymentDate.toLocaleDateString('en-US'),
                'principal': principalPayment,
                'interest': interestPayment,
                'totalPayment': totalPayment,
                'balance': (i === durationInPeriods) ? 0 : remainingBalance
            });
        }
        
        const totalPayable = principal + totalInterest;

        return {
            schedule,
            totalInterest,
            totalPayable,
            principalPerPayment, 
            totalPayments: durationInPeriods
        };
    }


    // =================================================================================
    // A. NAVIGATION & LOGOUT
    // =================================================================================
    function logUserAction(actionType, description, targetTable = null, targetID = null, beforeState = null, afterState = null) {
        const bodyData = new URLSearchParams();
        bodyData.append('action', actionType); 
        bodyData.append('description', description); 
        
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
    
 // =================================================================================
    // C. LOAN DURATION CALCULATION (FIXED TO 100 DAYS)
    // =================================================================================
    if (startDateInput) {
        
        // START: Logic to restrict selectable dates to AFTER next Tuesday (Next Wednesday)
        const today = new Date();
        const TUESDAY = 2; 

        const currentDay = today.getDay();

        let daysUntilNextTuesday = (TUESDAY - currentDay + 7) % 7;

        if (daysUntilNextTuesday === 0) {
            daysUntilNextTuesday = 7;
        }

        const nextTuesday = new Date(today);
        nextTuesday.setDate(today.getDate() + daysUntilNextTuesday);

        const minSelectableDate = new Date(nextTuesday);
        minSelectableDate.setDate(nextTuesday.getDate() + 1);

        const minDateStr = minSelectableDate.toISOString().split('T')[0];

        startDateInput.min = minDateStr;
        console.log(`Loan start date min restriction set to: ${minDateStr} (the day after next Tuesday)`);
        // END: Logic to restrict selectable dates.

        /**
         * Function to calculate duration based on frequency, fixed to 100 days.
         * The number of 'periods' is calculated based on the 100-day duration.
         */
        const calculateDuration = (frequency) => {
            const FIXED_DAYS = 100;
            let periods = 0;
            let label = '';
            
            switch (frequency) {
                case 'daily': 
                    periods = FIXED_DAYS; 
                    label = 'days';
                    break;
                case 'weekly': 
                    periods = Math.ceil(FIXED_DAYS / 7); 
                    label = 'weeks';
                    break;
                case 'monthly': 
                    periods = 4; // 4 periods covers the 100 days.
                    label = 'months';
                    break;
                default: 
                    return { days: 0, periods: 0, label: 'days' };
            }

            return { days: FIXED_DAYS, periods: periods, label: label };
        };

        const paymentFrequencySelect = document.getElementById('payment-frequency');
        
        // Add listener to Payment Frequency
        if (paymentFrequencySelect) {
            paymentFrequencySelect.addEventListener('change', function() {
                // Trigger change on start date to re-calculate end date/duration
                startDateInput.dispatchEvent(new Event('change'));
            });
        }
        
        startDateInput.addEventListener('change', function() {
            const startDateStr = this.value;
            const frequency = paymentFrequencySelect.value;
            
            if (startDateStr && endDateInput && durationInput && frequency) {
                const startDate = new Date(startDateStr);
                const { days, periods, label } = calculateDuration(frequency);
                
                const endDate = new Date(startDate);
                
                // FIXED LOGIC: The End Date is always the Start Date + 100 days
                endDate.setDate(startDate.getDate() + days); 
                
                const formattedEndDate = endDate.toISOString().split('T')[0];

                endDateInput.value = formattedEndDate;
                durationInput.value = `${periods} ${label} (${days} days)`; 
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
        const colateralInput = document.getElementById('colateral');
        const guarantorStreetAddressInput = document.getElementById('guarantorStreetAddress');
        const paymentFrequencySelect = document.getElementById('payment-frequency');

        const data = {
            clientID: clientIDInput.value.trim(),
            clientName: clientName,
            colateral: colateralInput ? colateralInput.value.trim() : '',
            guarantorLastName: guarantorLastNameInput.value.trim(),
            guarantorFirstName: guarantorFirstNameInput.value.trim(),
            guarantorMiddleName: guarantorMiddleNameInput.value.trim(),
            guarantorStreetAddress: guarantorStreetAddressInput ? guarantorStreetAddressInput.value.trim() : '',
            guarantorPhoneNumber: guarantorPhoneNumberInput.value.trim(),
            'loan-amount': parseFloat(loanAmountSelect ? loanAmountSelect.value : 0),
            'payment-frequency': paymentFrequencySelect ? paymentFrequencySelect.value : '',
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
                // Handle non-200 responses if necessary
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Server responded with an error status.');
            }

            const result = await response.json();

            if (result.status === 'success') {
                showMessageBox(result.message, 'success');
                loanApplicationForm.reset();
                
                // Reset loan options back to full list after successful submission
                checkFirstLoanAndApplyFilter(data.clientID); 

                data.loanID = result.loan_application_id;
                
                createLoanDetailsModal(data);
                
                const loanDataString = JSON.stringify(data);
                const newLoanID = result.loan_application_id;
                
                if (typeof logUserAction === 'function') {
                    logUserAction(
                        'CREATED', 
                        `Loan application successfully created. Loan ID: ${newLoanID}. Client ID: ${data.clientID}.`,
                        'loan_applications',
                        newLoanID,
                        null,
                        loanDataString
                    );
                }
            } else {
                showMessageBox(result.message, 'error');
                if (typeof logUserAction === 'function') logUserAction('CREATED', `Loan application submission failed. Msg: ${result.message}`); 
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showMessageBox('An error occurred during submission. ' + error.message, 'error');
            if (typeof logUserAction === 'function') logUserAction('CREATED', `Fetch error during loan submission: ${error.message}`); 
        }
    }

    if (loanApplicationForm) {
        loanApplicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!clientIDInput.value.trim()) {
                showInputError(e, clientIDInput, 'Error: Client ID is required. Please use the "Search client" button.');
                return;
            }

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

            if (guarantorPhoneNumberInput) {
                const phoneNumber = guarantorPhoneNumberInput.value;
                if (!PHONE_REGEX.test(phoneNumber.trim())) {
                    showInputError(e, guarantorPhoneNumberInput, 'Error: Guarantor Phone Number must contain exactly 11 digits and only numbers.');
                    return;
                }
            }
            
            const paymentFrequencySelect = document.getElementById('payment-frequency');
            
            const loanAmount = loanAmountSelect ? loanAmountSelect.value : '';
            const paymentFrequency = paymentFrequencySelect ? paymentFrequencySelect.value : '';
            const dateStart = startDateInput ? startDateInput.value : '';
            const dateEnd = endDateInput ? endDateInput.value : '';
            
            if (!loanAmount || isNaN(parseFloat(loanAmount)) || parseFloat(loanAmount) <= 0) {
                showInputError(e, loanAmountSelect, 'Error: Please select a valid loan amount greater than zero.');
                return;
            }
            // --- START: NEW CLIENT-SIDE VALIDATION (Final Check before sending) ---
            const loanAmountValue = parseFloat(loanAmount);
            // We check the loan count on modal open, but we check the selected value now
            // The options are already filtered, but this is a final fail-safe.
            
            // Re-check if the client ID has an existing loan record
            // NOTE: A full second fetch here is redundant if the filtering was correct. 
            // We rely on the options being filtered, but we check the value against the limit for added safety if options were manipulated.
            const isOptionFiltered = Array.from(loanAmountSelect.options).some(opt => parseFloat(opt.value) > maxFirstLoanAmount);

            if (!isOptionFiltered && loanAmountValue > maxFirstLoanAmount) {
                 showInputError(e, loanAmountSelect, `Error: Loan amount ₱${loanAmountValue.toLocaleString()} exceeds the maximum limit of ₱${maxFirstLoanAmount.toLocaleString()} for first-time clients.`);
                 return;
            }
            // --- END: NEW CLIENT-SIDE VALIDATION ---


            if (!paymentFrequency) {
                showInputError(e, paymentFrequencySelect, 'Error: Please select a payment frequency.');
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
            
            const logTargetTable = 'loan_applications';
            const logTargetID = clientIDInput.value.trim();

            if (typeof logUserAction === 'function') {
                logUserAction(
                    'CREATED', 
                    `Attempting submission for Client ID: ${clientIDInput.value.trim()}. Target: ${logTargetTable} (${logTargetID})`,
                    logTargetTable,
                    logTargetID
                );
            }

            handleLoanApplicationSubmission();
        });
    }

    // =================================================================================
    // E. MODAL CREATION AND LOAN SCHEDULE DISPLAY (Generates Side-by-Side HTML)
    // =================================================================================

    /**
     * Dynamically creates and displays the loan details and schedule modal.
     */
    function createLoanDetailsModal(data) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-content-transition bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl mx-auto';

        const durationMatch = data['duration-of-loan'].match(/^(\d+)/);
        const durationInPeriods = durationMatch ? parseInt(durationMatch[1], 10) : 1;
        
        const { schedule, totalInterest, totalPayable } = generateLoanSchedule(
            data['loan-amount'],
            data['payment-frequency'],
            data['date-start'],
            durationInPeriods,
            data['interest-rate']
        );
        
        const paymentPerPeriod = schedule.length > 0 ? schedule[0]['totalPayment'] : 0;
        const principalPerPeriod = schedule.length > 0 ? schedule[0]['principal'] : 0;
        const interestPerPeriod = schedule.length > 0 ? schedule[0]['interest'] : 0;


        let scheduleTableHTML = `
            <div class="schedule-table-container mt-6">
                <h3 class="text-xl font-semibold mb-3">Amortization Schedule</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 loan-schedule-table">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payment</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
        `;
        schedule.forEach(row => {
            scheduleTableHTML += `
                <tr>
                    <td class="px-3 py-2 whitespace-nowrap">${row['period']}</td>
                    <td class="px-3 py-2 whitespace-nowrap">${row['dueDate']}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right">${formatCurrency(row['principal'])}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right">${formatCurrency(row['interest'])}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right">${formatCurrency(row['totalPayment'])}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right">${formatCurrency(row['balance'])}</td>
                </tr>
            `;
        });
        scheduleTableHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const modalTargetTable = 'loan_applications'; 
        const modalTargetID = data.loanID;

        // --- START MODAL CONTENT HTML STRUCTURE ---
        modalContent.innerHTML = `
            <div class="modal-header flex justify-between items-center p-4 border-b">
                <h2 class="text-2xl font-bold">Loan Confirmation & Schedule</h2>
                <button class="close-modal-btn text-3xl leading-none text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <div class="modal-body p-6 overflow-y-auto max-h-[80vh]">
                
                <div class="loan-summary-grid">
                    
                    <section class="client-details-summary">
                        <h2 class="summary-header">Client & Guarantor Details</h2>
                        <div class="summary-item">
                            <span class="label">Client ID:</span>
                            <span class="value">${data.clientID}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Client Name:</span>
                            <span class="value">${data.clientName}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Collateral:</span>
                            <span class="value">${data.colateral}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Guarantor:</span>
                            <span class="value">${data.guarantorFirstName} ${data.guarantorMiddleName} ${data.guarantorLastName}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Address:</span>
                            <span class="value">${data.guarantorStreetAddress}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Phone:</span>
                            <span class="value">${data.guarantorPhoneNumber}</span>
                        </div>
                    </section>

                    <section class="loan-details-summary">
                        <h2 class="summary-header">Loan Summary</h2>
                        <div class="summary-item">
                            <span class="label">Loan Amount:</span>
                            <span class="value amount">${formatCurrency(data['loan-amount'])}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Interest Rate:</span>
                            <span class="value">${data['interest-rate']}%</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Total Interest:</span>
                            <span class="value amount">${formatCurrency(totalInterest)}</span>
                        </div>
                        <div class="summary-item total-payable">
                            <span class="label">Total Payable:</span>
                            <span class="value amount">${formatCurrency(totalPayable)}</span>
                        </div>
                        <div class="summary-item divider"></div>
                        <div class="summary-item">
                            <span class="label">Payment Frequency:</span>
                            <span class="value">${data['payment-frequency'].charAt(0).toUpperCase() + data['payment-frequency'].slice(1)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Term/Duration:</span>
                            <span class="value">${data['duration-of-loan']}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Start Date:</span>
                            <span class="value">${new Date(data['date-start']).toLocaleDateString('en-US')}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">End Date:</span>
                            <span class="value">${new Date(data['date-end']).toLocaleDateString('en-US')}</span>
                        </div>
                        <div class="summary-item payment-period">
                            <span class="label">Payment Per Period:</span>
                            <span class="value amount">${formatCurrency(paymentPerPeriod)}</span>
                        </div>
                        <div class="summary-item sub-payment">
                            <span class="label sub-label">(Principal:</span>
                            <span class="value sub-value amount">${formatCurrency(principalPerPeriod)})</span>
                            <span class="label sub-label"> + Interest:</span>
                            <span class="value sub-value amount">${formatCurrency(interestPerPeriod)})</span>
                        </div>
                    </section>
                </div>
                <div class="loan-schedule">
                    ${scheduleTableHTML}
                </div>
            </div>
            <div class="modal-footer p-4 border-t flex justify-end">
                <button class="print-btn bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors apply-button">Print</button>
            </div>
        `;
        // --- END MODAL CONTENT HTML STRUCTURE ---


        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        setTimeout(() => modalContent.classList.add('is-active'), 10);
        
        // Log: VIEWED
        if (typeof logUserAction === 'function') {
            logUserAction(
                'VIEWED', 
                `Opened Loan Details Modal for Loan ID: ${data.loanID}. Target: ${modalTargetTable} (${modalTargetID})`
            );
        }


        const closeBtn = modalContent.querySelector('.close-modal-btn');
        const printBtn = modalContent.querySelector('.print-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal();
                if (typeof logUserAction === 'function') logUserAction('VIEWED', `Closed Loan Details Modal for Loan ID: ${data.loanID}`);
            }); 
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
                if (typeof logUserAction === 'function') logUserAction('VIEWED', `Printed Loan Details for Loan ID: ${data.loanID}`); 
            });
        }
    }


    // =================================================================================
    // F. CLIENT SEARCH MODAL LOGIC 
    // =================================================================================

    if (showClientsBtn) {
        showClientsBtn.addEventListener('click', async () => {
            if (typeof logUserAction === 'function') logUserAction('VIEWED', 'Opened Client Search Modal.', 'clients', null, null, null);

            try {
                if (!clientIDInput) {
                    showMessageBox('Error: Client ID input field not found.', 'error');
                    return;
                }

                // NOTE: Using PHP/ in fetch path, but your file list shows them at the root. Adjust the fetch paths if needed.
                const [clientsResponse, interestResponse] = await Promise.all([
                    fetch('PHP/loanapplicationgetclient_handler.php'), // Adjust path if needed
                    fetch('PHP/loanapplicationgetactiveinterest_handler.php') // Adjust path if needed
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
                    if (typeof logUserAction === 'function') logUserAction('VIEWED', `Could not fetch client list. Msg: ${clientsResult.message}`, 'clients', null, null, null);
                    return;
                }

                if (interestResult.status === 'success' && interestResult.interestRate !== undefined) {
                    globalInterestRate = parseFloat(interestResult.interestRate);
                    if (typeof logUserAction === 'function') logUserAction('VIEWED', `Fetched Interest Rate: ${globalInterestRate}%`, 'interest_pecent', null, null, null);
                } else {
                    console.error(interestResult.message || 'Interest rate not found in successful response.');
                    showMessageBox('Could not load interest rate.', 'error');
                    globalInterestRate = 0;
                    if (typeof logUserAction === 'function') logUserAction('VIEWED', 'Could not load active interest rate.', 'interest_pecent', null, null, null);
                }

                // Set the hidden interest rate input
                interestRateInput.value = globalInterestRate;

                const clients = clientsResult.data || [];
                createClientModal(clients, globalInterestRate);
            } catch (error) {
                console.error('Error fetching data:', error);
                showMessageBox('Could not load client list. Please try again later. Details: ' + error.message, 'error');
                if (typeof logUserAction === 'function') logUserAction('VIEWED', `Fetch error loading clients/interest: ${error.message}`);
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
                if (typeof logUserAction === 'function') logUserAction('VIEWED', 'Closed Client Selection Modal.');
            });
        }


        if (clientList) {
            clientList.addEventListener('click', (event) => {
                const selectedItem = event.target.closest('li');
                if (selectedItem) {
                    const id = selectedItem.getAttribute('data-client-id');
                    const name = selectedItem.getAttribute('data-client-name');
                    if (id && name) {
                        const beforeID = clientIDInput.value;
                        const beforeName = clientName;

                        clientIDInput.value = id;
                        clientName = name;
                        if (displayClientName) { 
                            displayClientName.textContent = name;
                        }
                        closeModal();

                        // --- PLUG-IN: Check loan history and filter loan options ---
                        checkFirstLoanAndApplyFilter(id);
                        // ---------------------------------------------------------
                        
                        const beforeState = JSON.stringify({ clientID: beforeID, clientName: beforeName });
                        const afterState = JSON.stringify({ clientID: id, clientName: name });
                        
                        if (typeof logUserAction === 'function') {
                            logUserAction(
                                'UPDATED', 
                                `Selected Client ID ${id} (${name}) for loan application.`,
                                'clients', 
                                id,
                                beforeState,
                                afterState
                            );
                        }
                    }
                }
            });
        }
    }
});