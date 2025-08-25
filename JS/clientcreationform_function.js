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
    const form = document.getElementById('clientCreationForm');

    // Function to generate the new client ID
    function generateClientId() {
        // Get the current year
        const currentYear = new Date().getFullYear();
        // A placeholder for the next client number. This would need to be fetched from a database.
        // For this example, we'll use a hardcoded value, but you would replace this with a dynamic number.
        // The first client of the year would be 1, the next 2, and so on.
        const nextClientNumber = 1; 
        
        // Pad the number with leading zeros to make it 5 digits long
        const paddedNumber = String(nextClientNumber).padStart(5, '0');
        
        // Combine the year and the padded number to create the client ID
        return `${currentYear}${paddedNumber}`;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const createButton = document.getElementById('create-button');
        createButton.disabled = true;
        createButton.textContent = 'Creating...';

        // Add checkbox values and convert them to 1 or 0
        data.barangayClearance = form.elements.barangayClearance.checked ? 1 : 0;
        data.validId = form.elements.validId.checked ? 1 : 0;
        
        // The 'cr' field is a text input, not a checkbox.
        // Let's ensure it's handled as a string.
        data.cr = data.cr || null;

        // Basic validation for required fields
        const requiredFields = [
            'lastName', 'firstName', 'middleName', 'maritalStatus', 'gender',
            'dateOfBirth', 'city', 'barangay', 'postalCode', 'streetAddress',
            'phoneNumber', 'incomeSalary', 'cr'
        ];

        for (const field of requiredFields) {
            if (!data[field]) {
                alert(`Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                createButton.disabled = false;
                createButton.textContent = 'Create';
                return;
            }
        }
        
        // Client requirements should have at least one of the following: a collateral, a valid ID, or a barangay clearance.
        if (!data.cr && !data.validId && !data.barangayClearance) {
            alert('Please select at least one requirement.');
            createButton.disabled = false;
            createButton.textContent = 'Create';
            return;
        }

        // Generate the new client ID and add it to the data
        data.clientId = generateClientId();

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
                alert('Client created successfully! Client ID: ' + data.clientId);
                form.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            createButton.disabled = false;
            createButton.textContent = 'Create';
        }
    });
});