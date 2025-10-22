document.addEventListener('DOMContentLoaded', function() {
            enforceRoleAccess(['admin','Manager']); 
        });
/*=============================================================================*/


document.addEventListener('DOMContentLoaded', function() {
  // Ensure this function is defined somewhere or imported if it's not here.
  // Assuming it's defined elsewhere, or you should add a placeholder/definition for it.
  // For the purpose of this merge, we'll assume it exists globally or is defined 
  // at the top of a linked script.
  // If checkSessionAndRedirect() is NOT globally defined, you must define it here.
  // Example placeholder (if needed):
  // function checkSessionAndRedirect() { /* ... session check logic ... */ } 
  
  // Call the session check function as soon as the page loads.
  // NOTE: This function must be defined for the code to run without errors.
  // checkSessionAndRedirect(); 

  // --- Global Logging Function (Unified and robust version) ---
  function logUserAction(actionType, description) {
    // Use URLSearchParams to easily format the POST body for 'application/x-www-form-urlencoded'
    const bodyData = new URLSearchParams();
    bodyData.append('action', actionType); 
    bodyData.append('description', description); 

    fetch('PHP/log_action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyData.toString()
    })
    .then(response => {
      // Check for HTTP errors (e.g., 404, 500)
      if (!response.ok) {
        // Use console.warn for non-critical logging failures
        console.warn('Audit log failed to record:', actionType, description, 'Status:', response.status);
      }
      // You can add logic here to consume the response body if the server returns meaningful data
    })
    .catch(error => {
      // Handle network errors (e.g., connection issues)
      console.error('Audit log fetch error:', error);
    });
  }
  // --------------------------------------------------------
  
  // --- Navigation Link Handlers (from the second code block) ---
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
        const actionType = 'NAVIGATION'; 
        const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

        // ASYNCHRONOUS AUDIT LOG: Log the action.
        logUserAction(actionType, description);

        // Perform the page redirect immediately after initiating the log.
        window.location.href = targetPage;
      } else {
        console.error('No page defined for this link:', linkText);
        
        // Log the failed navigation attempt
        logUserAction('NAVIGATION_FAIL', `FAILED: Clicked link "${this.textContent}" with no mapped page.`);
      }
    });
  });

  // Handle the logout button securely
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      // The PHP script 'PHP/check_logout.php' is expected to handle the log *before* session destruction.
      window.location.href = 'PHP/check_logout.php'; 
    });
  }
  
  // --- Return Button Handler (from the first code block) ---
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

/*===========================================================================================================================================*/
  // --- 2. Function to Extract Loan ID from URL and Fetch Data ---
  function loadLoanData() {
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('loanID'); 
    
    if (!loanId) {
        alert('Loan ID is missing in the URL. Please navigate from the Accounts Receivable list.');
        return;
    }
    
    // *** FIX: Set the hidden input field for loan_id so it's submitted with the form. ***
    const hiddenLoanIdInput = document.getElementById('loan-id-hidden');
    if (hiddenLoanIdInput) {
        hiddenLoanIdInput.value = loanId;
    }
    
    // Fetch loan details from the PHP handler (accountsrecivablereconstruct_handler.php)
    fetch(`PHP/accountsrecivablereconstruct_handler.php?loan_id=${loanId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error("Server Error:", data.error);
                alert(`Error: ${data.error}. Please check the loan ID.`);
                
                // Clear any fields that might be present
                const elementsToClear = [
                    'loan-amount', 'original-terms', 'original-date-start', 
                    'balance-amount', 'original-duration-of-loan', 'original-date-end',
                    'reconstruct-terms', 'reconstruct-interest-rate', 
                    'reconstruct-date-start', 'reconstruct-duration-of-loan', 'reconstruct-date-end'
                ];
                elementsToClear.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                
            } else {
                
                // Fields to populate from the fetched data
                const fieldsToPopulate = {
                    'loan-amount': data.loan_amount_with_interest,
                    'original-terms': data.payment_frequency,
                    'original-date-start': data.date_start,
                    'balance-amount': data.balance, // This is the Outstanding Balance / Reconstruct Amount
                    'original-duration-of-loan': data.duration_of_loan,
                    'original-date-end': data.date_end,
                    // Pre-populate reconstruction terms as a suggestion
                    'reconstruct-terms': data.payment_frequency 
                };

                for (const id in fieldsToPopulate) {
                    const element = document.getElementById(id);
                    if (element) { 
                        element.value = fieldsToPopulate[id];
                    } else {
                        // This warning helps you fix your HTML, but doesn't crash the script
                        console.warn(`Missing form element in HTML: #${id}. Cannot set value.`);
                    }
                }
            }
        })
        .catch(error => {
            console.error("There was a problem with the fetch operation:", error);
            alert("Could not load loan details. Check the server and loan ID.");
        });
  }

  // --- 3. Initial Data Load on Page Load (NOW AUTOMATIC) ---
  loadLoanData();
});
/*===========================================================================================================================================*/
document.addEventListener('DOMContentLoaded', function() {
    const dateStartInput = document.getElementById('reconstruct-date-start');
    const durationInput = document.getElementById('reconstruct-duration-of-loan');
    const dateEndInput = document.getElementById('reconstruct-date-end');
    const durationDays = 100; // Fixed duration for reconstruction calculation

    // Function to calculate, set duration, and set the end date
    function handleDateChange() {
        const startDateValue = dateStartInput.value;
        
        // Check if a start date is selected
        if (startDateValue) {
            // 1. Set the duration input to 100 days
            durationInput.value = `${durationDays} days`;

            const startDate = new Date(startDateValue);
            
            // Get the time in milliseconds and add the equivalent of 100 days
            // 1 day = 24 * 60 * 60 * 1000 milliseconds
            const endDateTimestamp = startDate.getTime() + (durationDays * 24 * 60 * 60 * 1000);
            const endDate = new Date(endDateTimestamp);

            // Format the resulting date manually to YYYY-MM-DD for the date input field
            const year = endDate.getFullYear();
            // getMonth() is 0-indexed, so we add 1
            const month = String(endDate.getMonth() + 1).padStart(2, '0'); 
            const day = String(endDate.getDate()).padStart(2, '0');
            
            const formattedEndDate = `${year}-${month}-${day}`;
            dateEndInput.value = formattedEndDate;
            
        } else {
            // If start date is cleared, clear the duration and end date
            durationInput.value = '';
            dateEndInput.value = '';
        }
    }

    // Attach the event listener to the start date input
    dateStartInput.addEventListener('change', handleDateChange);

    // Initial call in case the input already has a default value on load
    handleDateChange();
});
/*===========================================================================================================================================*/




// --- Function to send an audit log request to the PHP backend ---
function logUserAction(actionType, description, targetTable = null, targetId = null, beforeState = null, afterState = null) {
    const logHandlerUrl = 'PHP/log_action.php';

    // Prepare data for POST request
    const logData = new URLSearchParams();
    logData.append('action', actionType);
    logData.append('description', description);
    
    // Optional data (only include if provided)
    if (targetTable) logData.append('target_table', targetTable);
    if (targetId) logData.append('target_id', targetId);
    if (beforeState) logData.append('before_state', beforeState);
    if (afterState) logData.append('after_state', afterState);

    // Send data to PHP
    fetch(logHandlerUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: logData.toString()
    })
    .then(response => {
        if (!response.ok) {
            // Log HTTP error to console, but don't stop the main user workflow
            console.error(`Audit Log HTTP error! status: ${response.status}`);
            return response.text().then(text => {
                console.error("Audit Log Response:", text);
            });
        }
        // Audit log success (optional console log)
        // console.log('Audit trail successfully logged.');
    })
    .catch(error => {
        // Log network error for the audit trail to console
        console.error('Audit Log Fetch Error:', error);
    });
}


// --- Function to handle saving the reconstruction data ---
function handleReconstructSave(event) {
    event.preventDefault(); // Stop the default form submission

    // The handler is in the PHP/ directory
    const handlerUrl = 'PHP/accountsrecivablereconstructsave_handler.php'; 

    // 1. Get loanID from URL (e.g., from ...?clientID=...&loanID=10202500006)
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('loanID'); 

    if (!loanId) {
        alert('Error: Loan ID (loanID) is missing from the URL. Cannot save.');
        return;
    }

    // 2. Collect Reconstruct Details from the HTML inputs
    const paymentFrequency = document.getElementById('reconstruct-terms').value;
    const dateStart = document.getElementById('reconstruct-date-start').value;
    const duration = document.getElementById('reconstruct-duration-of-loan').value;
    const dateEnd = document.getElementById('reconstruct-date-end').value;

    // Basic validation
    if (!paymentFrequency || !dateStart || !duration || !dateEnd) {
        alert('Please fill out all reconstruction details before applying.');
        return;
    }

    // 3. Prepare data for POST request using URLSearchParams
    const formData = new URLSearchParams();
    formData.append('loanID', loanId); 
    formData.append('payment_frequency', paymentFrequency);
    formData.append('date_start', dateStart);
    formData.append('duration_of_loan', duration);
    formData.append('date_end', dateEnd);

    // 4. Send data to PHP
    fetch(handlerUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    })
    .then(response => {
        // Check for HTTP errors (e.g., 404, 500)
        if (!response.ok) {
            // For non-200 responses, try to read the error body as text for better debugging
            return response.text().then(text => {
                throw new Error(`HTTP error! status: ${response.status}. Response body: ${text}`);
            });
        }
        return response.json(); // Attempt to parse the expected JSON response
    })
    .then(data => {
        if (data.success) {
            // Success logic
            alert('Loan reconstruction successfully applied!');
            
            // Log the action upon successful save (This will now work!)
            logUserAction(
                'UPDATE', 
                `Reconstructed Loan ID: ${loanId}. New terms: Freq:${paymentFrequency}, Duration:${duration}`,
                'loans', // Target table
                loanId,  // Target ID
            );

            // === REDIRECT AFTER SUCCESS ===
            window.location.href = 'AccountsReceivable.html';
            // ===============================

        } else {
            // Server reported an error
            const errorMessage = data.error || 'An unknown server error occurred.';
            alert('Reconstruction failed: ' + errorMessage);
            console.error('Server Error:', data);
        }
    })
    .catch(error => {
        // Network or JSON parsing error
        alert('A network error or unexpected response was received. Check console for details.');
        console.error('Fetch Error:', error);
        console.error("DEBUG HINT: This error often means your PHP file crashed and returned an HTML error page. Check your PHP server error logs or the response body printed above.");
    });
}

// Attach the event listener to the form's submit event
const reconstructForm = document.querySelector('form'); 
if (reconstructForm) {
    reconstructForm.addEventListener('submit', handleReconstructSave);
}