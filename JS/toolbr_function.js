document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    const navLinks = document.querySelectorAll('.nav-link');
    // Select the new buttons
    const menuButtons = document.querySelectorAll('.menu-button'); 
    const logoutButton = document.querySelector('.logout-button');

    // --- LOGIC FOR PRIMARY NAVIGATION LINKS (.nav-link) ---
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

            const targetPage = urlMapping[linkText];
            handleNavigation(this.textContent, targetPage);
        });
    });

    // --- LOGIC FOR NEW TOOL BUTTONS (.menu-button) ---
    menuButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); 
            
            // Get the button text (e.g., 'Backup And Restore')
            const buttonText = this.textContent;
            
            // Assuming the target URL is stored in a data attribute or hardcoded (as you provided the mapping)
            // The mapping must be determined based on the button text.
            const urlMapping = {
                'Backup And Restore': 'ToolsBR.html',
                'Interest Ammount': 'ToolsInterest.html',
                'File Maintenance': 'ToolsFM.html',
                'City/ Barangays': 'ToolsPlace.html'
            };

            const targetPage = urlMapping[buttonText];
            
            // Since these are new buttons, we don't necessarily need to add the 'active' class 
            // unless your UI requires it, so we skip that part for now.
            handleNavigation(buttonText, targetPage);
        });
    });

    // --- SHARED NAVIGATION AND AUDIT LOGIC FUNCTION ---
    function handleNavigation(linkName, targetPage) {
        if (targetPage) {
            // 1. Define the action for the audit log
            const actionDescription = `Maps to ${linkName} (${targetPage})`;

            // 2. ASYNCHRONOUS AUDIT LOG: Call PHP to log the action. 
            //    This will not block the page from redirecting.
            fetch('PHP/log_action.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=${encodeURIComponent(actionDescription)}`
            })
            .then(response => {
                if (!response.ok) {
                    console.warn('Audit log failed to record for navigation:', actionDescription);
                }
            })
            .catch(error => {
                console.error('Audit log fetch error:', error);
            })
            
            // 3. Perform the page redirect immediately
            window.location.href = targetPage;
        } else {
            console.error('No page defined for this link:', linkName);
        }
    }


    // Handle the logout button securely
    // NOTE: The PHP script 'PHP/check_logout.php' will now handle the log *before* session destruction.
    logoutButton.addEventListener('click', function() {
        window.location.href = 'PHP/check_logout.php'; 
    });
});