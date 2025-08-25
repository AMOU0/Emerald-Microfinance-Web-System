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

    logoutButton.addEventListener('click', function() {
        window.location.href = 'login.html';
    });

    /*================================= */

    // --- Client Search Modal Logic ---
    const showClientsBtn = document.getElementById('showClientsBtn');
    const clientIDInput = document.getElementById('clientID');

    showClientsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('PHP/getclient_handler.php');

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'error') {
                showMessageBox(result.message, 'error');
                return;
            }

            const clients = result.data;
            createClientModal(clients);

        } catch (error) {
            console.error('Error fetching clients:', error);
            showMessageBox('Could not load client list. Please try again later.', 'error');
        }
    });

    /**
     * Dynamically creates and displays a modal with a list of clients.
     * @param {Array<Object>} clients - An array of client objects from the database.
     */
    function createClientModal(clients) {
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
            <ul class="client-list">
                ${clients.map(client => `
                    <li class="client-list-item rounded-lg hover:bg-gray-100 transition-colors duration-150" data-client-id="${client.id}">
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
        clientList.addEventListener('click', (event) => {
            const selectedItem = event.target.closest('li');
            if (selectedItem) {
                const clientID = selectedItem.getAttribute('data-client-id');
                clientIDInput.value = clientID;
                console.log(`Selected Client ID: ${clientID}`);
                closeModal();
            }
        });

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

    // --- Loan Application Form Logic ---
    const startDateInput = document.getElementById('date-start');
    const endDateInput = document.getElementById('date-end');
    const clearButton = document.querySelector('.clear-button');
    const applyButton = document.querySelector('.apply-button');
    const form = document.querySelector('.loan-application-container');

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
            endDateInput.value = formattedEndDate;

            // Update the loan duration input field
            document.getElementById('duration-of-loan').value = loanDuration + ' days';
        } else {
            endDateInput.value = '';
            document.getElementById('duration-of-loan').value = '';
        }
    });

    // Handle the "Clear" button
    clearButton.addEventListener('click', function(event) {
        event.preventDefault();
        form.reset();
        endDateInput.value = '';
    });

    // Handle the "Apply" button and form submission
    applyButton.addEventListener('click', function(event) {
        event.preventDefault();

        const data = {
            clientID: document.getElementById('clientID').value,
            guarantorLastName: document.getElementById('guarantorLastName').value,
            guarantorFirstName: document.getElementById('guarantorFirstName').value,
            guarantorMiddleName: document.getElementById('guarantorMiddleName').value,
            guarantorStreetAddress: document.getElementById('guarantorStreetAddress').value,
            guarantorPhoneNumber: document.getElementById('guarantorPhoneNumber').value,
            'loan-amount': document.getElementById('loan-amount').value,
            'payment-frequency': document.getElementById('payment-frequency').value,
            'date-start': document.getElementById('date-start').value,
            'duration-of-loan': document.getElementById('duration-of-loan').value,
            'date-end': document.getElementById('date-end').value
        };

        const requiredFields = [
            'clientID', 'guarantorLastName', 'guarantorFirstName', 'guarantorMiddleName',
            'guarantorStreetAddress', 'guarantorPhoneNumber', 'loan-amount',
            'payment-frequency', 'date-start', 'duration-of-loan', 'date-end'
        ];

        let isValid = true;
        requiredFields.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (!input || !input.value) {
                isValid = false;
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '';
            }
        });

        if (!isValid) {
            alert('Please fill out all required fields.');
            return;
        }

        fetch('PHP/loanapplication_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert(result.message);
                form.reset();
                endDateInput.value = '';
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during submission.');
        });
    });
});