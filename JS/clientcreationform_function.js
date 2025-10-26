document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    // Ensure the keys here match the text content of your <a> tags exactly.
    const accessRules = {
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
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
            enforceRoleAccess(['admin','Loan_Officer']); 
        });
/*=============================================================================*/

document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    // ----------------------------------------------------------------------
    // --- GLOBAL UTILITY FUNCTIONS (Defined once at the highest scope) ---
    // ----------------------------------------------------------------------

    /** * Logs a user action to the audit trail.
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
            
            const response = await fetch('PHP/clientcreationselectdatafetcher_handler.php', {
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
    
    /**
     * Checks if a client with the same full name (LName, FName, MName) already exists.
     * @param {object} data - Client data containing name parts.
     * @returns {Promise<boolean>} - True if a duplicate is found, false otherwise.
     */
    async function checkDuplicateClient(data) {
        try {
            const checkData = {
                lastName: data.lastName,
                firstName: data.firstName,
                middleName: data.middleName
                // Date of Birth is intentionally excluded to check only by name
            };

            const response = await fetch('PHP/clientcreationform_handler.php?checkName=true', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkData)
            });

            const result = await response.json();
            
            if (result.duplicate) {
                return true; 
            } else {
                return false;
            }

        } catch (error) {
            console.error('Duplicate check failed:', error);
            alert('Warning: Name duplicate check failed due to a network error. Proceeding with creation.');
            return false; 
        }
    }


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
                const actionType = 'NAVIGATION'; 
                const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;
                logUserAction(actionType, description);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
                
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

        // Data preparation (needed for validation and duplicate check)
        const formData = new FormData(clientCreationForm);
        const data = Object.fromEntries(formData.entries());
        
        // Get values for new validation checks
        const yearsInJob = data.yearsInJob ? data.yearsInJob.trim() : ''; 

        // 1. Validation checks...

        // 🛑 NAME FIELDS CONSTRAINT CHECK (Letters and Spaces only) 🛑
        const nameFields = [
            { name: 'Last Name', value: data.lastName, id: 'lastName' },
            { name: 'First Name', value: data.firstName, id: 'firstName' },
            { name: 'Middle Name', value: data.middleName, id: 'middleName' }
        ];
        // Regex allows uppercase letters (A-Z), lowercase letters (a-z), and spaces (\s)
        const nameRegex = /^[A-Za-z\s]+$/;

        for (const field of nameFields) {
            if (field.value.trim() === '') continue; 
            
            if (!nameRegex.test(field.value)) {
                alert(`Error: ${field.name} must contain only letters and spaces.`);
                document.getElementById(field.id).focus();
                
                const description = `FAILED: Client creation failed due to invalid characters in ${field.name} field.`;
                logUserAction(actionType, description);
                return;
            }
        }
        // 🛑 END NAME FIELDS CONSTRAINT CHECK 🛑
        
        // Age validation
        if (!validateAge(dateOfBirth)) {
            alert('Client must be at least 18 years old to create an account.');
            dateOfBirthInput.focus();
            
            const description = 'FAILED: Client creation failed due to age validation (under 18).';
            logUserAction(actionType, description);
            return; 
        }

        // Phone Number validation
        if (phoneNumber.length !== 11) {
            alert('Phone Number must be exactly 11 digits (e.g., 09xxxxxxxxx).');
            phoneNumberInput.focus();
            
            const description = 'FAILED: Client creation failed due to invalid phone number length.';
            logUserAction(actionType, description);
            return; 
        }
        
        // 🛑 YEARS IN JOB FORMAT CHECK 🛑
        if (yearsInJob !== '') {
            
            // Regex for flexible "X year(s), Y month(s)" format.
            const durationRegex = /^\s*(?:(\d+)\s*year(s)?\s*(?:,\s*)?|(\d+)\s*year(s)?\s*)?\s*(?:(\d+)\s*month(s)?)?\s*$/i;

            const match = yearsInJob.match(durationRegex);
            
            // Check if format is invalid or if it contains text but no numbers were captured
            if (!match || (!match[1] && !match[3] && !match[4])) {
                alert('Error: "Years in Job" must be in the format "X year(s), Y month(s)". Only use whole numbers. Examples: "1 year, 6 months", "3 years", or "9 months".');
                document.getElementById('yearsInJob').focus();
                
                const description = 'FAILED: Client creation failed due to invalid Years in Job format.';
                logUserAction(actionType, description);
                return;
            }
            
            if (yearsInJob.length > 50) {
                alert('Error: "Years in Job" input is too long.');
                document.getElementById('yearsInJob').focus();
                
                const description = 'FAILED: Client creation failed due to excessively long Years in Job input.';
                logUserAction(actionType, description);
                return;
            }
        }
        // 🛑 END YEARS IN JOB CHECK 🛑


        // Requirements check
        if (!hasValidIdCheck.checked && !barangayClearanceCheck.checked) {
            alert('A client must provide at least one of the requirements (Valid ID or Barangay Clearance).'); 
            
            const description = 'FAILED: Client creation failed due to missing required documents (Valid ID or Barangay Clearance).';
            logUserAction(actionType, description);
            return; 
        }
        
        // 2. Button state change and data finalization
        createButton.disabled = true;
        createButton.textContent = 'Creating...';

        data.hasBarangayClearance = barangayClearanceCheck.checked ? 1 : 0;
        data.hasValidId = hasValidIdCheck.checked ? 1 : 0;
        data.validIdType = hasValidIdCheck.checked ? validIdTypeSelect.value : null;

        // Clean up temporary form fields not needed for the PHP handler
        delete data.validId;
        delete data.barangayClearance;
        
        // 3. DUPLICATE NAME CHECK (LName, FName, MName only)
        const isDuplicate = await checkDuplicateClient(data);
        
        if (isDuplicate) {
            alert('Error: A client with the same Last Name, First Name, and Middle Name already exists in the system. Duplicates are not allowed.');
            
            const description = 'FAILED: Client creation blocked due to duplicate name.';
            logUserAction(actionType, description);

            createButton.disabled = false;
            createButton.textContent = 'Create';
            return; // STOP EXECUTION
        }


        // 4. Final Submission
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