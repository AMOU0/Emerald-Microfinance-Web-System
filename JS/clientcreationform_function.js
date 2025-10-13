document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    // ----------------------------------------------------------------------
    // --- GLOBAL UTILITY FUNCTIONS (Defined once at the highest scope) ---
    // ----------------------------------------------------------------------

    /**
     * Logs a user action to the audit trail.
     * @param {string} actionType - The primary action type (e.g., 'CREATED', 'NAVIGATION').
     * @param {string} description - The detailed description of the action.
     * @param {string|null} targetTable - The table affected (e.g., 'clients').
     * @param {string|null} targetId - The ID of the row affected.
     */
    function logUserAction(actionType, description, targetTable = null, targetId = null) {
        const bodyData = new URLSearchParams();
        bodyData.append('action', actionType); // Primary action type
        bodyData.append('description', description); // Detailed description
        
        // Include optional audit trail details
        if (targetTable) bodyData.append('target_table', targetTable);
        if (targetId) bodyData.append('target_id', targetId);

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

    // Function to show a temporary notification
    function showTemporaryNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'temporary-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000); // 3 seconds
    }
    
    // Define the Age Validation function
    function validateAge(dobString) {
        if (!dobString) return false;
        const birthDate = new Date(dobString);
        const today = new Date();
        const requiredAgeDate = new Date(
            today.getFullYear() - 18, 
            today.getMonth(), 
            today.getDate()
        );
        return birthDate <= requiredAgeDate;
    }

    // Async function to fetch data and populate select elements
    const fetchAndPopulateSelect = async (element, endpoint, params = {}) => {
        try {
            element.disabled = true;
            element.innerHTML = '<option>Loading...</option>';

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
                alert(`Error: ${data.error}`); 
                return;
            }

            element.innerHTML = '<option value="">Select...</option>';
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                element.appendChild(option);
            });

        } catch (error) {
            console.error('Fetch error:', error);
            alert('Failed to load data. Please check the server connection or console.'); 
        } finally {
            element.disabled = false;
        }
    };


    // --------------------------------------------------------------
    // 2. NAVIGATION AND LOGOUT HANDLERS
    // --------------------------------------------------------------

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
                // 1. Define clear action type and description for the log
                const actionType = 'NAVIGATION'; // Use the fixed type for filtering
                const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

                // 2. ASYNCHRONOUS AUDIT LOG: Log the action.
                logUserAction(actionType, description);

                // 3. Perform the page redirect immediately after initiating the log.
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
                
                // Log the failed navigation attempt
                const actionType = 'NAVIGATION_FAILED';
                const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });

    // Handle the logout button securely
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.location.href = 'PHP/check_logout.php'; 
        });
    }

    // --------------------------------------------------------------
    // 3. CLIENT CREATION FORM HANDLERS
    // --------------------------------------------------------------

    const clientCreationForm = document.getElementById('clientCreationForm');
    const dateOfBirthInput = document.getElementById('dateOfBirth');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const barangayClearanceCheck = document.getElementById('barangayClearanceCheck');
    const hasValidIdCheck = document.getElementById('hasValidIdCheck');
    const validIdTypeSelect = document.getElementById('validIdType');
    const createButton = document.getElementById('create-button');
    
    // Dropdown elements
    const maritalStatusSelect = document.getElementById('maritalStatus');
    const genderSelect = document.getElementById('gender');
    const citySelect = document.getElementById('city');
    const barangaySelect = document.getElementById('barangay');
    const incomeSalarySelect = document.getElementById('incomeSalary');
    
    // Initial population calls
    fetchAndPopulateSelect(maritalStatusSelect, 'maritalStatus');
    fetchAndPopulateSelect(genderSelect, 'gender');
    fetchAndPopulateSelect(citySelect, 'city');
    fetchAndPopulateSelect(incomeSalarySelect, 'incomeSalary');
    fetchAndPopulateSelect(validIdTypeSelect, 'validId');

    // Event listener for city/barangay dependency
    citySelect.addEventListener('change', () => {
        const selectedCity = citySelect.value;
        if (selectedCity) {
            fetchAndPopulateSelect(barangaySelect, 'barangay', { city: selectedCity });
        } else {
            barangaySelect.innerHTML = '<option value="">Select a City first</option>';
            barangaySelect.disabled = true;
        }
    });
    
    // Disable valid ID select unless checkbox is checked
    validIdTypeSelect.disabled = !hasValidIdCheck.checked;
    hasValidIdCheck.addEventListener('change', () => {
        validIdTypeSelect.disabled = !hasValidIdCheck.checked;
        if (!hasValidIdCheck.checked) {
            validIdTypeSelect.value = ''; 
        }
    });
    
    // --- FINAL FORM SUBMISSION HANDLER ---
    clientCreationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dateOfBirth = dateOfBirthInput.value;
        const phoneNumber = phoneNumberInput.value ? phoneNumberInput.value.trim() : '';
        const actionType = 'CREATED'; // Unified action type for all attempts

        // Validation checks...
        if (!validateAge(dateOfBirth)) {
            alert('Client must be at least 18 years old to create an account.');
            dateOfBirthInput.focus();
            
            // ✅ MODIFIED VALIDATION FAIL LOG
            const description = 'FAILED: Client creation failed due to age validation (under 18).';
            logUserAction(actionType, description);
            return; 
        }

        if (phoneNumber.length !== 11) {
            alert('Phone Number must be exactly 11 digits (e.g., 09xxxxxxxxx).');
            phoneNumberInput.focus();
            
            // ✅ MODIFIED VALIDATION FAIL LOG
            const description = 'FAILED: Client creation failed due to invalid phone number length.';
            logUserAction(actionType, description);
            return; 
        }

        if (!hasValidIdCheck.checked && !barangayClearanceCheck.checked) {
            alert('A client must provide at least one of the requirements (Valid ID or Barangay Clearance).'); 
            
            // ✅ MODIFIED VALIDATION FAIL LOG
            const description = 'FAILED: Client creation failed due to missing required documents (Valid ID or Barangay Clearance).';
            logUserAction(actionType, description);
            return; 
        }
        
        // Data preparation...
        const formData = new FormData(clientCreationForm);
        const data = Object.fromEntries(formData.entries());

        createButton.disabled = true;
        createButton.textContent = 'Creating...';

        data.hasBarangayClearance = barangayClearanceCheck.checked ? 1 : 0;
        data.hasValidId = hasValidIdCheck.checked ? 1 : 0;
        data.validIdType = hasValidIdCheck.checked ? validIdTypeSelect.value : null;

        // Clean up temporary form fields not needed for the PHP handler
        delete data.validId;
        delete data.barangayClearance;
        
        try {
            const response = await fetch('PHP/clientcreationform_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const clientId = result.clientId; // Get the newly created ID
                
                // Success Log
                const description = `SUCCESS: Client created with ID: ${clientId}`;
                logUserAction(actionType, description, 'clients', clientId); 

                showTemporaryNotification('Client created successfully! Client ID: ' + clientId); 
                clientCreationForm.reset();
            } else {
                // Server Failure Log
                const description = `FAILED: Server error during client creation. Message: ${result.message}`;
                logUserAction(actionType, description);
                alert(`Client creation failed: ${result.message}`); 
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            // Network Failure Log
            const description = `FAILED: Network error or unexpected server response during client creation.`;
            logUserAction(actionType, description);
            alert('An unexpected error occurred during submission.'); 
        } finally {
            createButton.disabled = false;
            createButton.textContent = 'Create';
        }
    });
    
    console.log("Form fetch handler initialized.");
});