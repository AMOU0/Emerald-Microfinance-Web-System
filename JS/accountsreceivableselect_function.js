document.addEventListener('DOMContentLoaded', function() {
  // Call the session check function as soon as the page loads.
  checkSessionAndRedirect(); 

  // --- Global Logging Function (MODIFIED) ---
  /**
   * Logs a user action, separating the action type from the description, and includes DML audit data.
   * @param {string} actionType The classification of the action (e.g., NAVIGATION, VIEW, PAYMENT).
   * @param {string} description The detailed description of the action.
   * @param {Object} [dbLogParams={}] Optional parameters for DML logs.
   */
  function logUserAction(actionType, description, dbLogParams = {}) {
    // Collect all data into a single object for FormData construction
    const logData = {
        action: actionType,
        description: description,
        target_table: dbLogParams.targetTable || null,
        target_id: dbLogParams.targetId || null,
        before_state: dbLogParams.beforeState || null,
        after_state: dbLogParams.afterState || null
    };

    // Use URLSearchParams for application/x-www-form-urlencoded
    const bodyParams = new URLSearchParams();
    for (const key in logData) {
        if (logData[key] !== null) {
            bodyParams.append(key, logData[key]);
        }
    }

    fetch('PHP/log_action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString()
    })
    .then(response => {
      // Per the PHP file's logic, this will often be 200 even on log failure.
      if (!response.ok) {
        console.warn('Audit log failed to record (Server Warning):', actionType, description);
      }
    })
    .catch(error => {
      console.error('Audit log fetch error:', error);
    });
  }
  // --------------------------------------------------------

  const navLinks = document.querySelectorAll('.nav-link');
  const logoutButton = document.querySelector('.logout-button');

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

  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault(); 
      navLinks.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      // Normalize the link text for mapping lookup
      const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
      const targetPage = urlMapping[linkText];

      if (targetPage) {
        // Log Navigation Action using the new format
        const actionType = 'NAVIGATION';
        const actionDescription = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

        logUserAction(actionType, actionDescription);

        window.location.href = targetPage;
      } else {
        console.error('No page defined for this link:', linkText);
        
        // Log Failed Navigation
        logUserAction('FAILED_NAVIGATION', `Clicked link "${this.textContent}" with no mapped page.`);
      }
    });
  });

  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      // check_logout.php should handle the LOGOUT log itself.
      window.location.href = 'PHP/check_logout.php'; 
    });
  }
  const returnButton = document.querySelector('.return-button');

  if (returnButton) {
    returnButton.addEventListener('click', function() {
      const targetPage = 'AccountsReceivable.html';

      // Log the action before navigation
      logUserAction(' NAVIGATION', `User clicked RETURN button, redirecting to ${targetPage}.`);

      // Perform the page navigation
      window.location.href = targetPage;
    });
    
    console.log('Successfully attached click handler to the RETURN button.');
  } else {
    // This is not a critical error if the button isn't on the page
    // console.error('RETURN button element not found.');
  }

    // ==========================================================
    // 3. Loan Details, Schedule Fetch, and Payment Handler 
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

    // Helper function for currency formatting with 2 decimals
    const formatCurrency = (amount) => {
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

            // Render Table (rendering logic omitted for brevity, assumed to be correct)
            scheduleData.forEach((installment) => {
                const row = scheduleTableBody.insertRow();
                // ... row rendering logic ...
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
            
            // Update Due Dates (logic omitted for brevity, assumed to be correct)
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
            
            // --- AUDIT LOG ADDITION: Successful Data Load ---
            logUserAction('VIEW', 
                          `Successfully loaded loan details and schedule for Client ID: ${clientId}, Loan ID: ${loanId}`
            );
            // ------------------------------------------------
            
        } catch (error) {
            console.error('Schedule Fetch Error:', error);
            messageContainer.textContent = 'Failed to fetch or process schedule data.';
            messageContainer.style.color = 'red';
        }
    }

    // Add event listener to auto-format amount on blur
    amountInput.addEventListener('blur', function() {
        const value = this.value.trim();
        if (value && !isNaN(value)) {
            this.value = formatCurrency(value);
        } else if (!value) {
            this.value = '0.00';
        }
    });

    // Add event listener to handle input 
    amountInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9.]/g, ''); 
        const parts = this.value.split('.');
        if (parts.length > 2) {
            this.value = parts[0] + '.' + parts.slice(1).join('');
        }
    });


    // --- Payment Handler ---
    if (payButton) {
        payButton.addEventListener('click', () => {
            const amountStr = amountInput.value.replace(/[^0-9.]/g, ''); 
            
            if (!amountStr || isNaN(amountStr)) {
                messageContainer.textContent = 'Enter a valid payment amount';
                messageContainer.style.color = 'red';
                return;
            }
            const amount = parseFloat(amountStr); 
            
            if (amount <= 0) {
                messageContainer.textContent = 'Payment amount must be positive';
                messageContainer.style.color = 'red';
                return;
            }
            
            const balanceValue = parseFloat(balanceInput.value.replace(/[^0-9.]/g, ''));

            if (amount > balanceValue) {
                messageContainer.textContent = 'Payment exceeds total balance';
                messageContainer.style.color = 'red';
                return;
            }
            
            // Capture the 'Before State' for logging
            const beforePaymentState = {
                loanId: loanId,
                clientId: clientId,
                balance: balanceInput.value,
                amountToPay: amountToPayInput.value,
                paymentAmount: formatCurrency(amount)
            };
            const beforeStateJSON = JSON.stringify(beforePaymentState);


            const formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('loan_id', loanId);
            formData.append('amount', amount); 
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
                        
                        // --- AUDIT LOG ADDITION: Failed Payment ---
                        logUserAction('FAILED_PAYMENT', 
                                     `Attempted to pay ${formatCurrency(amount)} for Client ID: ${clientId}, Loan ID: ${loanId}. Server Error: ${data.error}`,
                                     {
                                         targetTable: 'payment', // Target payment table
                                         targetId: loanId,
                                         beforeState: beforeStateJSON,
                                         afterState: JSON.stringify({ error: data.error })
                                     }
                        );
                        // ------------------------------------------
                    } else {
                        messageContainer.textContent = data.message;
                        messageContainer.style.color = 'green';
                        
                        // --- AUDIT LOG ADDITION: Successful Payment ---
                        logUserAction('PAYMENT', 
                                     `Successfully processed payment of ${formatCurrency(amount)} for Client ID: ${clientId}, Loan ID: ${loanId}.`,
                                     {
                                         targetTable: 'payment', 
                                         targetId: loanId,
                                         beforeState: beforeStateJSON,
                                         // The server message indicates success, use it as a placeholder for afterState
                                         afterState: JSON.stringify({ message: data.message, amount: formatCurrency(amount) }) 
                                     }
                        );
                        // ----------------------------------------------
                        
                        // Refresh both summary fields and the table
                        fetchLoanDataAndSchedule(); 
                        amountInput.value = '0.00';
                    }
                })
                .catch(e => {
                    messageContainer.textContent = 'Error processing payment';
                    messageContainer.style.color = 'red';
                    console.error(e);
                    
                    // --- AUDIT LOG ADDITION: Catch Error Payment ---
                    logUserAction('PAYMENT_ERROR', 
                                 `Fetch error processing payment of ${formatCurrency(amount)} for Client ID: ${clientId}, Loan ID: ${loanId}.`,
                                 {
                                     targetTable: 'payment',
                                     targetId: loanId,
                                     beforeState: beforeStateJSON,
                                     afterState: JSON.stringify({ fetchError: e.message || 'Unknown fetch error' })
                                 }
                    );
                    // ------------------------------------------------
                });
        });
    }

    // Initial Load of Loan Data (only if IDs are present)
    fetchLoanDataAndSchedule();
});