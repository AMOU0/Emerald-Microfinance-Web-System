document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    // Ensure the keys here match the text content of your <a> tags exactly.
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'For Release': ['Admin', 'Manager', 'Loan_Officer'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer']
    };

    // 2. Fetch the current user's role
    fetch('PHP/check_session.php')
        .then(response => {
            // Check if the response is successful (HTTP 200)
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Ensure the session is active and a role is returned
            if (data.status === 'active' && data.role) {
                const userRole = data.role;
                applyAccessControl(userRole);
            } else {
                // If not logged in, you might want to hide everything or redirect
                // For now, we'll assume the 'none' role has no access, which the loop handles.
                applyAccessControl('none');
            }
        })
        .catch(error => {
            console.error('Error fetching user session:', error);
            // Optionally hide all nav links on severe error
            // document.querySelector('.sidebar-nav ul').style.display = 'none';
        });

    // 3. Apply Access Control
    function applyAccessControl(userRole) {
        // Select all navigation links within the sidebar
        const navLinks = document.querySelectorAll('.sidebar-nav ul li a');

        navLinks.forEach(link => {
            const linkName = link.textContent.trim();
            const parentListItem = link.parentElement; // The <li> element

            // Check if the link name exists in the access rules
            if (accessRules.hasOwnProperty(linkName)) {
                const allowedRoles = accessRules[linkName];

                // Check if the current user's role is in the list of allowed roles
                if (!allowedRoles.includes(userRole)) {
                    // Hide the entire list item (<li>) if the user role is NOT authorized
                    parentListItem.style.display = 'none';
                }
            } else {
                // Optional: Hide links that are not defined in the accessRules for safety
                // parentListItem.style.display = 'none';
                console.warn(`No access rule defined for: ${linkName}`);
            }
        });
    }
});
//==============================================================================================================================================
document.addEventListener('DOMContentLoaded', function() {
            enforceRoleAccess(['admin','Manager']); 
        });
/*=============================================================================*/

document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    // NOTE: checkSessionAndRedirect() is assumed to be defined in JS/enforce_login.js
    if (typeof checkSessionAndRedirect === 'function') {
        checkSessionAndRedirect(); 
    }

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
        'forrelease': 'ReportsRelease.html',
        'paymentcollection': 'AccountsReceivable.html',
        'ledger': 'Ledgers.html',
        'reports': 'Reports.html',
        'usermanagement': 'UserManagement.html', // Added for completeness, if it exists
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
    const returnButton = document.querySelector('.return-button');

    if (returnButton) {
        returnButton.addEventListener('click', function() {
            const targetPage = 'PendingAccount.html';
            logUserAction('NAVIGATION', `User clicked RETURN button, redirecting to ${targetPage}.`);
            window.location.href = targetPage;
        });
    }
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
    // const postalCodeInput = document.getElementById('postalCode'); // Field not in HTML, excluding reference
    const streetAddressInput = document.getElementById('streetAddress');
    const phoneNumberInput = document.getElementById('phoneNumber');
    // const emailInput = document.getElementById('email'); // Field not in HTML, excluding reference
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
    const saveButton = form ? form.querySelector('.form-actions-bottom button[type="submit"]') : null; 

    // --- Asynchronous Function to Fetch and Populate Select ---
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

            const response = await fetch('PHP/pendingaccountviewselectdatafetcher_handler.php', {
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
            // NOTE: Using the date string directly might be subject to timezone issues
            // but for simple date arithmetic (adding days), it's generally fine
            // if the original date is treated as a local/midnight date.
            const startDate = new Date(startDateString);
            
            // Normalize the time to ensure correct date arithmetic
            startDate.setHours(0, 0, 0, 0); 

            // Add 100 days to the start date
            // Create a *new* date for the end date calculation to avoid modifying the original
            const endDateObj = new Date(startDate.getTime());
            endDateObj.setDate(endDateObj.getDate() + daysToAdd);
            
            // Format the new date as YYYY-MM-DD for the input field
            const year = endDateObj.getFullYear();
            const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
            const day = String(endDateObj.getDate()).padStart(2, '0');
            
            endDate = `${year}-${month}-${day}`;
        }

        durationOfLoanInput.value = `${daysToAdd} days`;
        dateEndInput.value = endDate;
    };

    // --- Event Listeners for dynamic fields ---
    if (dateStartInput) {
        dateStartInput.addEventListener('change', updateLoanDetails);
    } 

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
        // postalCodeInput.value = data.postal_code || ''; // Field not in HTML
        streetAddressInput.value = data.street_address || '';
        phoneNumberInput.value = data.phone_number || '';
        // emailInput.value = data.email || ''; // Field not in HTML
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
            validIdTypeSelect.innerHTML = '<option value="">Select...</option>';
        }

        // Guarantor Information
        guarantorLastNameInput.value = data.guarantor_last_name || '';
        guarantorFirstNameInput.value = data.guarantor_first_name || '';
        guarantorMiddleNameInput.value = data.guarantor_middle_name || '';
        guarantorStreetAddressInput.value = data.guarantor_street_address || '';
        guarantorPhoneNumberInput.value = data.guarantor_phone_number || '';

        // Loan Details
        // Ensure loan_amount is a string for the select value
        loanAmountSelect.value = data.loan_amount ? parseFloat(data.loan_amount).toString() : ''; 
        paymentFrequencySelect.value = data.payment_frequency || '';
        dateStartInput.value = data.date_start || '';
        durationOfLoanInput.value = data.duration_of_loan || ''; // Keep existing value if available
        dateEndInput.value = data.date_end || ''; // Keep existing value if available
        
        // Final check for loan calculation (in case data.date_start changed/was null)
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
                // Log failure to view
                logUserAction('VIEW_FAILED', `Failed to load pending account data for Client ID: ${clientId}. Server error: ${data.error}.`, 'clients, etc.', clientId, 'N/A', data.error);
            } else if (data.success && data.data) {
                showMessage('Client data loaded successfully!', 'success');
                await populateForm(data.data);
                // Log successful view
                logUserAction('VIEWED', `Successfully loaded pending account details for Client ID: ${clientId}.`, 'clients, etc.', clientId);
            } else {
                showMessage('Failed to load client data. Unknown error.', 'error');
                // Log unknown failure to view
                logUserAction('VIEW_FAILED', `Unknown error loading pending account data for Client ID: ${clientId}.`, 'clients, etc.', clientId, 'N/A', 'Unknown Error');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            showMessage('Failed to connect to the server for data retrieval.', 'error');
            // Log network failure to view
            logUserAction('NETWORK_ERROR', `Network error during load attempt for Client ID: ${clientId}.`, 'clients, etc.', clientId, 'N/A', `Network connection failed: ${error.message}`);
        }
    };

/*=============================================================================================================================================================================*/
    /**
     * Handles the form submission: shows 'Saving...' on the button and displays the message box.
     */
    const handleFormSubmission = () => {
        if (!form || !saveButton) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // 1. Set Button State to SAVING
            const originalButtonText = saveButton.textContent;
            saveButton.textContent = 'Saving...';
            saveButton.disabled = true;
            
            // 2. Show 'Saving...' Message Box
            showMessage('Saving changes...', 'info');

            const formData = new FormData(form);
            const clientId = clientIdInput.value; 
            
            if (clientId) {
                formData.append('client_id', clientId); 
            } else {
                showMessage('Error: Client ID is missing from form. Cannot save.', 'error');
                saveButton.textContent = originalButtonText;
                saveButton.disabled = false;
                // Log fatal submission error
                logUserAction('UPDATE_FAILED_FATAL', 'Submission blocked: Client ID missing from form.', 'clients, etc.', 'N/A', 'N/A', 'Client ID Missing');
                return;
            }

            // Explicitly include unchecked checkboxes for PHP logic
            if (!barangayClearanceCheck.checked) {
                formData.append('barangayClearanceCheck', 'off');
            }
            if (!hasValidIdCheck.checked) {
                formData.append('hasValidIdCheck', 'off');
            }
            // Add placeholders for fields in PHP but not HTML to prevent PHP notices/errors
            // if the PHP code is not updated to remove them.
            if (!formData.has('postalCode')) formData.append('postalCode', '');
            if (!formData.has('email')) formData.append('email', '');


            try {
                // STEP A: Perform the database update
                const response = await fetch('PHP/pendingaccountviewupdate_handler.php', {
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
                    
                    // Optional: Re-fetch data to reflect latest changes (e.g., if any calculations were server-side)
                    // fetchPendingAccountData(clientId); 
                    
                } else {
                    // STEP B: Database update failed. Log the failure.
                    showMessage(result.error || 'Failed to save changes. Please try again.', 'error');
                    
                    // --- AUDIT TRAIL: Log Failure ---
                    const actionType = 'UPDATE_FAILED';
                    const description = `Failed to save pending account details for Client ID: ${clientId}. Server error: ${result.error || 'Unknown'}.`;
                    logUserAction(
                        actionType, 
                        description, 
                        'clients, etc.', 
                        clientId, 
                        result.audit_data?.before_state || 'N/A', 
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
            // Log missing ID
            logUserAction('LOAD_FAILED_FATAL', 'Page loaded without a Client ID in the URL.', 'clients, etc.', 'N/A', 'N/A', 'Client ID Missing in URL');
        }

        // Set up the form submission listener
        handleFormSubmission();
    };

    // Run the main function when the DOM is ready (already in a DOMContentLoaded block)
    main();

}); // End of main DOMContentLoaded