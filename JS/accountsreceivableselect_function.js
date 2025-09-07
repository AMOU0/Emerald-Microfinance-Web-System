document.addEventListener('DOMContentLoaded', function() {
    // ==========================================================
    // 1. Initial Checks and Navigation (Original First Block)
    // ==========================================================
    
    // Call the session check function as soon as the page loads. (Assuming checkSessionAndRedirect is defined elsewhere)
    // checkSessionAndRedirect(); 

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
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Redirect to the PHP script that handles session destruction
            window.location.href = 'PHP/check_logout.php'; 
        });
    }

    // ==========================================================
    // 2. RETURN Button Handler (Original Second Block)
    // ==========================================================
    
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

    if (!clientId || !loanId) {
        // If loan details are missing, stop here but don't halt the general listeners above.
        // You might want to display a message or redirect if this is an Accounts Receivable page.
        // alert('Missing clientID or loanID in URL');
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
    const amountInput = document.getElementById('amount');
    const payButton = document.querySelector('.pay-button');
    const messageContainer = document.getElementById('message-container');
    const scheduleTableBody = document.querySelector('.loan-schedule-table tbody');

    let loanData = null; // Stores loan summary for payment validation

    // Helper function for currency formatting
    const formatCurrency = (amount) => parseFloat(amount).toFixed(2);

    /**
     * Fetches loan summary and the amortization schedule and populates the table.
     */
    async function fetchLoanDataAndSchedule() {
        messageContainer.textContent = 'Loading loan details and schedule...';
        messageContainer.style.color = 'blue';
        scheduleTableBody.innerHTML = ''; // Clear existing table data

        // --- Fetch Summary Details ---
        try {
            const summaryUrl = `PHP/accountsreceivableselect_handler.php?client_id=${clientId}&loan_id=${loanId}`;
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
            balanceInput.value = formatCurrency(loanData.balance);
            amountToPayInput.value = formatCurrency(loanData.amount_to_pay);
            currentDueInput.value = loanData.current_due;
            nextDueInput.value = loanData.next_due;
            amountInput.value = formatCurrency(loanData.amount_to_pay); 

        } catch (e) {
            messageContainer.textContent = 'Error fetching loan details.';
            console.error('Summary Fetch Error:', e);
            return;
        }

        // --- Fetch Amortization Schedule ---
        try {
            const scheduleUrl = `PHP/accountsreceivableselectsched_handle.php?client_id=${clientId}&loan_id=${loanId}`;
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

                // FIX: Only add the class if rowClass is not an empty string
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


    // --- Payment Handler ---
    if (payButton) {
        payButton.addEventListener('click', () => {
            const amountStr = amountInput.value.trim();
            if (!amountStr || isNaN(amountStr)) {
                messageContainer.textContent = 'Enter a valid payment amount';
                messageContainer.style.color = 'red';
                return;
            }
            const amount = parseFloat(amountStr);
            
            // Validation checks
            if (amount <= 0) {
                messageContainer.textContent = 'Payment amount must be positive';
                messageContainer.style.color = 'red';
                return;
            }
            
            // Validation: Payment cannot exceed total balance
            if (amount > parseFloat(balanceInput.value)) {
                messageContainer.textContent = 'Payment exceeds total balance';
                messageContainer.style.color = 'red';
                return;
            }
            
            const formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('loan_id', loanId);
            formData.append('amount', amount);
            formData.append('processby', 'system');

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