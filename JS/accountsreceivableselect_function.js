document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    // ... (Navigation and Logout Handlers - KEEP AS IS) ...
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
    
    const returnButton = document.querySelector('.return-button'); 

    if (returnButton) {
        returnButton.addEventListener('click', () => {
            window.location.href = 'accountsreceivable.html'; 
        });
    }

    // ==========================================================
    // 3. Loan Details, Schedule Fetch, and Payment Handler (Original Third Block)
    // ==========================================================
    
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientID');
    const loanId = urlParams.get('loanID');
    const reconstructId = urlParams.get('reconstructID'); 

    if (!clientId || !loanId) {
        return; 
    }

    // DOM Elements (Consolidated)
    const clientIDInput = document.getElementById('client_ID');
    const lastNameInput = document.getElementById('lastName');
    const loanIdInput = document.getElementById('loanid');
    const balanceInput = document.getElementById('balance');
    const amountToPayInput = document.getElementById('amountToPay');
    const currentDueInput = document.getElementById('currentDue');
    const nextDueInput = document.getElementById('nextDue');
    const amountInput = document.getElementById('amount'); // The editable amount field
    const payButton = document.querySelector('.pay-button');
    const messageContainer = document.getElementById('message-container');
    const scheduleTableBody = document.querySelector('.loan-schedule-table tbody');

    let loanData = null; // Stores loan summary for payment validation

    // 💰 UPDATED: Helper function for currency formatting with 2 decimals
    const formatCurrency = (amount) => {
        // Ensure it's a number and format to 2 decimal places with commas
        const num = parseFloat(amount);
        if (isNaN(num)) return '0.00';
        return num.toFixed(2);
    };

    /**
     * Fetches loan summary and the amortization schedule and populates the table.
     */
    async function fetchLoanDataAndSchedule() {
        messageContainer.textContent = 'Loading loan details and schedule...';
        messageContainer.style.color = 'blue';
        scheduleTableBody.innerHTML = ''; // Clear existing table data

        // Build the query string with optional reconstructID
        let queryString = `client_id=${clientId}&loan_id=${loanId}`;
        if (reconstructId) {
            queryString += `&reconstructID=${reconstructId}`;
        }

        // --- Fetch Summary Details ---
        try {
            const summaryUrl = `PHP/accountsreceivableselect_handler.php?${queryString}`;
            const summaryRes = await fetch(summaryUrl);
            const summaryData = await summaryRes.json();

            if (summaryData.error) {
                messageContainer.textContent = `Error: ${summaryData.error}`;
                messageContainer.style.color = 'red';
                return;
            }
            
            // Populate summary fields
            loanData = summaryData.loan;
            clientIDInput.value = summaryData.client.client_ID;
            lastNameInput.value = summaryData.client.name;
            loanIdInput.value = loanData.id;
            
            // Use formatCurrency for all display amounts
            balanceInput.value = formatCurrency(loanData.balance);
            amountToPayInput.value = formatCurrency(loanData.amount_to_pay);
            
            currentDueInput.value = loanData.current_due;
            nextDueInput.value = loanData.next_due;
            
            // 💰 UPDATE: Set initial amount input value to the 'amount_to_pay' formatted
            amountInput.value = formatCurrency(loanData.amount_to_pay); 

        } catch (e) {
            messageContainer.textContent = 'Error fetching loan details.';
            console.error('Summary Fetch Error:', e);
            return;
        }

        // --- Fetch Amortization Schedule ---
        try {
            const scheduleUrl = `PHP/accountsreceivableselectsched_handle.php?${queryString}`;
            const scheduleRes = await fetch(scheduleUrl);
            const scheduleData = await scheduleRes.json();

            if (scheduleData.error) {
                messageContainer.textContent = `Error fetching schedule: ${scheduleData.error}`;
                messageContainer.style.color = 'red';
                return;
            }

            if (scheduleData.length === 0) {
                messageContainer.textContent = 'No amortization schedule found for this loan.';
                messageContainer.style.color = 'orange';
                return;
            }

            // Render Table
            scheduleData.forEach((installment) => {
                const row = scheduleTableBody.insertRow();
                
                const isPaid = installment.is_paid;
                const isPartiallyPaid = installment.amount_paid > 0 && !isPaid;
                const rowClass = isPaid ? 'paid' : (isPartiallyPaid ? 'partially-paid' : '');

                if (rowClass) {
                    row.classList.add(rowClass);
                }

                row.insertCell().textContent = installment.due_date;
                row.insertCell().textContent = formatCurrency(installment.installment_amount);
                row.insertCell().textContent = formatCurrency(installment.interest_component);
                row.insertCell().textContent = formatCurrency(installment.amount_paid);
                row.insertCell().textContent = installment.date_paid || 'N/A';
                row.insertCell().textContent = formatCurrency(installment.remaining_balance);
            });
            
            // Update Due Dates
            const firstUnpaid = scheduleData.find(item => !item.is_paid);
            if (firstUnpaid) {
                const firstUnpaidIndex = scheduleData.findIndex(item => !item.is_paid);
                currentDueInput.value = firstUnpaid.due_date;
                const nextDueInstallment = scheduleData[firstUnpaidIndex + 1];
                nextDueInput.value = nextDueInstallment ? nextDueInstallment.due_date : 'N/A (Last Due)';
            } else {
                currentDueInput.value = 'N/A (Fully Paid)';
                nextDueInput.value = 'N/A';
            }

            messageContainer.textContent = 'Schedule and details loaded successfully.';
            messageContainer.style.color = 'green';
            
        } catch (error) {
            console.error('Schedule Fetch Error:', error);
            messageContainer.textContent = 'Failed to fetch or process schedule data.';
            messageContainer.style.color = 'red';
        }
    }

    // 💰 NEW: Add event listener to auto-format amount on blur
    amountInput.addEventListener('blur', function() {
        const value = this.value.trim();
        if (value && !isNaN(value)) {
            // Reformat the number when the user clicks away
            this.value = formatCurrency(value);
        } else if (!value) {
            // If empty, reset to 0.00
            this.value = '0.00';
        }
    });

    // 💰 NEW: Add event listener to handle input (optional - for better typing experience)
    amountInput.addEventListener('input', function() {
        // Simple logic to clean input while typing, keeping only numbers and one decimal point
        this.value = this.value.replace(/[^0-9.]/g, ''); 
        const parts = this.value.split('.');
        if (parts.length > 2) {
            this.value = parts[0] + '.' + parts.slice(1).join('');
        }
    });


    // --- Payment Handler ---
    if (payButton) {
        payButton.addEventListener('click', () => {
            // IMPORTANT: Get the raw number for the payment, ignoring commas, but respecting the decimal point
            const amountStr = amountInput.value.replace(/[^0-9.]/g, ''); 
            
            if (!amountStr || isNaN(amountStr)) {
                messageContainer.textContent = 'Enter a valid payment amount';
                messageContainer.style.color = 'red';
                return;
            }
            const amount = parseFloat(amountStr); // The clean float value to send to the server
            
            // Validation checks
            if (amount <= 0) {
                messageContainer.textContent = 'Payment amount must be positive';
                messageContainer.style.color = 'red';
                return;
            }
            
            // Validation: Payment cannot exceed total balance. Remove formatting for comparison.
            const balanceValue = parseFloat(balanceInput.value.replace(/[^0-9.]/g, ''));

            if (amount > balanceValue) {
                messageContainer.textContent = 'Payment exceeds total balance';
                messageContainer.style.color = 'red';
                return;
            }
            
            const formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('loan_id', loanId);
            formData.append('amount', amount); // Use the clean float value
            formData.append('processby', 'system');
            
            if (reconstructId) {
                formData.append('reconstructID', reconstructId);
            }

            messageContainer.textContent = 'Processing payment...';
            messageContainer.style.color = 'blue';

            fetch('PHP/accountsreceivableselectpay_handle.php', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        messageContainer.textContent = data.error;
                        messageContainer.style.color = 'red';
                    } else {
                        messageContainer.textContent = data.message;
                        messageContainer.style.color = 'green';
                        // Refresh both summary fields and the table
                        fetchLoanDataAndSchedule(); 
                        // Optional: Reset amount input after successful payment
                        amountInput.value = '0.00';
                    }
                })
                .catch(e => {
                    messageContainer.textContent = 'Error processing payment';
                    messageContainer.style.color = 'red';
                    console.error(e);
                });
        });
    }

    // Initial Load of Loan Data (only if IDs are present)
    fetchLoanDataAndSchedule();
});