document.addEventListener('DOMContentLoaded', function() {
    // ==========================================================
    // 1. Initial Checks and Navigation (Original First Block)
    // ==========================================================
    
    // Call the session check function as soon as the page loads. (Assuming checkSessionAndRedirect is defined elsewhere)
    // checkSessionAndRedirect(); 

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

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

            if (urlMapping[linkText]) {
                window.location.href = urlMapping[linkText];
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button securely
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Redirect to the PHP script that handles session destruction
            window.location.href = 'PHP/check_logout.php'; 
        });
    }

    // ==========================================================
    // 2. RETURN Button Handler (Original Second Block)
    // ==========================================================
    
    const returnButton = document.querySelector('.return-button'); 

    if (returnButton) {
        returnButton.addEventListener('click', () => {
            window.location.href = 'accountsreceivable.html'; 
        });
    }

    // ==========================================================
    // 3. Fetch Loan Details from URL
    // ==========================================================

    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('loanID'); // Get the loanID from the URL

    // Check if a loanId exists in the URL before trying to fetch data
    if (loanId) {
        fetchAndDisplayLoanDetails(loanId);
    } else {
        console.error("No loanID found in the URL.");
    }
});

// ==========================================================
/**
 * Fetches loan details from the PHP backend and populates the form.
 * @param {number} loanId The ID of the loan to fetch.
 */
function fetchAndDisplayLoanDetails(loanId) {
    const url = `PHP/accountsrecivablereconstruct_handler.php?loan_id=${loanId}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error("Error fetching loan details:", data.error);
                // Clear form fields on error
                document.getElementById('loan-amount').value = '';
                document.getElementById('payment-frequency').value = '';
                document.getElementById('date-start').value = '';
                document.getElementById('Balance-amount').value = '';
                document.getElementById('duration-of-loan').value = '';
                document.getElementById('date-end').value = '';
            } else {
                // Populate the form fields with the data from the PHP script
                document.getElementById('loan-amount').value = data.loan_amount_with_interest;
                document.getElementById('payment-frequency').value = data.payment_frequency;
                document.getElementById('date-start').value = data.date_start;
                document.getElementById('Balance-amount').value = data.balance;
                document.getElementById('duration-of-loan').value = data.duration_of_loan;
                document.getElementById('date-end').value = data.date_end;
            }
        })
        .catch(error => {
            console.error("There was a problem with the fetch operation:", error);
        });
}