document.addEventListener('DOMContentLoaded', function() {
    // 1. Define Access Rules
    // Map of menu item names to an array of roles that have access.
    const accessRules = {
        // --- Main Navigation Links ---
        'Dashboard': ['Admin', 'Manager', 'Loan_Officer'],
        'Client Creation': ['Admin', 'Loan_Officer'],
        'Loan Application': ['Admin', 'Loan_Officer'],
        'Pending Accounts': ['Admin', 'Manager'],
        'Payment Collection': ['Admin', 'Manager'],
        'Ledger': ['Admin', 'Manager', 'Loan_Officer'],
        'Reports': ['Admin', 'Manager', 'Loan_Officer'],
        'Tools': ['Admin', 'Manager', 'Loan_Officer'], // Main 'Tools' link access

        // --- Tools Submenu Buttons ---
        'Backup And Restore': ['Admin'],
        'Interest Amount': ['Admin'],
        'User Management': ['Admin', 'Manager', 'Loan_Officer'],
        
        // 🚨 NEW ACCESS RULES FOR USER MANAGEMENT SUBMENU 🚨
        'Password Change': ['Admin', 'Manager', 'Loan_Officer'],
        'Username Change': ['Admin', 'Manager', 'Loan_Officer'],
        'Create User': ['Admin'],
        'Existing Accounts': ['Admin']
    };

    // 2. Fetch the current user's role
    fetch('PHP/check_session.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const userRole = data.role;
            // The logic to enforce navigation access should be in enforce_login.js, 
            // but the role is stored here for direct use if needed.
            // This script's primary focus is the user creation form.
        })
        .catch(error => {
            console.error("Error fetching user session data:", error);
            // Optionally redirect to login or show an error
            // window.location.href = 'Login.html';
        });

    // 3. User Creation Form Logic
    const form = document.getElementById('user-creation-form');
    const statusMessage = document.getElementById('status-message');
    const submitButton = form.querySelector('.create-account-button');

    // 4. Client-side Validation (for immediate user feedback)
    function validateForm(formData) {
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const username = formData.get('username').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');
        const role = formData.get('role');

        if (!name || !email || !username || !password || !confirmPassword || !role) {
            return { valid: false, message: 'All fields are required.' };
        }

        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long.' };
        }

        if (password !== confirmPassword) {
            return { valid: false, message: 'Password and Confirm Password do not match.' };
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return { valid: false, message: 'Please enter a valid email address.' };
        }

        // Additional: Check if role is one of the allowed values
        const allowedRoles = ['Admin', 'Manager', 'Loan_Officer'];
        if (!allowedRoles.includes(role)) {
            return { valid: false, message: 'Invalid role selected.' };
        }

        return { valid: true };
    }


    // 5. User Action Logging Function
    /**
     * Sends an action log to the server.
     * @param {string} action - The type of action (e.g., 'CREATED', 'UPDATED', 'DELETED', 'LOGIN').
     * @param {string} description - Detailed description of the action.
     * @param {string} [targetTable=''] - The database table affected (e.g., 'users', 'loans').
     * @param {number|string} [targetId=0] - The ID of the row affected.
     */
    function logUserAction(action, description, targetTable = '', targetId = 0) {
        // NOTE: This assumes an existing log_action.php handler is in the PHP directory
        fetch('PHP/log_action.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: action,
                description: description,
                target_table: targetTable,
                target_id: targetId
            })
        })
        .then(response => {
            if (!response.ok) {
                console.error("Failed to log action. Server response not OK.");
            }
            return response.text(); // Use .text() as log handlers often don't return JSON
        })
        .then(logResponseText => {
            // console.log("Action log recorded:", logResponseText);
        })
        .catch(error => {
            console.error("Error sending action log:", error);
        });
    }

    // 6. Handle Form Submission
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Stop the default form submission

        const formData = new FormData(form);
        const name = formData.get('name');
        const username = formData.get('username');
        const role = formData.get('role');
        
        // Disable the button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Creating...';
        statusMessage.textContent = ''; // Clear previous message
        
        // Client-side validation
        const validation = validateForm(formData);
        if (!validation.valid) {
            statusMessage.textContent = validation.message;
            statusMessage.style.color = 'red';
            submitButton.disabled = false;
            submitButton.textContent = 'Create';
            return;
        }

        try {
            // Send the data to the PHP handler
            const response = await fetch('PHP/usercreation_handler.php', {
                method: 'POST',
                body: formData
            });

            // Check for network or HTTP error (e.g., 500 server error)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Check if the server response indicates success
            if (result.success) {
                statusMessage.textContent = result.message;
                statusMessage.style.color = 'green';
                form.reset(); // Clear the form on success
                
                // ✅ FIX: Get the actual ID from the server response
                const newUserId = result.userId; 
                
                // --- LOG SUCCESSFUL USER CREATION ---
                // MODIFIED: Added targetTable ('users') and now correctly using newUserId
                logUserAction(
                    'CREATED', 
                    `New user created successfully: Username: ${username}, Role: ${role}, Name: ${name}`,
                    'users',
                    newUserId 
                );

            } else {
                statusMessage.textContent = result.message;
                statusMessage.style.color = 'red';

                // --- LOG FAILED USER CREATION (Server-side) ---
                // MODIFIED: Called logUserAction without targetTable/targetId
                logUserAction(
                    'CREATED', 
                    `Failed to create user: Username: ${username}, Role: ${role}, Message: ${result.message}`
                );
            }
        } catch (error) {
            // Handle any errors that occurred during the fetch request.
            statusMessage.textContent = 'An error occurred. Please try again.';
            statusMessage.style.color = 'red';
            console.error('Submission error:', error);
            
            // --- LOG USER CREATION ERROR (Network/Exception) ---
            // MODIFIED: Called logUserAction without targetTable/targetId
            logUserAction(
                'CREATED', 
                `Error during user creation attempt for Username: ${username}, Details: ${error.message}`
            );

        } finally {
            // Re-enable the button and reset its text, regardless of success or failure.
            submitButton.disabled = false;
            submitButton.textContent = 'Create';
        }
    });

    // Logout Functionality (using the existing button)
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            logUserAction('LOGOUT', 'User logged out successfully.');
            // This fetch assumes a handler in 'PHP/logout.php'
            fetch('PHP/logout.php', { method: 'POST' })
                .then(() => {
                    // Redirect to login page after server-side session destruction
                    window.location.href = 'Login.html';
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    alert('Could not log out properly. Please close your browser.');
                    // Redirect anyway as a fallback
                    window.location.href = 'Login.html';
                });
        });
    }
});