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
/*=============================================================================================================================================================================*/
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
// Function to show a message box (assuming this is defined elsewhere)
function showMessageBox(message, type) {
    console.log(message, type);
}

// Global variable to hold the entire client list data
let allClients = [];

document.addEventListener('DOMContentLoaded', () => {
    // We assume the page loads directly to the "Existing Clients" report
    fetchAndDisplayClients();
});

async function fetchAndDisplayClients() {
    try {
        const clientsResponse = await fetch('PHP/reportsexistingclient_handler.php');
        if (!clientsResponse.ok) {
            throw new Error(`HTTP error! Status: ${clientsResponse.status}`);
        }
        const clientsResult = await clientsResponse.json();

        if (clientsResult.status === 'error') {
            showMessageBox(clientsResult.message, 'error');
            return;
        }

        allClients = clientsResult.data; // Store the full client data globally
        renderClientList(allClients);

    } catch (error) {
        console.error('Error fetching data:', error);
        showMessageBox('Could not load client list. Please try again later.', 'error');
    }
}

/**
 * Dynamically renders the list of clients.
 * @param {Array<Object>} clients - An array of client objects.
 */
function renderClientList(clients) {
    const clientList = document.querySelector('.client-list');
    if (!clientList) return;

clientList.innerHTML = `
    <table class="client-table w-full text-left border-collapse">
        <thead>
            <tr>
                <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-600">Name</th>
                <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-600">ID</th>
            </tr>
        </thead>
        <tbody>
            ${clients.map(client => `
                <tr class="hover:bg-gray-100 transition-colors duration-150" data-client-id="${client.client_ID}">
                    <td class="py-2 px-4 border-b border-gray-200">
                        ${client.first_name} ${client.middle_name} ${client.last_name}
                    </td>
                    <td class="py-2 px-4 border-b border-gray-200">
                        ${client.client_ID}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>
`;
}
// Event listener for the client search input
document.getElementById('clientSearchInput').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredClients = allClients.filter(client =>
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm)
    );
    renderClientList(filteredClients);
});

// Event listener to handle client selection
document.querySelector('.client-list').addEventListener('click', (event) => {
    const selectedItem = event.target.closest('tr');
    if (selectedItem) {
        const clientID = selectedItem.getAttribute('data-client-id');
        // Redirect to the new page with the client ID in the URL
        window.location.href = `ReportsExistingClientView.html?clientId=${clientID}`;
    }
});

/**
 * Creates and displays the modal with all client details.
 * @param {Object} client - The full client object with all its details.
 */
function showClientDetailsModal(client) {
    const modal = document.getElementById('clientDetailsModal');
    const clientNameElement = document.getElementById('modalClientName');
    const clientIDElement = document.getElementById('modalClientID');
    const clientGenderElement = document.getElementById('modalClientGender');
    const clientDOBElement = document.getElementById('modalClientDOB');
    const clientAddressElement = document.getElementById('modalClientAddress');
    const clientPhoneElement = document.getElementById('modalClientPhone');
    const clientOccupationElement = document.getElementById('modalClientOccupation');
    const clientEmploymentStatusElement = document.getElementById('modalClientEmploymentStatus');
    const clientIncomeElement = document.getElementById('modalClientIncome');

    // Populate the modal with the client's data
    clientNameElement.textContent = `${client.first_name} ${client.middle_name} ${client.last_name}`;
    clientIDElement.textContent = client.client_ID;
    clientGenderElement.textContent = client.gender;
    clientDOBElement.textContent = client.date_of_birth;
    clientAddressElement.textContent = `${client.street_address}, ${client.barangay}, ${client.city} ${client.postal_code}`;
    clientPhoneElement.textContent = client.phone_number;
    clientOccupationElement.textContent = client.occupation || 'N/A';
    clientEmploymentStatusElement.textContent = client.employment_status || 'N/A';
    clientIncomeElement.textContent = client.income || 'N/A';

    // Show the modal
    modal.classList.add('is-active');
    modal.querySelector('.modal-content-details').classList.add('is-active');
}

/**
 * Closes the client details modal.
 */
function closeDetailsModal() {
    const modal = document.getElementById('clientDetailsModal');
    modal.querySelector('.modal-content-details').classList.remove('is-active');
    setTimeout(() => {
        modal.classList.remove('is-active');
    }, 300);
}
// Existing code
document.querySelector('.client-list').addEventListener('click', (event) => {
    const selectedItem = event.target.closest('li');
    if (selectedItem) {
        const clientID = selectedItem.getAttribute('data-client-id');
        // Redirect to the new page with the client ID in the URL
        window.location.href = `ReportsExistingClientView.html?clientId=${clientID}`;
    }
});