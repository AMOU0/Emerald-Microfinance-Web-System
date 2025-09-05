document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            
            // NOTE: Keep links pointing to .php if you want server-side security, 
            // otherwise keep them as .html.
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
    logoutButton.addEventListener('click', function() {
        // Redirect to the PHP script that handles session destruction
        window.location.href = 'PHP/check_logout.php'; 
    });

/*=============================================================================================================================================================================*/
    // Function to get a URL query parameter by name
    const getQueryParam = (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    };

    // Function to populate the form with fetched data
    const populateForm = (data) => {
        if (!data) return;

        // Personal Information
        document.getElementById('lastName').value = data.last_name || '';
        document.getElementById('firstName').value = data.first_name || '';
        document.getElementById('middleName').value = data.middle_name || '';
        document.getElementById('maritalStatus').value = data.marital_status || '';
        document.getElementById('gender').value = data.gender || '';
        document.getElementById('dateOfBirth').value = data.date_of_birth || '';
        document.getElementById('city').value = data.city || '';
        document.getElementById('barangay').value = data.barangay || '';
        document.getElementById('postalCode').value = data.postal_code || '';
        document.getElementById('streetAddress').value = data.street_address || '';
        document.getElementById('phoneNumber').value = data.phone_number || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('employmentStatus').value = data.employment_status || '';
        document.getElementById('occupationPosition').value = data.occupation || '';
        document.getElementById('yearsInJob').value = data.years_in_job || '';
        document.getElementById('incomeSalary').value = data.income || '';
        document.getElementById('cr').value = data.collateral || '';

        // Checkbox fields
        document.getElementById('barangayClearance').checked = data.has_barangay_clearance == 1;
        document.getElementById('validId').checked = data.has_valid_id == 1;

        // Guarantor Information
        document.getElementById('guarantorLastName').value = data.guarantor_last_name || '';
        document.getElementById('guarantorFirstName').value = data.guarantor_first_name || '';
        document.getElementById('guarantorMiddleName').value = data.guarantor_middle_name || '';
        document.getElementById('guarantorStreetAddress').value = data.guarantor_street_address || '';
        document.getElementById('guarantorPhoneNumber').value = data.guarantor_phone_number || '';

        // Loan Details
        const loanAmountSelect = document.getElementById('loan-amount');
        if (loanAmountSelect && data.loan_amount) {
            loanAmountSelect.value = String(data.loan_amount);
        }
        document.getElementById('payment-frequency').value = data.payment_frequency || '';
        document.getElementById('date-start').value = data.date_start || '';
        document.getElementById('duration-of-loan').value = data.duration_of_loan || '';
        document.getElementById('date-end').value = data.date_end || '';
    };

    // Get the client ID from the URL
    const clientId = getQueryParam('id');

    if (clientId) {
        // Populate the hidden input field with the ID
        clientIdInput.value = clientId;

        // Fetch data from the PHP script to populate the form
        fetch(`PHP/pendingaccountview_handler.php?id=${clientId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    console.error('Server error:', data.error);
                    alert(data.error);
                } else {
                    populateForm(data);
                }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                alert('Failed to load client data. Please try again.');
            });
    } else {
        console.warn('No client ID found in the URL. Cannot load data.');
        alert('No client ID found in the URL. Please return to the previous page and select a client.');
    }
    
    /*================================ */
    // Select the button using a more specific CSS selector to avoid conflicts.
    const saveButton = document.querySelector('.form-actions-bottom button[type="submit"]');

    // Check if the button was successfully found on the page.
    if (saveButton) {
        // Add a click event listener to the button.
        saveButton.addEventListener('click', (event) => {
            // Prevent the default form submission behavior, which would cause a page reload.
            event.preventDefault();

            // Check for form validity before submitting
            const form = document.getElementById('pendingAccountForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // --- Start of "Saving" UI feedback ---

            // Disable the button to prevent multiple clicks while the action is in progress.
            saveButton.disabled = true;

            // Change the button text to provide a visual cue to the user.
            saveButton.textContent = 'Saving...';

            // Use FormData to get all form inputs automatically
            const formData = new FormData(form);

            // Send the data to the PHP handler using fetch API
            fetch('PHP/updatependingaccount_handler.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    console.log(result.success);
                    alert('Client data updated successfully!');
                } else if (result.error) {
                    console.error('Server error:', result.error);
                    alert('Failed to update client data: ' + result.error);
                }
            })
            .catch(error => {
                console.error('There was a problem with the update operation:', error);
                alert('Failed to update client data. Please check your connection and try again.');
            })
            .finally(() => {
                // Re-enable and reset the button state, regardless of success or failure.
                saveButton.disabled = false;
                saveButton.textContent = 'Save Changes';
            });
        });
    } else {
        // Log a message if the button element was not found.
        console.error('Could not find the "Save Changes" button. Please check the HTML selector.');
    }
});
