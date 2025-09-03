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
// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // Function to get a parameter from the URL
    const getUrlParameter = (name) => {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    // Function to format a date as YYYY-MM-DD
    const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;

        return [year, month, day].join('-');
    };

    // Function to calculate due dates based on loan details
    const calculateDueDates = (startDate, endDate, frequency) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        let currentDue = null;
        let nextDue = null;
        let currentDate = new Date(start); // Use a new date object for calculation to avoid mutation

        while (currentDate <= end) {
            if (currentDate >= now) {
                if (!currentDue) {
                    currentDue = new Date(currentDate);
                } else if (!nextDue) {
                    nextDue = new Date(currentDate);
                    break; // Found both, exit the loop
                }
            }

            // Increment date based on frequency
            if (frequency === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (frequency === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (frequency === 'daily') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else {
                break; 
            }
        }
        
        return {
            currentDue: currentDue ? formatDate(currentDue) : 'N/A',
            nextDue: nextDue ? formatDate(nextDue) : 'N/A'
        };
    };

    // Get clientID and loanID from the URL
    const clientID = getUrlParameter('clientID');
    const loanID = getUrlParameter('loanID');

    // Check if the IDs were found in the URL
    if (clientID && loanID) {
        // Construct the URL for the PHP script
        const phpUrl = `PHP/accountsreceivableselect_handler.php?clientID=${clientID}&loanID=${loanID}`;

        fetch(phpUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Check if the request was successful and data is available
                if (data.success && data.loanDetails) {
                    const loan = data.loanDetails;
                    
                    // Populate the form fields with the received data
                    document.getElementById('client_ID').value = loan.client_ID;
                    document.getElementById('lastName').value = loan.client_name;
                    document.getElementById('loanid').value = loan.loan_ID;

                    // The balance is correctly calculated on the PHP side
                    document.getElementById('balance').value = loan.current_balance.toFixed(2);
                    
                    // Amount to pay should be retrieved from a payment schedule, not the full loan amount
                    // For now, setting it to a simplified value or leaving it to be input manually
                    document.getElementById('amountToPay').value = ''; 

                    // Calculate and populate the due dates
                    const dueDates = calculateDueDates(loan.date_start, loan.date_end, loan.payment_frequency);
                    document.getElementById('currentDue').value = dueDates.currentDue;
                    document.getElementById('nextDue').value = dueDates.nextDue;

                    // Disable input fields to prevent manual editing
                    document.getElementById('client_ID').disabled = true;
                    document.getElementById('lastName').disabled = true;
                    document.getElementById('loanid').disabled = true;
                    document.getElementById('balance').disabled = true;

                } else {
                    console.error('Error from PHP script:', data.message || 'No loan details found.');
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    } else {
        console.error('clientID or loanID not found in the URL.');
    }
});
