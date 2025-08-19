document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
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

            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    logoutButton.addEventListener('click', function() {
        window.location.href = 'login.html'; 
    });

    const startDateInput = document.getElementById('date-start');
    const endDateInput = document.getElementById('date-end');
    const clearButton = document.querySelector('.clear-button');
    const applyButton = document.querySelector('.apply-button');
    const form = document.querySelector('.loan-application-container');

    // Automatically set the end date 100 days from the start date
    startDateInput.addEventListener('change', function() {
        if (this.value) {
            const startDate = new Date(this.value);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 100);

            // Format the date as YYYY-MM-DD
            const formattedEndDate = endDate.toISOString().split('T')[0];
            endDateInput.value = formattedEndDate;
        } else {
            endDateInput.value = '';
        }
    });

    // Handle the "Clear" button
    clearButton.addEventListener('click', function() {
        form.reset(); 
        endDateInput.value = ''; 
    });

    // Handle the "Apply" button and form submission
    applyButton.addEventListener('click', function(event) {
        event.preventDefault(); 

        // Correctly gather all input data manually
const data = {
    guarantorLastName: document.getElementById('guarantorLastName').value,
    guarantorFirstName: document.getElementById('guarantorFirstName').value,
    guarantorMiddleName: document.getElementById('guarantorMiddleName').value,
    guarantorStreetAddress: document.getElementById('guarantorStreetAddress').value,
    guarantorPhoneNumber: document.getElementById('guarantorPhoneNumber').value,
    'loan-amount': document.getElementById('loan-amount').value,
    'payment-frequency': document.getElementById('payment-frequency').value,
    'date-start': document.getElementById('date-start').value,
    'duration-of-loan': document.getElementById('duration-of-loan').value, // This is correctly included
    'date-end': document.getElementById('date-end').value 
};
        // Simple validation
        const requiredFields = [
            'guarantorLastName', 'guarantorFirstName', 'guarantorMiddleName', 
            'guarantorStreetAddress', 'guarantorPhoneNumber', 'loan-amount', 
            'payment-frequency', 'date-start', 'duration-of-loan', 'date-end'
        ];
        
        let isValid = true;
        requiredFields.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (!input || !input.value) {
                isValid = false;
                input.style.borderColor = 'red'; 
            } else {
                input.style.borderColor = ''; 
            }
        });

        if (!isValid) {
            alert('Please fill out all required fields.');
            return;
        }

        // Send the data to the PHP handler
        fetch('PHP/loanapplication_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert(result.message);
                // Clear the form on successful submission
                form.reset(); 
                endDateInput.value = ''; 
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during submission.');
        });
    });
});