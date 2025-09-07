document.addEventListener('DOMContentLoaded', function() {
    // Call the session check function as soon as the page loads.
    checkSessionAndRedirect(); 

    const navLinks = document.querySelectorAll('.nav-link');
    const logoutButton = document.querySelector('.logout-button');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const linkText = this.textContent.toLowerCase().replace(/\s/g, ''); 
            
            // NOTE: Keep links pointing to .php if you want server-side security, 
            // otherwise keep them as .html.
            const urlMapping = {
                'dashboard': 'DashBoard.html',
                'clientcreation': 'ClientCreationForm.html',
                'loanapplication': 'LoanApplication.html',
                'pendingaccounts': 'PendingAccount.html',
                'accountsreceivable': 'AccountsReceivable.html',
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
    logoutButton.addEventListener('click', function() {
        // Redirect to the PHP script that handles session destruction
        window.location.href = 'PHP/check_logout.php'; 
    });
});
/*=============================================================================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const clientCreationForm = document.getElementById('clientCreationForm');
    const maritalStatusSelect = document.getElementById('maritalStatus');
    const genderSelect = document.getElementById('gender');
    const citySelect = document.getElementById('city');
    const barangaySelect = document.getElementById('barangay');
    const incomeSalarySelect = document.getElementById('incomeSalary');
    const validIdTypeSelect = document.getElementById('validIdType');
    const barangayClearanceCheck = document.getElementById('barangayClearanceCheck');
    const hasValidIdCheck = document.getElementById('hasValidIdCheck');
    
    const createButton = document.getElementById('create-button');

    // Async function to fetch data from the PHP handler and populate a select element
    const fetchAndPopulateSelect = async (element, endpoint, params = {}) => {
        try {
            element.disabled = true;
            element.innerHTML = '<option>Loading...</option>';

            const formData = new FormData();
            formData.append('type', endpoint);
            for (const key in params) {
                formData.append(key, params[key]);
            }
            
            // Log the FormData for debugging purposes
            console.log('Fetching data for:', endpoint, 'with params:', Object.fromEntries(formData));

            const response = await fetch('PHP/selectdatafetcher_handler.php', {
                method: 'POST',
                body: formData
            });

            // Log the full response to check its status
            console.log('Full Response:', response);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Log the parsed data to see what was returned
            console.log('Data received from PHP:', data);

            if (data.error) {
                alert(`Error: ${data.error}`); // Replaced showModal with alert
                return;
            }

            // Clear previous options
            element.innerHTML = '<option value="">Select...</option>';
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                element.appendChild(option);
            });

        } catch (error) {
            console.error('Fetch error:', error);
            alert('Failed to load data. Please check the server connection or console.'); // Replaced showModal with alert
        } finally {
            element.disabled = false;
        }
    };

    // Initial population of the dropdowns
    fetchAndPopulateSelect(maritalStatusSelect, 'maritalStatus');
    fetchAndPopulateSelect(genderSelect, 'gender');
    fetchAndPopulateSelect(citySelect, 'city');
    fetchAndPopulateSelect(incomeSalarySelect, 'incomeSalary');
    fetchAndPopulateSelect(validIdTypeSelect, 'validId');

    // Event listener for the city dropdown to populate the barangay dropdown
    citySelect.addEventListener('change', () => {
        const selectedCity = citySelect.value;
        if (selectedCity) {
            fetchAndPopulateSelect(barangaySelect, 'barangay', { city: selectedCity });
        } else {
            barangaySelect.innerHTML = '<option value="">Select a City first</option>';
            barangaySelect.disabled = true;
        }
    });
    
    // Disable valid ID select unless checkbox is checked
    validIdTypeSelect.disabled = !hasValidIdCheck.checked;
    hasValidIdCheck.addEventListener('change', () => {
        validIdTypeSelect.disabled = !hasValidIdCheck.checked;
        if (!hasValidIdCheck.checked) {
            validIdTypeSelect.value = ''; // Reset selection
        }
    });

    // Form submission handler
    clientCreationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(clientCreationForm);
        const data = Object.fromEntries(formData.entries());

        createButton.disabled = true;
        createButton.textContent = 'Creating...';

        // Convert checkbox values to 1 or 0
        data.hasBarangayClearance = barangayClearanceCheck.checked ? 1 : 0;
        data.hasValidId = hasValidIdCheck.checked ? 1 : 0;
        data.validIdType = hasValidIdCheck.checked ? validIdTypeSelect.value : null;

        // Client requirements validation: Check if at least one requirement is met
        if (data.hasValidId === 0 && data.hasBarangayClearance === 0) {
            alert('A client must provide at least one of the requirements (Valid ID or Barangay Clearance).'); // Replaced showModal with alert
            createButton.disabled = false;
            createButton.textContent = 'Create';
            return;
        }

        try {
            // Remove the keys from the original form which are replaced by the 'has' variables
            delete data.validId;
            delete data.barangayClearance;
            
            const response = await fetch('PHP/clientcreationform_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('Client created successfully! Client ID: ' + result.clientId); // Replaced showModal with alert
                clientCreationForm.reset();
            } else {
                alert(`Client creation failed: ${result.message}`); // Replaced showModal with alert
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred. Please try again.'); // Replaced showModal with alert
        } finally {
            createButton.disabled = false;
            createButton.textContent = 'Create';
        }
    });
});