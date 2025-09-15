document.addEventListener('DOMContentLoaded', function() {
    // This block handles sidebar navigation and logout functionality.
    
    // Call the session check function as soon as the page loads.
    // checkSessionAndRedirect(); // Assuming this function is globally available from JS/enforce_login.js

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
        window.location.href = 'PHP/check_logout.php'; 
    });

    console.log("Navigation initialized.");
});
/*=============================================================================================================================================================================*/document.addEventListener('DOMContentLoaded', () => {
    // This block handles dropdown fetching, dependencies, and the FINAL form submission (fetch).

    // Re-reference required elements for scope
    const clientCreationForm = document.getElementById('clientCreationForm');
    const dateOfBirthInput = document.getElementById('dateOfBirth');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const barangayClearanceCheck = document.getElementById('barangayClearanceCheck');
    const hasValidIdCheck = document.getElementById('hasValidIdCheck');
    const validIdTypeSelect = document.getElementById('validIdType');
    const createButton = document.getElementById('create-button');
    
    // Re-reference/Re-declare all other dropdown elements if their event listeners are here
    const maritalStatusSelect = document.getElementById('maritalStatus');
    const genderSelect = document.getElementById('gender');
    const citySelect = document.getElementById('city');
    const barangaySelect = document.getElementById('barangay');
    const incomeSalarySelect = document.getElementById('incomeSalary');
    
    // --- VALIDATION AND FETCHING LOGIC ---

    // Define the Age Validation function within this scope
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
    
    // Async function to fetch data and populate select elements (kept for completeness)
    const fetchAndPopulateSelect = async (element, endpoint, params = {}) => {
        // ... (Your existing fetchAndPopulateSelect function code) ...
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

    // Initial population calls (kept for completeness)
    fetchAndPopulateSelect(maritalStatusSelect, 'maritalStatus');
    fetchAndPopulateSelect(genderSelect, 'gender');
    fetchAndPopulateSelect(citySelect, 'city');
    fetchAndPopulateSelect(incomeSalarySelect, 'incomeSalary');
    fetchAndPopulateSelect(validIdTypeSelect, 'validId');

    // Event listener for city/barangay dependency (kept for completeness)
    citySelect.addEventListener('change', () => {
        const selectedCity = citySelect.value;
        if (selectedCity) {
            fetchAndPopulateSelect(barangaySelect, 'barangay', { city: selectedCity });
        } else {
            barangaySelect.innerHTML = '<option value="">Select a City first</option>';
            barangaySelect.disabled = true;
        }
    });
    
    // Disable valid ID select unless checkbox is checked (kept for completeness)
    validIdTypeSelect.disabled = !hasValidIdCheck.checked;
    hasValidIdCheck.addEventListener('change', () => {
        validIdTypeSelect.disabled = !hasValidIdCheck.checked;
        if (!hasValidIdCheck.checked) {
            validIdTypeSelect.value = ''; 
        }
    });
    
    // ✅ NEW: Function to show a temporary notification
    function showTemporaryNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'temporary-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000); // 3 seconds
    }


    // --- FORM SUBMISSION HANDLER (The Block with the fix) ---
    clientCreationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dateOfBirth = dateOfBirthInput.value;
        const phoneNumber = phoneNumberInput.value ? phoneNumberInput.value.trim() : '';

        // 1. AGE VALIDATION (The critical check) 🛑
        if (!validateAge(dateOfBirth)) {
            alert('Client must be at least 18 years old to create an account.');
            dateOfBirthInput.focus();
            return; // Stops execution if client is underage
        }

        // 2. PHONE NUMBER LENGTH CHECK 📱
        if (phoneNumber.length !== 11) {
            alert('Phone Number must be exactly 11 digits (e.g., 09xxxxxxxxx).');
            phoneNumberInput.focus();
            return; // Stops execution if phone number is wrong length
        }

        // 3. REQUIREMENTS VALIDATION 📋
        if (!hasValidIdCheck.checked && !barangayClearanceCheck.checked) {
            alert('A client must provide at least one of the requirements (Valid ID or Barangay Clearance).'); 
            return; // Stops execution if no requirement is met
        }
        
        // --- If all validations pass, PROCEED TO SUBMISSION ---

        const formData = new FormData(clientCreationForm);
        const data = Object.fromEntries(formData.entries());

        createButton.disabled = true;
        createButton.textContent = 'Creating...';

        // Prepare data for server
        data.hasBarangayClearance = barangayClearanceCheck.checked ? 1 : 0;
        data.hasValidId = hasValidIdCheck.checked ? 1 : 0;
        data.validIdType = hasValidIdCheck.checked ? validIdTypeSelect.value : null;

        // Cleanup temporary form data entries
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
                // ✅ MODIFIED: Replaced alert with a temporary notification
                showTemporaryNotification('Client created successfully! Client ID: ' + result.clientId); 
                clientCreationForm.reset();
            } else {
                alert(`Client creation failed: ${result.message}`); 
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            alert('An unexpected error occurred during submission.'); 
        } finally {
            createButton.disabled = false;
            createButton.textContent = 'Create';
        }
    });
    
    console.log("Form fetch handler initialized.");
});