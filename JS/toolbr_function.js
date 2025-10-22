document.addEventListener('DOMContentLoaded', function() {
            enforceRoleAccess(['admin']); 
        });
/*=============================================================================*/


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

/* =======================================================================
   FIRST DOMContentLoaded BLOCK (Navigation/Logout)
   ======================================================================= */
document.addEventListener('DOMContentLoaded', function() {
  // Call the session check function as soon as the page loads.
  // Note: checkSessionAndRedirect() must be defined elsewhere or globally.
  checkSessionAndRedirect(); 

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
    'usermanagement': 'UserManagement.html'
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

// JS/toolbr_function.js (MODIFIED for specific database export and Audit Logging)

/* =======================================================================
   SECOND DOMContentLoaded BLOCK (Backup/Restore)
   ======================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const backupBtn = document.getElementById('manualBackupBtn'); 
    const restoreBtn = document.getElementById('manualRestoreBtn'); 
    const restoreFile = document.getElementById('restoreFile'); 
    const messageBox = document.getElementById('messageBox'); 
    
    // Check if the required elements exist before continuing the script
    if (!backupBtn || !restoreBtn || !restoreFile || !messageBox) {
        // This likely means the script is being loaded on a page other than ToolsBR.html
        // We stop execution for this part to avoid ReferenceErrors on null elements.
        return; 
    }
    
    // Enable buttons once JS is loaded
    backupBtn.disabled = false;

    // --- Utility Functions (Local to this block if needed, but simple for now) ---

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

    // --- Backup Handler (MODIFIED with Audit Logging) ---
    backupBtn.addEventListener('click', () => {
        // *** ASSUMPTION: An input element with id='dbNameInput' exists in ToolsBR.html ***
        const dbNameInput = document.getElementById('dbNameInput'); 
        // Default to 'emerald_microfinance' if no input is found or if input is empty
        let dbName = dbNameInput ? dbNameInput.value.trim() : 'emerald_microfinance'; 

        if (!dbName) {
            showMessage('error', 'Please enter a database name to back up.');
            // --- AUDIT LOGGING: Backup Validation Failed ---
            logUserAction('CREATED_BR', 'Failed to initiate Manual Database Backup: Database name was empty.');
            // ------------------------------------------------
            return;
        }

        clearMessage();
        showMessage('loading', `Initiating backup for database "${dbName}"... A file download should start shortly.`);
        backupBtn.disabled = true;

        // Directly navigate to the PHP script, passing the database name as a query parameter
        window.location.href = `PHP/toolbrbackup_handler.php?db=${encodeURIComponent(dbName)}`;

        // --- AUDIT LOGGING: Backup Initiated (Success) ---
        logUserAction('CREATED_BR', `Initiated **Manual Database Backup** for database: ${dbName}.`);
        // -------------------------------------------------

        // Re-enable button and show success after a brief delay, as the script initiates the download
        setTimeout(() => {
            backupBtn.disabled = false;
            showMessage('success', 'Backup initiated. Check your downloads folder.');
            logUserAction('CREATED_BR', `Initiated **Manual Database Backup** for database: ${dbName}.`);

        }, 3000);
    });

    // --- Restore Handler (MODIFIED with Audit Logging) ---

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
            // --- AUDIT LOGGING: Restore Validation Failed ---
            logUserAction('UPDATED_BR', `Failed to initiate Manual Database Restore: No valid .sql file selected.`);
            // ------------------------------------------------
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
            const restoredFileName = restoreFile.files[0] ? restoreFile.files[0].name : 'Unknown File';

            if (res.ok && res.data.success) {
                showMessage('success', res.data.message);
                
                // --- AUDIT LOGGING: Restore Success ---
                logUserAction('UPDATED_BR', `Successfully completed  **Manual Database Restore** using file: ${restoredFileName}.`);
                // --------------------------------------
                
            } else {
                // Handle server-side errors (e.g., PHP exec failure)
                showMessage('error', `Restore operation failed. Server message: ${res.data.message || 'Unknown Error'}`);
                
                // --- AUDIT LOGGING: Restore Server Failed ---
                logUserAction('UPDATED_BR', `Failed Manual Database Restore (Server Error) using file: ${restoredFileName}. Server message: ${res.data.message || 'Unknown Error'}`);
                // --------------------------------------------
            }
        })
        .catch(error => {
            console.error('Restore Error:', error);
            // Handle network or parsing errors
            showMessage('error', `A critical network error occurred during restore: ${error.message}`);
            
            // --- AUDIT LOGGING: Restore Network Failed ---
            logUserAction('UPDATED_BR', `CRITICAL Error during Manual Database Restore Fetch: ${error.message}`);
            // ---------------------------------------------
        })
        .finally(() => {
            restoreBtn.disabled = false;
            // Optionally clear file selection after attempt
            // restoreFile.value = "";
            // document.getElementById('restoreFileName').textContent = 'No file selected';
        });
    });
});
/*====================================================================================================================================*/
/* * JS/toolsbr_log.js
 * Fetches and renders the Backup/Restore log data dynamically.
 */
document.addEventListener('DOMContentLoaded', function() {
    const logTableBody = document.getElementById('backupLogTableBody');
    // FIX: Change the endpoint name from toolsbr_handler.php to toolsbr_log.php
    const logEndpoint = 'PHP/toolsbr_handler.php'; 

    if (!logTableBody) return; 

    /**
     * Helper function to sanitize text before inserting into HTML.
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }
    
    /**
     * Renders a single message row into the table body.
     */
    function renderMessageRow(message, type = 'data-table__no-data') {
        const row = document.createElement('tr');
        // Colspan 4 to match the 4 columns in the updated HTML table
        row.innerHTML = `<td colspan="4" class="${type}">${escapeHtml(message)}</td>`;
        logTableBody.innerHTML = ''; 
        logTableBody.appendChild(row);
    }
    
    /**
     * Converts an ISO-like timestamp (YYYY-MM-DD HH:MM:SS) to a human-readable format 
     * with the month name (e.g., "Oct 13, 2025, 02:30:00 AM").
     */
    function formatTimestamp(isoString) {
        if (!isoString) return '';
        // Replace space with 'T' to create a valid ISO 8601 format for robust parsing
        const date = new Date(isoString.replace(' ', 'T'));
        
        // Return original if the date is invalid (to prevent showing "Invalid Date")
        if (isNaN(date.getTime())) {
            return isoString; 
        }

        // Configuration for the desired output format (e.g., "Oct 13, 2025, 02:30:00 AM")
        const options = { 
            year: 'numeric', 
            month: 'short', // 'short' (e.g., Oct) or 'long' (e.g., October)
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: true // Uses AM/PM
        };

        return new Intl.DateTimeFormat('en-US', options).format(date);
    }


    /**
     * Fetches log data from the PHP endpoint and updates the HTML table.
     */
    function loadLogData() {
        renderMessageRow('Loading log history...', 'data-table__loading');

        fetch(logEndpoint)
            .then(response => {
                if (!response.ok) {
                    console.error('HTTP Error Status:', response.status, response.statusText);
                }
                // Try to parse JSON. This is where the SyntaxError occurs if the content is HTML.
                return response.json().catch(e => {
                    throw new Error(`Failed to parse JSON response. Server outputted non-JSON data.`);
                });
            })
            .then(data => {
                if (data.success && data.logs.length > 0) {
                    logTableBody.innerHTML = ''; 
                    data.logs.forEach(log => {
                        const row = logTableBody.insertRow();
                        
                        // This ensures the row structure is correct, using the 'username' field from PHP
                        row.insertCell().textContent = formatTimestamp(log.timestamp); 
                        // FIX: Change log.user_id to log.username to display the fetched username
                        row.insertCell().textContent = escapeHtml(log.username);
                        
                        row.insertCell().textContent = escapeHtml(log.action);
                        row.insertCell().textContent = escapeHtml(log.description);
                    });
                } else if (data.success) {
                    renderMessageRow('No Backup/Restore logs found.');
                } else {
                    renderMessageRow(`Error: ${data.message || 'Unknown server error'}`);
                }
            })
            .catch(error => {
                console.error('Error fetching logs:', error);
                renderMessageRow(`CRITICAL ERROR: ${error.message}. Please check PHP files for whitespace or server configuration.`);
            });
    }

    loadLogData();
});