document.addEventListener('DOMContentLoaded', function() {
    checkSessionAndRedirect(); 

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

    logoutButton.addEventListener('click', function() {
        window.location.href = 'PHP/check_logout.php'; 
    });
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
    const startDate = dateStartInput.value;
    const frequency = paymentFrequencySelect.value;
    let duration = '';
    let endDate = '';

    if (startDate && frequency) {
        const date = new Date(startDate);
        date.setHours(0, 0, 0, 0); 
        let daysToAdd = 0;

        switch (frequency) {
            case 'daily':
                daysToAdd = 90; 
                duration = `${daysToAdd} days`;
                date.setDate(date.getDate() + daysToAdd);
                break;
            case 'weekly':
                daysToAdd = 12 * 7; 
                duration = `12 weeks`;
                date.setDate(date.getDate() + daysToAdd);
                break;
            case 'monthly':
                let monthsToAdd = 6; 
                duration = `${monthsToAdd} months`;
                date.setMonth(date.getMonth() + monthsToAdd); 
                break;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        endDate = `${year}-${month}-${day}`;
    }

    durationOfLoanInput.value = duration;
    dateEndInput.value = endDate;
};

// --- Event Listeners for dynamic fields ---
if (dateStartInput && paymentFrequencySelect) {
    dateStartInput.addEventListener('change', updateLoanDetails);
    paymentFrequencySelect.addEventListener('change', updateLoanDetails);
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
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // 1. Set Button State to SAVING
        const originalButtonText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
        
        // 2. Show 'Saving...' Message Box
        showMessage('Saving changes...', 'info');

        const formData = new FormData(form);
        
        // Explicitly include unchecked checkboxes for PHP logic
        if (!barangayClearanceCheck.checked) {
             formData.append('barangayClearanceCheck', 'off');
        }
        if (!hasValidIdCheck.checked) {
             formData.append('hasValidIdCheck', 'off');
        }

        try {
            const response = await fetch('PHP/pendingaccountupdate_handler.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success');
            } else {
                showMessage(result.error || 'Failed to save changes. Please try again.', 'error');
                console.error('Submission Error:', result.error);
            }
        } catch (error) {
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