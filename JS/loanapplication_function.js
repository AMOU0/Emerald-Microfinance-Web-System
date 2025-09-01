document.addEventListener('DOMContentLoaded', function() {
    // --- Navigation and Logout Logic ---
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, '');
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

            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }

    // --- Client Search Modal Logic ---
    const showClientsBtn = document.getElementById('showClientsBtn');
    const clientIDInput = document.getElementById('clientID');
    let clientName = ''; // Global variable to store client name
    let globalInterestRate = 0; // Global variable to store interest rate

    if (showClientsBtn) {
        showClientsBtn.addEventListener('click', async () => {
            try {
                // Fetch both the client list and the active interest rate simultaneously
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
                // Pass the interest rate to the modal creation function
                createClientModal(clients, globalInterestRate);

            } catch (error) {
                console.error('Error fetching data:', error);
                showMessageBox('Could not load client list. Please try again later.', 'error');
            }
        });
    }

    /**
     * Dynamically creates and displays a modal with a list of clients, including a search bar and interest rate.
     * @param {Array<Object>} clients - An array of client objects from the database.
     * @param {number} interestRate - The active interest rate percentage from the database.
     */
    function createClientModal(clients, interestRate) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-content-transition';
        modalContent.classList.remove('is-active');

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

        setTimeout(() => {
            modalContent.classList.add('is-active');
        }, 10);

        const clientList = modal.querySelector('.client-list');
        const searchInput = modal.querySelector('#clientSearchInput');

        // Add event listener to the search input
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const filteredClients = clients.filter(client =>
                client.name.toLowerCase().includes(searchTerm)
            );
            renderClientList(filteredClients, clientList);
        });

        // Add event listener to handle client selection
        clientList.addEventListener('click', (event) => {
            const selectedItem = event.target.closest('li');
            if (selectedItem) {
                const clientID = selectedItem.getAttribute('data-client-id');
                clientName = selectedItem.getAttribute('data-client-name');
                if (clientIDInput) clientIDInput.value = clientID;
                console.log(`Selected Client ID: ${clientID}`);
                closeModal();
            }
        });

        // Helper function to render the list of clients
        function renderClientList(clientArray, ulElement) {
            ulElement.innerHTML = clientArray.map(client => `
                <li class="client-list-item rounded-lg hover:bg-gray-100 transition-colors duration-150" data-client-id="${client.id}" data-client-name="${client.name}">
                    <span class="font-medium">${client.name}</span>
                    <span class="text-gray-500 text-sm block">ID: ${client.id}</span>
                </li>
            `).join('');
        }

        window.closeModal = () => {
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.querySelector('.modal-content').classList.remove('is-active');
                setTimeout(() => {
                    modalOverlay.remove();
                }, 300);
            }
        };
    }

    // --- Loan Application Form Logic ---
    const startDateInput = document.getElementById('date-start');
    const endDateInput = document.getElementById('date-end');
    const applyButton = document.querySelector('.apply-button');
    const form = document.querySelector('.loan-application-container');

    if (startDateInput) {
        // Automatically set the end date 100 days from the start date
        startDateInput.addEventListener('change', function() {
            if (this.value) {
                const startDate = new Date(this.value);
                const endDate = new Date(startDate);
                const loanDuration = 100; // Define the duration in days

                endDate.setDate(startDate.getDate() + loanDuration);

                // Format the date as YYYY-MM-DD
                const formattedEndDate = endDate.toISOString().split('T')[0];

                // Update the end date input field
                if (endDateInput) {
                    endDateInput.value = formattedEndDate;
                }

                // Update the loan duration input field
                const durationInput = document.getElementById('duration-of-loan');
                if (durationInput) {
                    durationInput.value = loanDuration + ' days';
                }
            } else {
                if (endDateInput) {
                    endDateInput.value = '';
                }
                const durationInput = document.getElementById('duration-of-loan');
                if (durationInput) {
                    durationInput.value = '';
                }
            }
        });
    }

    if (applyButton) {
        // Handle the "Apply" button and form submission
        applyButton.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Collect form data
            const data = {
                clientID: document.getElementById('clientID').value.trim(),
                clientName: clientName.trim(),
                guarantorLastName: document.getElementById('guarantorLastName').value.trim(),
                guarantorFirstName: document.getElementById('guarantorFirstName').value.trim(),
                guarantorMiddleName: document.getElementById('guarantorMiddleName').value.trim(),
                guarantorStreetAddress: document.getElementById('guarantorStreetAddress').value.trim(),
                guarantorPhoneNumber: document.getElementById('guarantorPhoneNumber').value.trim(),
                'loan-amount': parseFloat(document.getElementById('loan-amount').value.trim()),
                'payment-frequency': document.getElementById('payment-frequency').value.trim(),
                'date-start': document.getElementById('date-start').value.trim(),
                'duration-of-loan': document.getElementById('duration-of-loan').value.trim(),
                'date-end': document.getElementById('date-end').value.trim(),
                'interest-rate': globalInterestRate // Pass the interest rate
            };

            const requiredFields = [
                'clientID', 'guarantorLastName', 'guarantorFirstName', 'guarantorMiddleName',
                'guarantorStreetAddress', 'guarantorPhoneNumber', 'loan-amount',
                'payment-frequency', 'date-start', 'duration-of-loan', 'date-end'
            ];

            let isValid = true;
            requiredFields.forEach(fieldId => {
                const input = document.getElementById(fieldId);
                if (!input || !input.value || input.value.trim() === '') {
                    isValid = false;
                }
            });

            if (!isValid) {
                showMessageBox('Please fill out all required fields.', 'error');
                return;
            }

            // Send data to PHP backend
            fetch('PHP/loanapplication_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(result => {
                if (result.status === 'success') {
                    showMessageBox(result.message, 'success');
                    // You can clear the form or perform other actions here
                    if (form) {
                        form.reset();
                    }
                    if (endDateInput) {
                        endDateInput.value = '';
                    }
                    // Display the modal with the calculated information
                    data.loanID = result.loan_application_id;
                    createLoanDetailsModal(data);
                } else {
                    showMessageBox(result.message, 'error');
                }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                showMessageBox('An error occurred. Please check the console for details.', 'error');
            });
        });
    }

/**
     * Dynamically creates and displays the loan details and schedule modal.
     * @param {Object} data - The loan application data.
     */
    function createLoanDetailsModal(data) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-content-transition';

        // Generate the payment schedule table
        const schedule = generateLoanSchedule(data['loan-amount'], data['payment-frequency'], data['date-start'], data['date-end'], data['interest-rate']);
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
                    <p><strong>Client ID:</strong> ${data.clientID}</p>
                    <p><strong>Client Name:</strong> ${data.clientName}</p>
                    <h3>Guarantor Information</h3>
                    <p><strong>Guarantor Name:</strong> ${data.guarantorFirstName} ${data.guarantorMiddleName} ${data.guarantorLastName}</p>
                    <p><strong>Address:</strong> ${data.guarantorStreetAddress}</p>
                    <p><strong>Phone Number:</strong> ${data.guarantorPhoneNumber}</p>
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

        setTimeout(() => {
            modalContent.classList.add('is-active');
        }, 10);

        // Add event listeners for the new buttons
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
     * This is a simplified calculation for demonstration purposes.
     * @param {number} amount - Total loan amount.
     * @param {string} frequency - 'daily', 'weekly', or 'monthly'.
     * @param {string} startDate - The start date string 'YYYY-MM-DD'.
     * @param {string} endDate - The end date string 'YYYY-MM-DD'.
     * @param {number} interestRate - The active interest rate percentage.
     * @returns {Array<Object>} An array of payment schedule objects.
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

    /**
     * Displays a simple, custom message box instead of using alert().
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('success' or 'error').
     */
    function showMessageBox(message, type) {
        const existingBox = document.querySelector('.message-box');
        if (existingBox) existingBox.remove();

        const box = document.createElement('div');
        box.className = `message-box fixed top-4 right-4 p-4 rounded-lg text-white shadow-lg transition-transform duration-300 transform translate-y-0`;

        if (type === 'error') {
            box.classList.add('bg-red-500');
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
    
    // Check for the existence of the client and loan form elements and add event listeners
    const formElement = document.getElementById('loanForm');
    if(formElement) {
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();

            const messageDiv = document.getElementById('formMessage');
            if (messageDiv) {
                messageDiv.textContent = 'Submitting...';
                messageDiv.className = 'text-center text-sm font-medium text-gray-500';
            }

            // Collect form data
            const formData = new FormData(formElement);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value.trim();
            }

            try {
                // Send data to the PHP handler
                const response = await fetch('PHP/loanapplication_handler.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                // Parse the JSON response
                const result = await response.json();

                // Display success or error message
                if (result.status === 'success') {
                    if (messageDiv) {
                        messageDiv.textContent = result.message;
                        messageDiv.className = 'text-center text-sm font-medium text-green-600';
                    }
                    console.log('Loan Application ID:', result.loan_application_id);
                    formElement.reset();
                    data.loanID = result.loan_application_id;
                    createLoanDetailsModal(data); // Call the modal function with form data
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                if (messageDiv) {
                    messageDiv.textContent = `Error: ${error.message}`;
                    messageDiv.className = 'text-center text-sm font-medium text-red-600';
                }
                console.error('Error submitting form:', error);
            }
        });
    }
});
