document.addEventListener('DOMContentLoaded', function() {
  // Call the session check function as soon as the page loads.
  checkSessionAndRedirect(); 

  // --- Global Logging Function (Updated to accept two parameters) ---
  function logUserAction(actionType, description) {
    // Note: The PHP script (PHP/log_action.php) must be updated 
    // to handle both 'action' (the type) and 'description' (the detail).
    
    // Use URLSearchParams to easily format the POST body
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
  // --------------------------------------------------------

  const navLinks = document.querySelectorAll('.nav-link');
  const logoutButton = document.querySelector('.logout-button');
  // NEW: Select the buttons in the Tools menu
  const toolsMenuButtons = document.querySelectorAll('.menu-button'); //

  // EXISTING: Mapping for the main sidebar navigation links
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

  // NEW: Mapping for the sub-menu buttons inside Tools.html
  const toolsUrlMapping = {
    'backupandrestore': 'ToolsBR.html', //
    'interestamount': 'ToolsInterest.html', // 
    'city/barangays': 'ToolsPlaces.html', //
    // The 'Terms/ Frequently Payment' button is currently unmapped
  };

  // --- Main Sidebar Navigation Handler (Existing Logic) ---
  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault(); 
      navLinks.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      // Normalize the link text for mapping lookup
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

  // --- Tools Menu Button Handler (NEW Logic) ---
  toolsMenuButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();

        // Normalize the button text for mapping lookup
        // Note: For 'City/ Barangays', the map key uses a '/' which is retained
        // The normalization must match the key in toolsUrlMapping
        let buttonText = this.textContent.toLowerCase().replace(/\s/g, '');

        // Special handling for the 'City/ Barangays' key if it doesn't match the normalized string
        if (buttonText === 'city/barangays') {
            buttonText = 'city/barangays';
        } else {
             // For the other buttons, remove the '/' or any other non-standard chars if present
             buttonText = buttonText.replace(/[^a-z0-9]/g, '');
        }

        const targetPage = toolsUrlMapping[buttonText];

        if (targetPage) {
            const actionType = 'NAVIGATION'; // New action type for tool usage
            const description = `Accessed tool "${this.textContent}", loading page ${targetPage}`;

            // Log the action before redirect
            logUserAction(actionType, description);

            // Perform the page redirect
            window.location.href = targetPage;
        } else {
            console.error('No page defined for this tool button:', this.textContent);
            
            // Log the failed attempt
            const actionType = 'NAVIGATION';
            const description = `FAILED: Clicked tool "${this.textContent}" with no mapped page.`;
            logUserAction(actionType, description);
        }
    });
  });
  // ---------------------------------------------

  // Handle the logout button securely (Existing Logic)
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      window.location.href = 'PHP/check_logout.php'; 
    });
  }
});