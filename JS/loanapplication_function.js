document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

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
                // 1. Define the action for the audit log
                const actionDescription = `Maps to ${this.textContent} (${targetPage})`;

                // 2. ASYNCHRONOUS AUDIT LOG: Call PHP to log the action. 
                //    This will not block the page from redirecting.
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
                // 3. Perform the page redirect immediately
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button securely
    // NOTE: The PHP script 'PHP/check_logout.php' will now handle the log *before* session destruction.
    logoutButton.addEventListener('click', function() {
        window.location.href = 'PHP/check_logout.php'; 
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // =================================================================================
    // Global Variables and Constants
    // =================================================================================
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
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

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
    }

    /**
     * Helper function to close any active modal.
     */
    function closeModal() {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.querySelector('.modal-content').classList.remove('is-active');
            setTimeout(() => {
                modalOverlay.remove();
            }, 300);
        }
    }

    // =================================================================================
    // A. REAL-TIME INPUT FILTERING
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
        });
    }

    // =================================================================================
    // B. SUBMISSION VALIDATION
    // =================================================================================
    if (loanApplicationForm) {
        loanApplicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Validate Names
            for (const input of nameInputs) {
                const value = input.value.trim();
                if (value === "") {
                    showInputError(e, input, `Error: ${input.name.replace('guarantor', '').replace(/([A-Z])/g, ' $1').trim()} is required.`);
                    return; 
                }
                if (!NAME_REGEX_VALIDATE.test(value)) {
                    showInputError(e, input, `Error: ${input.name.replace('guarantor', '').replace(/([A-Z])/g, ' $1').trim()} must contain only letters and spaces.`);
                    return; 
                }
            }

            // 2. Validate Phone Number
            const phoneNumber = guarantorPhoneNumberInput.value;
            if (!PHONE_REGEX.test(phoneNumber.trim())) {
                showMessageBox('Error: Phone Number must contain exactly 11 digits and only numbers.', 'error');
                guarantorPhoneNumberInput.classList.add('input-error');
                guarantorPhoneNumberInput.focus();
                return; 
            }
            
            // 3. Validate Loan Details
            const loanAmount = document.getElementById('loan-amount').value;
            const paymentFrequency = document.getElementById('payment-frequency').value;
            const dateStart = startDateInput.value;
            const dateEnd = endDateInput.value;

            if (!loanAmount) {
                showMessageBox('Error: Please select a loan amount.', 'error');
                return;
            }
            if (!paymentFrequency) {
                showMessageBox('Error: Please select a payment frequency.', 'error');
                return;
            }
            if (!dateStart || !dateEnd) {
                showMessageBox('Error: Please select a start date.', 'error');
                return;
            }
            
            handleLoanApplicationSubmission();
        });
    }

    // =================================================================================
    // C. LOAN APPLICATION SUBMISSION LOGIC
    // =================================================================================
    async function handleLoanApplicationSubmission() {
        const data = {
            clientID: clientIDInput.value.trim(),
            clientName: clientName,
            colateral: document.getElementById('colateral').value.trim(),
            guarantorLastName: document.getElementById('guarantorLastName').value.trim(),
            guarantorFirstName: document.getElementById('guarantorFirstName').value.trim(),
            guarantorMiddleName: document.getElementById('guarantorMiddleName').value.trim(),
            guarantorStreetAddress: document.getElementById('guarantorStreetAddress').value.trim(),
            guarantorPhoneNumber: document.getElementById('guarantorPhoneNumber').value.trim(),
            'loan-amount': parseFloat(document.getElementById('loan-amount').value),
            'payment-frequency': document.getElementById('payment-frequency').value,
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
                data.loanID = result.loan_application_id;
                createLoanDetailsModal(data);
            } else {
                showMessageBox(result.message, 'error');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showMessageBox('An error occurred during submission. Please try again.', 'error');
        }
    }
    
    // =================================================================================
    // D. MODAL CREATION AND LOAN SCHEDULE LOGIC
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
            <div class="schedule-table-container">
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
            </div>
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
                    <h3>Guarantor Information</h3>
                    <p><strong>Guarantor Name:</strong> ${data.guarantorFirstName} ${data.guarantorMiddleName} ${data.guarantorLastName}</p>
                    <p><strong>Address:</strong> ${data.guarantorStreetAddress}</p>
                    <p><strong>Phone Number:</strong> ${data.guarantorPhoneNumber}</p>
                    <p><strong>Colateral:</strong> ${data.colateral}</p>
                    <h3>Loan Information</h3>
                    <p><strong>Loan ID:</strong> ${data.loanID}</p>
                    <p><strong>Loan Amount:</strong> PHP ${data['loan-amount'].toLocaleString('en-US')}</p>
                    <p><strong>Interest Rate:</strong> ${data['interest-rate']}%</p>
                    <p><strong>Start Date:</strong> ${data['date-start']}</p>
                    <p><strong>End Date:</strong> ${data['date-end']}</p>
                    <p><strong>Payment Frequency:</strong> ${data['payment-frequency']}</p>
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

        setTimeout(() => modalContent.classList.add('is-active'), 10);

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
        const totalDays = Math.round((endDate - startDate) / oneDay);

        switch (frequency) {
            case 'daily': totalPayments = totalDays; break;
            case 'weekly': totalPayments = Math.floor(totalDays / 7); break;
            case 'monthly':
                let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
                months -= startDate.getMonth();
                months += endDate.getMonth();
                totalPayments = months;
                break;
            default: totalPayments = 1;
        }
        if (totalPayments <= 0) {
            totalPayments = 1;
        }
        const paymentAmount = totalRepaymentAmount / totalPayments;
        const interestPerPayment = totalInterest / totalPayments;

        for (let i = 0; i < totalPayments; i++) {
            let paymentDate = new Date(startDate);
            switch (frequency) {
                case 'daily': paymentDate.setDate(startDate.getDate() + i); break;
                case 'weekly': paymentDate.setDate(startDate.getDate() + (i * 7)); break;
                case 'monthly': paymentDate.setMonth(startDate.getMonth() + i); break;
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
            const remaining = totalRepaymentAmount - paidSoFar;
            lastPayment['amount-to-pay'] = remaining;
            lastPayment['remaining-balance'] = 0;
        }
        return schedule;
    }

    // =================================================================================
    // E. CLIENT SEARCH MODAL LOGIC
    // =================================================================================

    if (showClientsBtn) {
        showClientsBtn.addEventListener('click', async () => {
            try {
                const [clientsResponse, interestResponse] = await Promise.all([
                    fetch('PHP/getclient_handler.php'),
                    fetch('PHP/getactiveinterest_handler.php')
                ]);

                if (!clientsResponse.ok) {
                    throw new Error(`HTTP error! Status: ${clientsResponse.status}`);
                }
                if (!interestResponse.ok) {
                    throw new Error(`HTTP error! Status: ${interestResponse.status}`);
                }

                const clientsResult = await clientsResponse.json();
                const interestResult = await interestResponse.json();

                if (clientsResult.status === 'error') {
                    showMessageBox(clientsResult.message, 'error');
                    return;
                }

                if (interestResult.status === 'success') {
                    globalInterestRate = interestResult.interestRate;
                } else {
                    console.error(interestResult.message);
                    showMessageBox('Could not load interest rate.', 'error');
                }

                const clients = clientsResult.data;
                createClientModal(clients, globalInterestRate);
            } catch (error) {
                console.error('Error fetching data:', error);
                showMessageBox('Could not load client list. Please try again later.', 'error');
            }
        });
    }

    function createClientModal(clients, interestRate) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-content-transition';
        modalContent.innerHTML = `
            <div class="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
                <h2 class="text-xl font-semibold">Select a Client</h2>
                <button class="close-button text-gray-400 hover:text-gray-600 transition-colors duration-200" onclick="closeModal()">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="search-container mb-4">
                <input type="text" id="clientSearchInput" class="form-input w-full" placeholder="Search by name...">
            </div>
            <div class="mb-4 text-center">
                <h3 class="text-lg font-medium">Active Interest Rate: ${interestRate}%</h3>
            </div>
            <ul class="client-list overflow-y-auto max-h-64">
                ${clients.map(client => `
                    <li class="client-list-item rounded-lg hover:bg-gray-100 transition-colors duration-150" data-client-id="${client.id}" data-client-name="${client.name}">
                        <span class="font-medium">${client.name}</span>
                        <span class="text-gray-500 text-sm block">ID: ${client.id}</span>
                    </li>
                `).join('')}
            </ul>
        `;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        setTimeout(() => modalContent.classList.add('is-active'), 10);

        const clientList = modal.querySelector('.client-list');
        const searchInput = modal.querySelector('#clientSearchInput');
        
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const filteredClients = clients.filter(client => client.name.toLowerCase().includes(searchTerm));
            renderClientList(filteredClients, clientList);
        });

        clientList.addEventListener('click', (event) => {
            const selectedItem = event.target.closest('li');
            if (selectedItem) {
                clientIDInput.value = selectedItem.getAttribute('data-client-id');
                clientName = selectedItem.getAttribute('data-client-name');
                closeModal();
            }
        });
        
        function renderClientList(clientArray, ulElement) {
            ulElement.innerHTML = clientArray.map(client => `
                <li class="client-list-item rounded-lg hover:bg-gray-100 transition-colors duration-150" data-client-id="${client.id}" data-client-name="${client.name}">
                    <span class="font-medium">${client.name}</span>
                    <span class="text-gray-500 text-sm block">ID: ${client.id}</span>
                </li>
            `).join('');
        }
    }

    // =================================================================================
    // F. LOAN DURATION CALCULATION
    // =================================================================================
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            if (this.value) {
                const startDate = new Date(this.value);
                const loanDuration = 100;
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + loanDuration);
                const formattedEndDate = endDate.toISOString().split('T')[0];
                if (endDateInput) {
                    endDateInput.value = formattedEndDate;
                }
                if (durationInput) {
                    durationInput.value = loanDuration + ' days';
                }
            } else {
                if (endDateInput) {
                    endDateInput.value = '';
                }
                if (durationInput) {
                    durationInput.value = '';
                }
            }
        });
    }

    // =================================================================================
    // G. NAVIGATION AND SESSION LOGIC
    // =================================================================================
    checkSessionAndRedirect();

    // Event listeners for navigation links
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
            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.location.href = 'PHP/check_logout.php';
        });
    }

});