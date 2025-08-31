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

        renderLoanTable(result.data);
    } catch (error) {
        console.error('Error fetching loan applications:', error);
        showMessageBox('Could not load loan applications. Please try again later.', 'error');
        document.getElementById('loanTableContainer').innerHTML = '<p>Error loading loan applications. Please try again later.</p>';
    }
}

function renderLoanTable(loans) {
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
        tableHTML += `
            <tr>
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
}