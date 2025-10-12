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

  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault(); 
      navLinks.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      // Normalize the link text for mapping lookup
      const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
      const targetPage = urlMapping[linkText];
        
      if (targetPage) {
        // 1. Define clear action type and description for the log
        const actionType = 'NAVIGATION'; // Use the fixed type for filtering
        const description = `Clicked "${this.textContent}" link, redirecting to ${targetPage}`;

        // 2. ASYNCHRONOUS AUDIT LOG: Log the action.
        logUserAction(actionType, description);

        // 3. Perform the page redirect immediately after initiating the log.
        window.location.href = targetPage;
      } else {
        console.error('No page defined for this link:', linkText);
        
        // OPTIONAL: Log the failed navigation attempt
        const actionType = 'NAVIGATION';
        const description = `FAILED: Clicked link "${this.textContent}" with no mapped page.`;
        logUserAction(actionType, description);
      }
    });
  });

  // Handle the logout button securely
  // The PHP script 'PHP/check_logout.php' should handle the log *before* session destruction.
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      window.location.href = 'PHP/check_logout.php'; 
    });
  }
});