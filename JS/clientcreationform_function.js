document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Prevent the default link behavior
            event.preventDefault(); 
            // Get the text from the link
            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            // Define the URL based on the link's text
            const urlMapping = {
                'dashboard': 'Dashboard.html',
                'clientcreation': 'ClientCreationForm.html',
                'pendingaccounts': 'PendingAccount.html',
                'accountsreceivable': 'AccountsReceivable.html',
                'ledger': 'Ledgers.html',
                'amortizationcalculator': 'AmortizationCalculator.html',
                'reports': 'Reports.html',
                'usermanagement': 'UserManagement.html',
                'tools': 'Tools.html'
            };

            // Navigate to the correct page
            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button separately
    logoutButton.addEventListener('click', function() {
        // You would typically handle a logout process here (e.g., clearing session data)
        window.location.href = 'login.html'; // Redirect to the login page
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const createButton = document.querySelector('.create-button');
    const mainContent = document.querySelector('.main-content');

    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #333;
        color: white;
        padding: 15px;
        border-radius: 8px;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: sans-serif;
    `;
    document.body.appendChild(messageBox);


    function showMessage(message, isError = false) {
        messageBox.textContent = message;
        messageBox.style.backgroundColor = isError ? '#d9534f' : '#5cb85c';
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    createButton.addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent the default form submission

        // Create a FormData object to easily collect all form data
        const formData = new FormData();

        // Personal Information
        formData.append('lastName', document.getElementById('lastName').value);
        formData.append('firstName', document.getElementById('firstName').value);
        formData.append('middleName', document.getElementById('middleName').value);
        formData.append('maritalStatus', document.getElementById('maritalStatus').value);
        formData.append('gender', document.getElementById('gender').value);
        formData.append('dateOfBirth', document.getElementById('dateOfBirth').value);
        formData.append('city', document.getElementById('city').value);
        formData.append('barangay', document.getElementById('barangay').value);
        formData.append('postalCode', document.getElementById('postalCode').value);
        formData.append('streetAddress', document.getElementById('streetAddress').value);
        formData.append('phoneNumber', document.getElementById('phoneNumber').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('employmentStatus', document.getElementById('employmentStatus').value);
        formData.append('occupationPosition', document.getElementById('occupationPosition').value);
        formData.append('yearsInJob', document.getElementById('yearsInJob').value);
        formData.append('incomeSalary', document.getElementById('incomeSalary').value);

        // Guarantor Information
        formData.append('guarantorLastName', document.getElementById('guarantorLastName').value);
        formData.append('guarantorFirstName', document.getElementById('guarantorFirstName').value);
        formData.append('guarantorMiddleName', document.getElementById('guarantorMiddleName').value);
        formData.append('guarantorMaritalStatus', document.getElementById('guarantorMaritalStatus').value);
        formData.append('guarantorGender', document.getElementById('guarantorGender').value);
        formData.append('guarantorDateOfBirth', document.getElementById('guarantorDateOfBirth').value);
        formData.append('guarantorCity', document.getElementById('guarantorCity').value);
        formData.append('guarantorBarangay', document.getElementById('guarantorBarangay').value);
        formData.append('guarantorPostalCode', document.getElementById('guarantorPostalCode').value);
        formData.append('guarantorStreetAddress', document.getElementById('guarantorStreetAddress').value);
        formData.append('guarantorPhoneNumber', document.getElementById('guarantorPhoneNumber').value);
        formData.append('guarantorEmail', document.getElementById('guarantorEmail').value);
        formData.append('guarantorEmploymentStatus', document.getElementById('guarantorEmploymentStatus').value);
        formData.append('guarantorOccupationPosition', document.getElementById('guarantorOccupationPosition').value);
        formData.append('guarantorYearsInJob', document.getElementById('guarantorYearsInJob').value);
        formData.append('guarantorIncomeSalary', document.getElementById('guarantorIncomeSalary').value);

        // Client Requirements (using checkbox states, as the form doesn't have file inputs)
        // Note: For a production application, you would need to add file input fields to handle image uploads.
        formData.append('validId', document.getElementById('validId').checked ? '1' : '0');
        formData.append('idNumber', document.getElementById('idNumber').value);
        formData.append('barangayClearance', document.getElementById('barangayClearance').checked ? '1' : '0');
        formData.append('collateral', document.getElementById('collateral').value);
        formData.append('cr', document.getElementById('cr').checked ? '1' : '0');

        // Client Action Plan
        formData.append('loanAmount', document.getElementById('loanAmount').value);
        formData.append('interestRate', document.getElementById('interestRate').value);
        formData.append('paymentFrequency', document.getElementById('paymentFrequency').value);
        formData.append('startDate', document.getElementById('startDate').value);
        formData.append('durationOfPayment', document.getElementById('durationOfPayment').value);

        // Simple validation
        if (!formData.get('lastName') || !formData.get('firstName') || !formData.get('loanAmount')) {
            showMessage('Please fill out all required fields.', true);
            return;
        }

        try {
            // Display a loading indicator
            createButton.textContent = 'Creating...';
            createButton.disabled = true;

            const response = await fetch('PHP/clientcreationform_handler.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showMessage('Client created successfully!');
                // You can clear the form here if needed
                // document.getElementById('your-form-id').reset();
            } else {
                showMessage(`Error: ${result.message}`, true);
            }
        } catch (error) {
            showMessage('An unexpected error occurred. Please try again.', true);
            console.error('Fetch error:', error);
        } finally {
            createButton.textContent = 'Create';
            createButton.disabled = false;
        }
    });
});
