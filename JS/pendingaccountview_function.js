document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Prevent the default link behavior
            event.preventDefault(); 
            // Remove 'active' class from all links
            navLinks.forEach(nav => nav.classList.remove('active'));
            // Add 'active' class to the clicked link
            this.classList.add('active');

            // Get the text from the link
            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            // Define the URL based on the link's text
            const urlMapping = {
                'dashboard': 'Dashboard.html',
                'clientcreation': 'ClientCreationForm.html',
                'loanapplication': 'LoanApplication.html',
                'pendingaccounts': 'PendingAccount.html',
                'accountsreceivable': 'AccountsReceivable.html',
                'ledger': 'Ledgers.html',
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

/*================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Function to get a URL query parameter by name
    const getQueryParam = (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    };

    // Get the client ID from the URL
    const clientId = getQueryParam('id');

    if (clientId) {
        // Fetch data from the new PHP script
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
        document.getElementById('loan-amount').value = data.loan_amount || '';
        document.getElementById('payment-frequency').value = data.payment_frequency || '';
        document.getElementById('date-start').value = data.date_start || '';
        document.getElementById('duration-of-loan').value = data.duration_of_loan || '';
        document.getElementById('date-end').value = data.date_end || '';
    };
});