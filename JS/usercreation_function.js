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
        // Redirect to the PHP script that handles session destruction
        window.location.href = 'PHP/check_logout.php'; 
    });
});
/*=============================================================================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the buttons by their IDs
    const passwordChangeBtn = document.getElementById('password-change-btn');
    const usernameChangeBtn = document.getElementById('username-change-btn');
    const accountCreationBtn = document.getElementById('account-creation-btn');
    const existingAccountsBtn = document.getElementById('existing-accounts-btn');

    // Add an event listener for each button
    if (passwordChangeBtn) {
        passwordChangeBtn.addEventListener('click', () => {
            window.location.href = 'UserPasswordChange.html';
        });
    }

    if (usernameChangeBtn) {
        usernameChangeBtn.addEventListener('click', () => {
            window.location.href = 'UserUsernameChange.html';
        });
    }

    if (accountCreationBtn) {
        accountCreationBtn.addEventListener('click', () => {
            window.location.href = 'UserCreation.html';
        });
    }

    if (existingAccountsBtn) {
        existingAccountsBtn.addEventListener('click', () => {
            window.location.href = 'UserExisting.html';
        });
    }
});
/*================================= */
// JS/usercreation_function.js

// Add an event listener to the form element using its class name.
document.querySelector('.account-creation-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Get a reference to the form element itself.
    const form = event.target;
    // Get references to the status message area and the submit button.
    const statusMessage = document.getElementById('status-message');
    const submitButton = document.querySelector('.create-account-button');

    // --- Client-side Validation ---
    // Retrieve and trim the values from all form fields.
    const name = form.elements['name'].value.trim();
    const email = form.elements['email'].value.trim();
    const username = form.elements['username'].value.trim();
    const password = form.elements['password'].value;
    const confirmPassword = form.elements['confirm-password'].value;
    const role = form.elements['role'].value;

    // Clear any previous status messages.
    statusMessage.textContent = '';
    // Hide the status message div initially.
    statusMessage.style.display = 'none';

    // Check if any fields are empty.
    if (!name || !email || !username || !password || !confirmPassword || !role) {
        statusMessage.textContent = 'Please fill out all fields.';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'red';
        return;
    }

    // Check if the passwords match.
    if (password !== confirmPassword) {
        statusMessage.textContent = 'Passwords do not match.';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'red';
        return;
    }

    // Simple password length validation.
    if (password.length < 8) {
        statusMessage.textContent = 'Password must be at least 8 characters long.';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'red';
        return;
    }

    // --- Form Submission via Fetch API ---
    // Disable the button and change its text to provide user feedback.
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';
    // Display a processing message.
    statusMessage.textContent = 'Processing...';
    statusMessage.style.display = 'block';
    statusMessage.style.color = 'blue';
    
    // Create a FormData object from the form to easily handle form data.
    const formData = new FormData(form);
    // Do not send the confirm password to the server.
    formData.delete('confirm-password');

    try {
        // Send the form data to the PHP script.
        const response = await fetch('PHP/usercreation_handler.php', {
            method: 'POST',
            body: formData
        });

        // Check if the network response was successful.
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Parse the JSON response from the server.
        const result = await response.json();

        // Check the 'success' property of the server response.
        if (result.success) {
            statusMessage.textContent = result.message;
            statusMessage.style.color = 'green';
            form.reset(); // Clear the form on successful account creation.
        } else {
            statusMessage.textContent = result.message;
            statusMessage.style.color = 'red';
        }
    } catch (error) {
        // Handle any errors that occurred during the fetch request.
        statusMessage.textContent = 'An error occurred. Please try again.';
        statusMessage.style.color = 'red';
        console.error('Submission error:', error);
    } finally {
        // Re-enable the button and reset its text, regardless of success or failure.
        submitButton.disabled = false;
        submitButton.textContent = 'Create';
    }
});
