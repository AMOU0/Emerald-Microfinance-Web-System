document.addEventListener('DOMContentLoaded', function() {
    // NOTE: This function must be defined in your HTML or another included script.
    if (typeof checkSessionAndRedirect === 'function') {
        checkSessionAndRedirect(); 
    }

    // =========================================================
    // --- Global Logging Function ---
    // =========================================================
    function logUserAction(actionType, description) {
        const bodyData = new URLSearchParams();
        bodyData.append('action', actionType); 
        bodyData.append('description', description); 

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
    // =========================================================

    // --- Element Selections ---
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    // REMOVED: toolsMenuButtons selection
    const userManagementButtons = document.querySelectorAll('.user-management-menu-button');


    // --- URL Mappings ---
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
        
    const userManagementUrlMapping = {
        'passwordchange': 'UserPasswordChange.html',
        'usernamechange': 'UserUsernameChange.html',
        'accountcreation': 'UserCreation.html',
        'existingaccounts': 'UserExisting.html'
    };

    // =========================================================
    // --- 1. Primary Navigation (Sidebar/Header Links) Handler ---
    // =========================================================
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Normalize the link text for mapping lookup (basic: lowercase, remove spaces)
            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            const targetPage = urlMapping[linkText];
                
            if (targetPage) {
                const actionType = 'NAVIGATION';
                const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

                logUserAction(actionType, description);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
                
                const actionType = 'NAVIGATION';
                const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
                logUserAction(actionType, description);
            }
        });
    });


    // =========================================================
    // --- 2. User Management Menu Button Handler ---
    // =========================================================
    userManagementButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();

            // Normalize the button text (lowercase, no spaces)
            const buttonTextKey = this.textContent.toLowerCase().replace(/\s/g, '');
            const targetPage = userManagementUrlMapping[buttonTextKey];

            if (targetPage) {
                const actionType = 'NAVIGATION'; 
                const description = `${this.textContent} button clicked, redirecting to ${targetPage}`;

                logUserAction(actionType, description);
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this User Management button:', this.textContent, 'Key:', buttonTextKey);
                
                const actionType = 'NAVIGATION';
                const description = `FAILED: Clicked User Management button "${this.textContent}" with no mapped page. (Key: ${buttonTextKey})`;
                logUserAction(actionType, description);
            }
        });
    });


    // =========================================================
    // --- 3. Logout Button Handler ---
    // =========================================================
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Logging occurs server-side in PHP/check_logout.php
            window.location.href = 'PHP/check_logout.php'; 
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
