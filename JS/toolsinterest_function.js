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
/*=======================================================================================================================================*/
// JS/toolsinterest_function.js

/**
 * Generates the HTML structure for the Interest Rate History table.
 * @param {Array<Object>} ratesData - Array of rate objects to populate the table.
 * @returns {string} The HTML string for the table history section.
 */
function generateInterestRateHistoryHtml(ratesData = []) {
    
    // Function to generate the table rows (body content)
    const generateTableBody = (rates) => {
        if (!rates || rates.length === 0) {
            // Updated colspan to 4
            return `<tr><td colspan="4" style="text-align: center;">No interest rate history available.</td></tr>`;
        }

        return rates.map(rate => {
            const statusColor = rate.status === 'activated' ? 'green' : 'red';
            const statusText = rate.status;
            
            // Removed actionCellContent and isActivated logic as the action column is gone.

            return `
                <tr data-interest-id="${rate.interest_ID}" data-status="${rate.status}">
                    <td style="border: 1px solid #ddd; padding: 8px;">${rate.interest_ID}</td>
                    <td class="rate-value editable" style="border: 1px solid #ddd; padding: 8px;">${rate.Interest_Pecent}%</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${rate.date_created}</td>
                    <td class="rate-status" style="border: 1px solid #ddd; padding: 8px; color: ${statusColor}; font-weight: bold;">${statusText}</td>
                    </tr>
            `;
        }).join('');
    };

    const tableBodyContent = generateTableBody(ratesData);

    // This returns the complete structure, including the H3, container, THEAD, and TFOOT
    return `
        <div class="tool-section">
            <h3>Interest Rate History</h3>
            <div class="table-container" style="max-height: 350px; overflow-y: auto; border: 1px solid #ccc; padding: 5px;">
                <table id="interest-history-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px;">Rate ID</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Percentage</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Date Created</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
                            </tr>
                    </thead>
                    <tbody id="interest-rates-body">
                        ${tableBodyContent}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ---------------------------------------------------------------------
// Primary Application Logic
// ---------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Target the container ID in the HTML
    const container = document.getElementById('interest-history-container'); 
    
    // Only proceed if the container exists
    if (container) {
        // Fetch the data and render the complete table
        fetchInterestRates(container);
    }
    
    // Add event listener for the new interest rate form (optional, but good practice)
    const newInterestForm = document.getElementById('new-interest-form');
    if (newInterestForm) {
        newInterestForm.addEventListener('submit', handleNewRateSubmission);
    }

    // Set today's date on the disabled input
    const dateStartInput = document.getElementById('date_start');
    if (dateStartInput) {
        dateStartInput.value = new Date().toISOString().split('T')[0];
    }
});

/**
 * Fetches all interest rates from the backend and renders the table.
 */
function fetchInterestRates(container) {
    // Inject a loading message before fetching
    container.innerHTML = `<p style="text-align: center; padding: 20px;">Loading interest rate history...</p>`;

    fetch('PHP/toolsinterest_handler.php')
        .then(response => {
            // Check if the response is valid JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                 // Handle non-JSON responses (e.g., PHP error page)
                console.error('Received non-JSON response from API:', response);
                throw new Error('Server returned non-JSON response.');
            }
        })
        .then(data => {
            if (data.success && data.data) {
                // Re-render the entire component with fetched data
                container.innerHTML = generateInterestRateHistoryHtml(data.data);
                // Removed attachDeactivateListeners() call since the buttons are gone
                
                // OPTIONAL: Update the active rate display
                const activeRate = data.data.find(rate => rate.status === 'activated');
                const activeRateElement = document.getElementById('active-interest-rate');
                if (activeRate && activeRateElement) {
                     activeRateElement.textContent = `${activeRate.Interest_Pecent}%`;
                } else if (activeRateElement) {
                     activeRateElement.textContent = `N/A (No active rate)`;
                     activeRateElement.style.color = '#dc3545';
                }

            } else {
                // Render with an empty array to show "No rates found" or custom message
                container.innerHTML = generateInterestRateHistoryHtml([]);
                const tbody = container.querySelector('#interest-rates-body');
                if(tbody) {
                    // Updated colspan to 4
                    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #007bff;">${data.message || 'No interest rates found.'}</td></tr>`;
                }
                console.error(data.message || 'Error fetching rates.');
            }
        })
        .catch(error => {
            console.error('Initial Fetch Error:', error);
            // Modified to render a generic error message
            container.innerHTML = generateInterestRateHistoryHtml([]); 
            const tbody = container.querySelector('#interest-rates-body');
            if(tbody) {
                // Updated colspan to 4
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error connecting to API or fetching data. Check server logs.</td></tr>`;
            }
        });
}

function handleNewRateSubmission(event) {
    event.preventDefault();
    
    const newRate = document.getElementById('new_rate').value;
    const dateStart = document.getElementById('date_start').value;

    if (!newRate || newRate < 1 || newRate > 100) {
        alert('Please enter a valid interest percentage (1-100).');
        return;
    }
    
    if (!confirm(`Confirm activation of a new interest rate: ${newRate}%? The current active rate will be deactivated.`)) {
        return;
    }

    // Assuming you have a PHP script 'PHP/toolsinterestinsert_function.php' for inserting and deactivating the old rate
    fetch('PHP/toolsinterestinsert_function.php', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `new_rate=${newRate}&date_start=${dateStart}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`New rate ${newRate}% successfully activated. Old rate deactivated.`);
            document.getElementById('new-interest-form').reset(); // Clear the form
            // Re-fetch and re-render the table and active rate display
            fetchInterestRates(document.getElementById('interest-history-container'));
        } else {
            alert(`Error setting new rate: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('New Rate Submission Error:', error);
        alert('An unexpected error occurred while setting the new rate.');
    });
}
/*=======================================================================================================================================*/


 document.addEventListener('DOMContentLoaded', () => {
        const activeRateSpan = document.getElementById('active-interest-rate');
        const form = document.getElementById('new-interest-form');
        const container = document.getElementById('interest-history-container'); // Get the container reference

        // Function to fetch and display the active rate
        const fetchActiveRate = async () => {
            // ... (rest of the fetchActiveRate function remains the same)
            try {
                const response = await fetch('PHP/toolinterestactive_handler.php'); // Assuming a new file for GET
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                if (data.success) {
                    activeRateSpan.textContent = `${data.rate}%`;
                } else {
                    console.error('Failed to fetch active rate:', data.message);
                    activeRateSpan.textContent = 'N/A';
                }
            } catch (error) {
                console.error('Error fetching active rate:', error);
                // Fallback to the value from the HTML
            }

        };
        
        // **Initial fetch (or use the value pre-filled in the HTML)**
        // fetchActiveRate(); // Uncomment this if you implement the separate GET endpoint

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newRateInput = document.getElementById('new_rate');
            const newRate = parseInt(newRateInput.value);
            
            if (isNaN(newRate) || newRate < 1 || newRate > 100) {
                alert('Please enter a valid interest rate between 1 and 100.');
                return;
            }

            const formData = new FormData();
            formData.append('new_rate', newRate);

            try {
                const response = await fetch('PHP/toolsinterestupdate_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();

                if (data.success) {
                    alert(data.message);
                    // Update the displayed active rate
                    activeRateSpan.textContent = `${data.new_rate}%`; 
                    // Clear the input field
                    newRateInput.value = '';
                    
                    // 🚀 ADDED: Re-fetch and re-render the table history!
                    if (container) {
                        fetchInterestRates(container);
                    }
                    
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Submission error:', error);
                alert('An unexpected error occurred during submission.');
            }
        });
        
    });