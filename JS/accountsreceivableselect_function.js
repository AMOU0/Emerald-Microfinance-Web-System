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
/*================================= */
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientID');
    const loanId = urlParams.get('loanID');

    if (!clientId || !loanId) {
        alert('Missing clientID or loanID in URL');
        return;
    }

    const clientIDInput = document.getElementById('client_ID');
    const lastNameInput = document.getElementById('lastName');
    const loanIdInput = document.getElementById('loanid');
    const balanceInput = document.getElementById('balance');
    const amountToPayInput = document.getElementById('amountToPay');
    const currentDueInput = document.getElementById('currentDue');
    const nextDueInput = document.getElementById('nextDue');
    const amountInput = document.getElementById('amount');
    const payButton = document.querySelector('.pay-button');
    const messageContainer = document.getElementById('message-container');

    let loanData = null;

    function fetchLoanDetails() {
        fetch(`PHP/accountsreceivableselect_handler.php?client_id=${clientId}&loan_id=${loanId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    messageContainer.textContent = data.error;
                    return;
                }
                loanData = data.loan;
                clientIDInput.value = data.client.client_ID;
                lastNameInput.value = data.client.name;
                loanIdInput.value = loanData.id;
                balanceInput.value = loanData.balance.toFixed(2);
                amountToPayInput.value = loanData.amount_to_pay.toFixed(2);
                currentDueInput.value = loanData.current_due;
                nextDueInput.value = loanData.next_due;
                amountInput.value = loanData.amount_to_pay.toFixed(2);
            })
            .catch(e => {
                messageContainer.textContent = 'Error fetching loan details';
                console.error(e);
            });
    }

    payButton.addEventListener('click', () => {
        const amountStr = amountInput.value.trim();
        if (!amountStr || isNaN(amountStr)) {
            messageContainer.textContent = 'Enter a valid payment amount';
            return;
        }
        const amount = parseFloat(amountStr);
        if (amount <= 0) {
            messageContainer.textContent = 'Payment amount must be positive';
            return;
        }
        if (amount > parseFloat(balanceInput.value)) {
            messageContainer.textContent = 'Payment exceeds total balance';
            return;
        }
        if (amount > loanData.amount_to_pay) {
            messageContainer.textContent = 'Payment exceeds current installment due amount';
            return;
        }

        const formData = new FormData();
        formData.append('client_id', clientId);
        formData.append('loan_id', loanId);
        formData.append('amount', amount);
        formData.append('processby', 'system');

        fetch('PHP/accountsreceivableselectpay_handle.php', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    messageContainer.textContent = data.error;
                } else {
                    messageContainer.textContent = data.message;
                    amountInput.value = '';
                    fetchLoanDetails();
                }
            })
            .catch(e => {
                messageContainer.textContent = 'Error processing payment';
                console.error(e);
            });
    });

    fetchLoanDetails();
});