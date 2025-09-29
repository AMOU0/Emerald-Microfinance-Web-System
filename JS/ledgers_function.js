document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    // NOTE: Assuming checkSessionAndRedirect() is defined in enforce_login.js
    // checkSessionAndRedirect(); // Uncomment if you want to use it here

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
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.clients-table-body');

    if (!tableBody) {
        console.error('Clients table body not found.');
        return;
    }

    tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">Loading client data...</div>`;

    // Function to calculate the next payment date
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


    fetch('PHP/ledger_handler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched client data:', data);

            if (!Array.isArray(data) || data.length === 0) {
                tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">No client data found.</div>`;
                return;
            }
            
            tableBody.innerHTML = '';
            
            data.forEach(item => {
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
                row.className = item.client_ID ? 'clients-row clickable-row' : 'clients-row'; 
                row.dataset.clientId = item.client_ID; 

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
        })
        .catch(error => {
            console.error('Error fetching client data:', error);
            tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">Error loading data. Check the browser console for details.</div>`;
        });
});