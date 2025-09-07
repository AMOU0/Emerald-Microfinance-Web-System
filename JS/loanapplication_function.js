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
            
            // NOTE: Keep links pointing to .php if you want server-side security, 
            // otherwise keep them as .html.
            const urlMapping = {
                'dashboard': 'DashBoard.html',
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

    // Handle the logout button securely
    logoutButton.addEventListener('click', function() {
        // Redirect to the PHP script that handles session destruction
        window.location.href = 'PHP/check_logout.php'; 
    });

/*=============================================================================================================================================================================*/
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
                createClientModal(clients, globalInterestRate);

            } catch (error) {
                console.error('Error fetching data:', error);
                showMessageBox('Could not load client list. Please try again later.', 'error');
            }
        });
    }
/*=============================================================================================================================================================================*/

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

        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const filteredClients = clients.filter(client =>
                client.name.toLowerCase().includes(searchTerm)
            );
            renderClientList(filteredClients, clientList);
        });

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
    const formElement = document.getElementById('loanApplicationForm'); // Changed from loanForm to the correct ID

    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            if (this.value) {
                const startDate = new Date(this.value);
                const endDate = new Date(startDate);
                const loanDuration = 100;

                endDate.setDate(startDate.getDate() + loanDuration);

                const formattedEndDate = endDate.toISOString().split('T')[0];

                if (endDateInput) {
                    endDateInput.value = formattedEndDate;
                }

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
        applyButton.addEventListener('click', function(event) {
            event.preventDefault();

            const data = {
                clientID: document.getElementById('clientID').value.trim(),
                clientName: clientName.trim(),
                colateral: document.getElementById('colateral').value.trim(),
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
                'interest-rate': globalInterestRate
            };

            const requiredFields = [
                'clientID', 
                'colateral',
                'guarantorLastName', 'guarantorFirstName', 'guarantorMiddleName',
                'guarantorStreetAddress', 'guarantorPhoneNumber', 'loan-amount',
                'payment-frequency', 'date-start', 'duration-of-loan', 'date-end'
            ];

            let isValid = true;
            requiredFields.forEach(fieldId => {
                const input = document.getElementById(fieldId);
                if (!input || !input.value || input.value.trim() === '' || (fieldId === 'loan-amount' && isNaN(data['loan-amount']))) {
                    isValid = false;
                }
            });

            if (!isValid) {
                showMessageBox('Please fill out all required fields.', 'error');
                return;
            }

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
                    if (form) {
                        form.reset();
                    }
                    if (endDateInput) {
                        endDateInput.value = '';
                    }
                    const durationInput = document.getElementById('duration-of-loan');
                    if (durationInput) {
                        durationInput.value = '';
                    }
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

        const totalInterest = amount * (interestRate / 100);
        const totalRepaymentAmount = amount + totalInterest;

        let remainingBalance = totalRepaymentAmount;

        let totalPayments = 0;

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
                totalPayments = 1;
        }

        const paymentAmount = totalRepaymentAmount / totalPayments;
        const interestPerPayment = totalInterest / totalPayments;

        for (let i = 0; i < totalPayments; i++) {
            if (remainingBalance <= 0) break;

            remainingBalance -= paymentAmount;
            // Ensure remaining balance doesn't go below zero for the last payment
            if (i === totalPayments - 1 && remainingBalance > 0) {
                 remainingBalance = 0;
            } else if (remainingBalance < 0) {
                remainingBalance = 0;
            }

            schedule.push({
                'date-of-payment': currentDate.toISOString().split('T')[0],
                'amount-to-pay': paymentAmount,
                'interest-amount': interestPerPayment,
                'remaining-balance': remainingBalance
            });

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
            if (currentDate > endDate) break; // Stop generating payments past the end date
        }
        
        // Adjust final payment to cover any remaining rounding error
        if (remainingBalance > 0.01) {
            schedule[schedule.length - 1]['amount-to-pay'] += remainingBalance;
            schedule[schedule.length - 1]['remaining-balance'] = 0;
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
    
    // Adjusted event listener for form submission to use loanApplicationForm ID
    if(formElement) {
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();

            // The application logic is already handled by the applyButton listener above.
            // This prevents duplicate submission logic if the form is submitted via enter key or redundant submit button.
            // Since the logic is already inside applyButton.addEventListener('click', ...), we just return here.
            return; 
        });
    }
});