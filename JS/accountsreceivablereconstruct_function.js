document.addEventListener('DOMContentLoaded', function() {
    // NOTE: The function 'checkSessionAndRedirect' is assumed to be defined elsewhere.
    checkSessionAndRedirect(); 

    // ==========================================================
    // 1. Initial Checks and Navigation Setup
    // ==========================================================
    
    // Select all necessary elements
    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');
    const returnButton = document.querySelector('.return-button'); // FIX: Define returnButton here
    
    // Select dynamic calculation elements
    const startDateInput = document.getElementById('reconstruct-date-start');
    const durationInput = document.getElementById('reconstruct-duration-of-loan');
    const endDateInput = document.getElementById('reconstruct-date-end');

    // Select the form for submission
    const loanReconstructionForm = document.getElementById('loanReconstructionForm');

    // --- Navigation Link Handler ---
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
            if (targetPage) {
                // ASYNCHRONOUS AUDIT LOG
                const actionDescription = `Mapped to ${this.textContent} (${targetPage})`;
                fetch('PHP/log_action.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=${encodeURIComponent(actionDescription)}`
                })
                .catch(error => {
                    console.error('Audit log fetch error:', error);
                });
                
                // Perform the page redirect immediately
                window.location.href = targetPage;
            } else {
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // --- Logout Button Handler ---
    logoutButton.addEventListener('click', function() {
        // NOTE: 'PHP/check_logout.php' handles logging out and session destruction
        window.location.href = 'PHP/check_logout.php'; 
    });

    // ==========================================================
    // 2. RETURN Button Handler (FIXED)
    // ==========================================================
    if (returnButton) {
        returnButton.addEventListener('click', () => {
            // Redirects to the main Accounts Receivable page
            window.location.href = 'AccountsReceivable.html'; 
        });
    }

    // ==========================================================
    // 3. Fetch Loan Details from URL
    // ==========================================================
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('loanID'); 

    if (loanId) {
        fetchAndDisplayLoanDetails(loanId);
    } else {
        console.error("No loanID found in the URL.");
        // Optionally alert the user or hide the form
    }

    // ==========================================================
    // 4. Dynamic End Date Calculation (Simplified)
    // ==========================================================
    
    if (startDateInput && durationInput && endDateInput) {
        function calculateEndDate() {
            const startDateValue = startDateInput.value;
            // Ensure duration is treated as an integer
            const durationValue = parseInt(durationInput.value, 10);

            if (!startDateValue || isNaN(durationValue)) {
                endDateInput.value = '';
                return;
            }

            const startDate = new Date(startDateValue);
            let endDate = new Date(startDate);
            
            // The duration is always in days, so we simply add the value.
            endDate.setDate(startDate.getDate() + durationValue);

            // Format date to YYYY-MM-DD for input[type=date]
            const formattedEndDate = endDate.toISOString().split('T')[0];
            endDateInput.value = formattedEndDate;
        }

        startDateInput.addEventListener('change', calculateEndDate);
        durationInput.addEventListener('input', calculateEndDate);
    }

    // ==========================================================
    // 5. Form Submission Handler
    // ==========================================================
    
    if (loanReconstructionForm) {
        loanReconstructionForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Get the original loan ID from the URL
            const urlParams = new URLSearchParams(window.location.search);
            const loanId = urlParams.get('loanID');

            if (!loanId) {
                alert('Error: No loan ID found in URL.');
                return;
            }

            // Get the data from the form inputs
            const reconstructTerms = document.getElementById('reconstruct-terms').value;
            const reconstructDateStart = document.getElementById('reconstruct-date-start').value;
            const reconstructDuration = document.getElementById('reconstruct-duration-of-loan').value;
            const reconstructDateEnd = document.getElementById('reconstruct-date-end').value;
            // The balance amount is the new principal for the reconstruction
            const balanceAmount = document.getElementById('balance-amount').value;
            
            // Simple validation
            if (!reconstructTerms || !reconstructDateStart || !reconstructDuration || !reconstructDateEnd) {
                alert('Please fill in all the reconstruction details.');
                return;
            }

            // Prepare the data to be sent
            const postData = new FormData();
            postData.append('loan_application_id', loanId);
            // Remove commas from balance amount before sending
            postData.append('reconstruct_amount', balanceAmount.replace(/,/g, '')); 
            postData.append('payment_frequency', reconstructTerms);
            postData.append('interest_rate', 20); // Hardcoded value
            postData.append('date_start', reconstructDateStart);
            postData.append('duration', reconstructDuration + ' days');
            postData.append('date_end', reconstructDateEnd);
            postData.append('status', 'active'); 
            
            // Send the data to the PHP handler
            fetch('PHP/save_reconstruction.php', {
                method: 'POST',
                body: postData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Loan reconstruction saved successfully! 🎉');
                    window.location.href = 'AccountsReceivable.html'; // Redirect
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while saving the reconstruction.');
            });
        });
    }

}); // End of DOMContentLoaded

// ==========================================================
// Global Function: Fetch and Display Loan Details
// ==========================================================
/**
 * Fetches loan details (including calculated balance) from the PHP backend 
 * and populates the "Original Loan Details" section of the form.
 * @param {number} loanId The ID of the loan to fetch.
 */
function fetchAndDisplayLoanDetails(loanId) {
    // This calls the PHP script that calculates the current balance
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
                document.getElementById('original-terms').value = '';
                document.getElementById('original-date-start').value = '';
                document.getElementById('balance-amount').value = '';
                document.getElementById('original-duration-of-loan').value = '';
                document.getElementById('original-date-end').value = '';
                alert(`Error: ${data.error}. Please check the loan ID.`);
            } else {
                // Populate the form fields with the data from the PHP script
                document.getElementById('loan-amount').value = data.loan_amount_with_interest;
                document.getElementById('original-terms').value = data.payment_frequency;
                document.getElementById('original-date-start').value = data.date_start;
                // CRUCIAL: The balance is the new amount to be reconstructed
                document.getElementById('balance-amount').value = data.balance; 
                document.getElementById('original-duration-of-loan').value = data.duration_of_loan;
                document.getElementById('original-date-end').value = data.date_end;
            }
        })
        .catch(error => {
            console.error("There was a problem with the fetch operation:", error);
            alert("Could not load loan details. Check the server and loan ID.");
        });
}