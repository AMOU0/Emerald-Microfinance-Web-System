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
/*===============================================================================================================================================*/




// JS/toolbr_function.js

document.addEventListener('DOMContentLoaded', () => {
    const backupBtn = document.getElementById('manualBackupBtn'); 
    const restoreBtn = document.getElementById('manualRestoreBtn'); 
    const restoreFile = document.getElementById('restoreFile'); 
    const messageBox = document.getElementById('messageBox'); 
    
    // Enable buttons once JS is loaded
    backupBtn.disabled = false;

    // --- Utility Functions ---

    /** Shows a message in the message box */
    function showMessage(type, message) {
        messageBox.textContent = message;
        // Sets class to message-box--success, message-box--error, or message-box--loading
        messageBox.className = `message-box message-box--${type}`;
        messageBox.classList.remove('message-box--hidden');
    }

    /** Clears the message box */
    function clearMessage() {
        messageBox.textContent = '';
        messageBox.className = 'message-box message-box--hidden';
    }

    // --- Backup Handler ---
    backupBtn.addEventListener('click', () => {
        clearMessage();
        showMessage('loading', 'Initiating database backup... A file download should start shortly.');
        backupBtn.disabled = true;

        // Directly navigate to the PHP script to force a file download
        window.location.href = 'PHP/toolbebackup_handler.php';

        // Re-enable button and show success after a brief delay, as the script initiates the download
        setTimeout(() => {
            backupBtn.disabled = false;
            showMessage('success', 'Backup initiated. Check your downloads folder.');
        }, 3000);
    });

    // --- Restore Handler ---

    // Enable/Disable restore button based on file selection
    restoreFile.addEventListener('change', () => {
        // Only enable if a file is selected AND it has the .sql extension
        const file = restoreFile.files[0];
        restoreBtn.disabled = !(file && file.name.toLowerCase().endsWith('.sql'));
    });
    
    restoreBtn.addEventListener('click', () => {
        clearMessage();
        
        const file = restoreFile.files[0];
        if (!file || !file.name.toLowerCase().endsWith('.sql')) {
            showMessage('error', 'Please select a valid **.sql** backup file to restore.');
            return;
        }

        showMessage('loading', 'Starting database restore... **DO NOT CLOSE THIS PAGE**');
        restoreBtn.disabled = true;
        
        // 1. Prepare data for file upload (multipart/form-data)
        const formData = new FormData();
        formData.append('restore_file', file);

        // 2. Send the file to restore.php using Fetch API
        fetch('PHP/toolbrrestore_handler.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Read response as JSON first, regardless of success status
            return response.json().then(data => ({
                status: response.status,
                ok: response.ok,
                data: data
            }));
        })
        .then(res => {
            if (res.ok && res.data.success) {
                showMessage('success', res.data.message);
            } else {
                // Handle server-side errors (e.g., PHP exec failure)
                showMessage('error', `Restore operation failed. Server message: ${res.data.message || 'Unknown Error'}`);
            }
        })
        .catch(error => {
            console.error('Restore Error:', error);
            // Handle network or parsing errors
            showMessage('error', `A critical network error occurred during restore: ${error.message}`);
        })
        .finally(() => {
            restoreBtn.disabled = false;
            // Optionally clear file selection after attempt
            // restoreFile.value = "";
            // document.getElementById('restoreFileName').textContent = 'No file selected';
        });
    });
});