document.addEventListener('DOMContentLoaded', function() {
  // Call the session check function as soon as the page loads.
  checkSessionAndRedirect(); 

  // --- Global Logging Function (Now accepts full audit trail data) ---
  function logUserAction(actionType, description, targetTable = null, targetId = null, beforeState = null, afterState = null) {
    const bodyData = new URLSearchParams();
    bodyData.append('action', actionType); 
    bodyData.append('description', description); 
    // Append optional audit trail data
    if (targetTable) bodyData.append('target_table', targetTable);
    if (targetId) bodyData.append('target_id', targetId);
    if (beforeState) bodyData.append('before_state', beforeState);
    if (afterState) bodyData.append('after_state', afterState);

    fetch('PHP/log_action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyData.toString()
    })
    .then(response => {
      if (!response.ok) {
        console.warn('Audit log failed to record:', actionType, description);
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

      const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
      const targetPage = urlMapping[linkText];

      if (targetPage) {
        const actionType = 'NAVIGATION';
        const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;
        logUserAction(actionType, description); 
        window.location.href = targetPage;
      } else {
        console.error('No page defined for this link:', linkText);
        const actionType = 'NAVIGATION_FAILED';
        const description = `Clicked link "${this.textContent}" with no mapped page.`;
        logUserAction(actionType, description);
      }
    });
  });

  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      window.location.href = 'PHP/check_logout.php'; 
    });
  }
});
/*=============================================================================================================================================================================*/

const showMessage = (message, type = 'error') => {
    const messageBox = document.getElementById('messageBox'); 
    if (!messageBox) {
        console.error("Message box element not found. Cannot display message.");
        return;
    }
    let bgColor, textColor, borderColor;
    if (type === 'error') {
        bgColor = '#fef2f2';
        textColor = '#b91c1c';
        borderColor = '#ef4444';
    } else if (type === 'success') {
        bgColor = '#f0fdf4';
        textColor = '#15803d';
        borderColor = '#22c55e';
    } else { // info
        bgColor = '#eff6ff';
        textColor = '#1e40af';
        borderColor = '#60a5fa';
    }
    
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    messageBox.style.backgroundColor = bgColor;
    messageBox.style.color = textColor;
    messageBox.style.borderColor = borderColor;
    
    if (type !== 'error') {
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }
};

// --- HTML Element Variable Declarations (All elements used in the script) ---
const maritalStatusSelect = document.getElementById('maritalStatus');
const genderSelect = document.getElementById('gender');
const citySelect = document.getElementById('city');
const barangaySelect = document.getElementById('barangay');
const incomeSalarySelect = document.getElementById('incomeSalary');
const validIdTypeSelect = document.getElementById('validIdType');
const hasValidIdCheck = document.getElementById('hasValidIdCheck');
const barangayClearanceCheck = document.getElementById('barangayClearanceCheck');
const dateStartInput = document.getElementById('date-start');
const paymentFrequencySelect = document.getElementById('payment-frequency');
const durationOfLoanInput = document.getElementById('duration-of-loan');
const dateEndInput = document.getElementById('date-end');

const clientIdInput = document.getElementById('clientIdInput');
const lastNameInput = document.getElementById('lastName');
const firstNameInput = document.getElementById('firstName');
const middleNameInput = document.getElementById('middleName');
const dateOfBirthInput = document.getElementById('dateOfBirth');
const postalCodeInput = document.getElementById('postalCode');
const streetAddressInput = document.getElementById('streetAddress');
const phoneNumberInput = document.getElementById('phoneNumber');
const emailInput = document.getElementById('email');
const employmentStatusInput = document.getElementById('employmentStatus');
const occupationPositionInput = document.getElementById('occupationPosition');
const yearsInJobInput = document.getElementById('yearsInJob');
const crInput = document.getElementById('cr');
const guarantorLastNameInput = document.getElementById('guarantorLastName');
const guarantorFirstNameInput = document.getElementById('guarantorFirstName');
const guarantorMiddleNameInput = document.getElementById('guarantorMiddleName');
const guarantorStreetAddressInput = document.getElementById('guarantorStreetAddress');
const guarantorPhoneNumberInput = document.getElementById('guarantorPhoneNumber');
const loanAmountSelect = document.getElementById('loan-amount');
const form = document.getElementById('pendingAccountForm');
// NEW: Get a reference to the submit button
const saveButton = form ? form.querySelector('.form-actions-bottom button[type="submit"]') : null; 

// --- Asynchronous Function to Fetch and Populate Select (UPDATED to support pre-selection) ---
const fetchAndPopulateSelect = async (element, endpoint, params = {}, defaultValue = '') => {
    if (!element) return; 
    try {
        if (!element.disabled) {
             element.disabled = true;
             element.innerHTML = '<option>Loading...</option>';
        }

        const formData = new FormData();
        formData.append('type', endpoint);
        for (const key in params) {
            formData.append(key, params[key]); 
        }

        const response = await fetch('PHP/selectdatafetcher_handler.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            showMessage(`Error loading ${endpoint} data: ${data.error}`); 
            return;
        }

        element.innerHTML = '<option value="">Select...</option>';
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            if (item === defaultValue) {
                option.selected = true; // Set default value
            }
            element.appendChild(option);
        });

    } catch (error) {
        console.error('Fetch error:', error);
        showMessage('Failed to load dropdown data.', 'error'); 
    } finally {
        element.disabled = false;
    }
};

// --- Loan Detail Calculation Logic ---
const updateLoanDetails = () => {
    const startDateString = dateStartInput.value;
    let endDate = '';
    const daysToAdd = 100; // Fixed duration of 100 days

    if (startDateString) {
        // Create a new Date object from the start date string
        const startDate = new Date(startDateString);
        
        // Normalize the time to ensure correct date arithmetic, especially across timezones
        startDate.setHours(0, 0, 0, 0); 

        // Add 100 days to the start date
        startDate.setDate(startDate.getDate() + daysToAdd);
        
        // The date variable now holds the end date
        const endDateObj = startDate; 

        // Format the new date as YYYY-MM-DD for the input field
        const year = endDateObj.getFullYear();
        // getMonth() is 0-indexed, so add 1, and use padStart for '01' instead of '1'
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        
        endDate = `${year}-${month}-${day}`;
    }

    // Set the loan duration display to a fixed value
    durationOfLoanInput.value = `${daysToAdd} days`;
    // Update the end date input field
    dateEndInput.value = endDate;
};

// --- Event Listeners for dynamic fields ---
// Only listen for changes on the start date input.
if (dateStartInput) {
    dateStartInput.addEventListener('change', updateLoanDetails);
} 

// Removed the listener for paymentFrequencySelect as it's no longer needed for this logic.

if (citySelect && barangaySelect) {
    citySelect.addEventListener('change', () => {
        const selectedCity = citySelect.value;
        if (selectedCity) {
            fetchAndPopulateSelect(barangaySelect, 'barangay', { city: selectedCity });
        } else {
            barangaySelect.innerHTML = '<option value="">Select a City first</option>';
            barangaySelect.disabled = true;
        }
    });
}

if (hasValidIdCheck && validIdTypeSelect) {
    hasValidIdCheck.addEventListener('change', () => {
        validIdTypeSelect.disabled = !hasValidIdCheck.checked;
        if (hasValidIdCheck.checked) {
            fetchAndPopulateSelect(validIdTypeSelect, 'validId');
        } else {
            validIdTypeSelect.innerHTML = '<option value="">Select...</option>';
        }
    });
}

/*=============================================================================================================================================================================*/

// --- 1.1 Populate Form Function ---
const populateForm = async (data) => {
    // Hidden Client ID
    clientIdInput.value = data.client_ID || '';

    // Personal Information
    lastNameInput.value = data.last_name || '';
    firstNameInput.value = data.first_name || '';
    middleNameInput.value = data.middle_name || '';
    dateOfBirthInput.value = data.date_of_birth || '';
    postalCodeInput.value = data.postal_code || '';
    streetAddressInput.value = data.street_address || '';
    phoneNumberInput.value = data.phone_number || '';
    emailInput.value = data.email || '';
    employmentStatusInput.value = data.employment_status || '';
    occupationPositionInput.value = data.occupation || '';
    yearsInJobInput.value = data.years_in_job || '';

    // Populate dropdowns with current values
    await fetchAndPopulateSelect(maritalStatusSelect, 'maritalStatus', {}, data.marital_status);
    await fetchAndPopulateSelect(genderSelect, 'gender', {}, data.gender);
    await fetchAndPopulateSelect(citySelect, 'city', {}, data.city);
    
    // City/Barangay dependency
    if (data.city) {
        await fetchAndPopulateSelect(barangaySelect, 'barangay', { city: data.city }, data.barangay);
    }
    await fetchAndPopulateSelect(incomeSalarySelect, 'incomeSalary', {}, data.income);
    
    // Requirements
    barangayClearanceCheck.checked = data.has_barangay_clearance;
    hasValidIdCheck.checked = data.hasValidIdCheck;
    crInput.value = data.colateral || '';

    // Valid ID Type Population (must be done after hasValidIdCheck is set)
    if (data.hasValidIdCheck) {
        validIdTypeSelect.disabled = false;
        await fetchAndPopulateSelect(validIdTypeSelect, 'validId', {}, data.validIdType);
    } else {
        validIdTypeSelect.disabled = true;
    }

    // Guarantor Information
    guarantorLastNameInput.value = data.guarantor_last_name || '';
    guarantorFirstNameInput.value = data.guarantor_first_name || '';
    guarantorMiddleNameInput.value = data.guarantor_middle_name || '';
    guarantorStreetAddressInput.value = data.guarantor_street_address || '';
    guarantorPhoneNumberInput.value = data.guarantor_phone_number || '';

    // Loan Details
    loanAmountSelect.value = data.loan_amount ? parseFloat(data.loan_amount).toString() : '';
    paymentFrequencySelect.value = data.payment_frequency || '';
    dateStartInput.value = data.date_start || '';
    durationOfLoanInput.value = data.duration_of_loan || '';
    dateEndInput.value = data.date_end || '';
    
    // Final check for loan calculation
    updateLoanDetails(); 
};

/*=============================================================================================================================================================================*/

const fetchPendingAccountData = async (clientId) => {
    showMessage('Fetching client data...', 'info');
    try {
        const formData = new FormData();
        formData.append('client_id', clientId);

        const response = await fetch('PHP/pendingaccountview_handler.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            showMessage(data.error, 'error');
            console.error('Server Error:', data.error);
        } else if (data.success && data.data) {
            showMessage('Client data loaded successfully!', 'success');
            await populateForm(data.data);
        } else {
            showMessage('Failed to load client data. Unknown error.', 'error');
        }

    } catch (error) {
        console.error('Fetch error:', error);
        showMessage('Failed to connect to the server for data retrieval.', 'error');
    }
};

/*=============================================================================================================================================================================*/
/**
 * Handles the form submission: shows 'Saving...' on the button and displays the message box.
 */
const handleFormSubmission = () => {
    if (!form || !saveButton) return;
    
    // Helper to call the logUserAction from the outer scope
    const logUserAction = (actionType, description, targetTable = null, targetId = null, beforeState = null, afterState = null) => {
        // Since logUserAction is defined in the outer scope (DOMContentLoaded), we assume it's callable.
        // We redefine it here locally to ensure it is always available inside the event listener.
        const bodyData = new URLSearchParams();
        bodyData.append('action', actionType); 
        bodyData.append('description', description); 
        if (targetTable) bodyData.append('target_table', targetTable);
        if (targetId) bodyData.append('target_id', targetId);
        if (beforeState) bodyData.append('before_state', beforeState);
        if (afterState) bodyData.append('after_state', afterState);

        fetch('PHP/log_action.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyData.toString()
        }).catch(e => console.error('Local logUserAction error:', e));
    };
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // 1. Set Button State to SAVING
        const originalButtonText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
        
        // 2. Show 'Saving...' Message Box
        showMessage('Saving changes...', 'info');

        const formData = new FormData(form);
        const clientId = clientIdInput.value; // Get the Client ID from the input field
        
        // Ensure client_id is in the POST data
        if (clientId) {
             formData.append('client_id', clientId); 
        } else {
             showMessage('Error: Client ID is missing from form. Cannot save.', 'error');
             saveButton.textContent = originalButtonText;
             saveButton.disabled = false;
             return;
        }

        // Explicitly include unchecked checkboxes for PHP logic
        if (!barangayClearanceCheck.checked) {
             formData.append('barangayClearanceCheck', 'off');
        }
        if (!hasValidIdCheck.checked) {
             formData.append('hasValidIdCheck', 'off');
        }

        try {
            // STEP A: Perform the database update
            const response = await fetch('PHP/pendingaccountupdate_handler.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // STEP B: Database update succeeded. Now perform the audit log.
                showMessage(result.message, 'success');
                
                // --- AUDIT TRAIL: Log Success ---
                const auditData = result.audit_data;
                const actionType = 'UPDATED';
                const description = `Successfully saved pending account details for Client ID: ${clientId}.`;
                
                logUserAction(
                    actionType, 
                    description, 
                    auditData.target_table, 
                    auditData.client_id, 
                    auditData.before_state, 
                    auditData.after_state
                ); 
                // ------------------------------------
                
            } else {
                // STEP B: Database update failed. Log the failure.
                showMessage(result.error || 'Failed to save changes. Please try again.', 'error');
                
                // --- AUDIT TRAIL: Log Failure ---
                const actionType = 'UPDATE_FAILED';
                const description = `Failed to save pending account details for Client ID: ${clientId}. Server error: ${result.error || 'Unknown'}.`;
                // Pass before state and set after state to the error message for debugging
                logUserAction(
                    actionType, 
                    description, 
                    'clients, etc.', 
                    clientId, 
                    'N/A', 
                    result.error || 'Unknown Server Error'
                );
                // ------------------------------------
                console.error('Submission Error:', result.error);
            }
        } catch (error) {
            // STEP B: Network failure during the update call. Log the error.
            
            // --- AUDIT TRAIL: Log Network Failure (Client-side responsibility) ---
            const actionType = 'NETWORK_ERROR';
            const description = `Network error during save attempt for Client ID: ${clientId}.`;
            logUserAction(actionType, description, 'clients, etc.', clientId, 'N/A', `Network connection failed: ${error.message}`);
            // -------------------------------------------------------------------
            
            console.error('Network Error:', error);
            showMessage('Network error: Could not connect to the server.', 'error');
        } finally {
            // 3. Reset Button State
            saveButton.textContent = originalButtonText;
            saveButton.disabled = false;
        }
    });
};

/*=============================================================================================================================================================================*/
const main = () => {
    // Get client ID from URL (e.g., ?id=202500001)
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('id');

    if (clientId) {
        fetchPendingAccountData(clientId);
    } else {
        showMessage('Client ID not found in URL. Please use a valid link.', 'error');
    }

    // Set up the form submission listener
    handleFormSubmission();
};

// Run the main function when the page loads
document.addEventListener('DOMContentLoaded', main);