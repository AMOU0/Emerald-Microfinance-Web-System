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

/*=============================================================================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.clients-table-body');
    const searchInput = document.getElementById('searchInput');
    let allClientData = []; // Variable to store all fetched data

    if (!tableBody) {
        console.error('Clients table body not found.');
        return;
    }

    tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">Loading client data...</div>`;

    // Function to calculate the next payment date (KEPT AS IS)
    const calculateNextPaymentDate = (startDate, frequency, lastPaymentDate) => {
        let currentDate = new Date(startDate);
        
        if (isNaN(currentDate.getTime())) {
            return 'Date Error';
        }

        if (!lastPaymentDate) {
            return currentDate.toLocaleDateString();
        }

        const lastPayment = new Date(lastPaymentDate);

        while (currentDate <= lastPayment) {
            if (frequency === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (frequency === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                return 'N/A';
            }
        }
        
        if (isNaN(currentDate.getTime())) {
            return 'Date Error';
        }

        return currentDate.toLocaleDateString();
    };

    // NEW: Function to render the table with the given data
    const renderTable = (dataToRender) => {
        if (!Array.isArray(dataToRender) || dataToRender.length === 0) {
            tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">No client data found.</div>`;
            return;
        }

        tableBody.innerHTML = '';
        
        dataToRender.forEach(item => {
            const fullName = `${item.first_name} ${item.middle_name ? item.middle_name + ' ' : ''}${item.last_name}`;
            
            let nextPaymentDate;
            
            // Only calculate if the raw balance is positive AND we have necessary date info.
            if (item.balance > 0.01 && item.date_start && item.payment_frequency) {
                const calculatedDate = calculateNextPaymentDate(item.date_start, item.payment_frequency, item.last_payment_date);
                
                if (calculatedDate && calculatedDate !== 'Invalid Date' && calculatedDate !== 'Date Error') {
                    nextPaymentDate = calculatedDate;
                } else {
                    nextPaymentDate = 'Date Error'; 
                }
            } else {
                // Fully Paid or No Loan: Display N/A
                nextPaymentDate = 'N/A';
            }
            
            const balanceDisplay = item.balance_display; 

            const row = document.createElement('div');
            // Assuming the table is for the client list, but there's a disconnect with the HTML. 
            // Using a generic row class for now. You might need to adjust the class name.
            row.className = item.client_ID ? 'clients-row clickable-row' : 'clients-row'; 
            row.dataset.clientId = item.client_ID; 

            // IMPORTANT: Adjust these cells to match the structure of your HTML table, 
            // which currently lists: Client ID, Loan ID, Name, Principal, Interest, Loan Amount, Due Date.
            // The JS is generating: Full Name, Phone Number, Next Payment Date, Balance Display.
            // I'm using the columns generated by the original JS logic.
            row.innerHTML = `
                <div class="clients-cell">${fullName}</div>
                <div class="clients-cell">${item.phone_number || ''}</div>
                <div class="clients-cell">${nextPaymentDate}</div>
                <div class="clients-cell">${balanceDisplay}</div>`; 

            if (item.client_ID) {
                row.addEventListener('click', function() {
                    const clientId = this.dataset.clientId;
                    window.location.href = `LedgersView.html?client_id=${clientId}`;
                });
            }
            
            tableBody.appendChild(row);
        });
    };

    // NEW: Function to handle search input
    const handleSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            renderTable(allClientData); // Display all data if search is empty
            return;
        }

        const filteredData = allClientData.filter(item => {
            const fullName = `${item.first_name} ${item.middle_name ? item.middle_name + ' ' : ''}${item.last_name}`.toLowerCase();
            const clientId = String(item.client_ID).toLowerCase();
            const loanId = String(item.loan_ID).toLowerCase(); // Assuming there's a loan_ID field

            // Search by Client ID, Loan ID, or Name
            return clientId.includes(searchTerm) || 
                   loanId.includes(searchTerm) ||
                   fullName.includes(searchTerm);
        });

        renderTable(filteredData);
    };

    // Fetch data and attach listeners
    fetch('PHP/ledger_handler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched client data:', data);

            if (!Array.isArray(data)) {
                allClientData = [];
            } else {
                allClientData = data; // Store the fetched data
            }

            // Initial render
            renderTable(allClientData);
            
            // NEW: Attach the search event listener
            if (searchInput) {
                searchInput.addEventListener('input', handleSearch);
            }
        })
        .catch(error => {
            console.error('Error fetching client data:', error);
            tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">Error loading data. Check the browser console for details.</div>`;
        });
});