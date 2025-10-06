/* This block contains the original navigation logic and logout handler, kept for completeness. */
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
                // 1. Define the action for the audit log
                const actionDescription = `Maps to ${this.textContent} (${targetPage})`;

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
                console.error('No page defined for this link:', linkText);
            }
        });
    });

    // Handle the logout button securely
    // NOTE: The PHP script 'PHP/check_logout.php' will now handle the log *before* session destruction.
    logoutButton.addEventListener('click', function() {
        window.location.href = 'PHP/check_logout.php'; 
    });
});

/*=============================================================================================================================================================================*/
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.clients-table-body');
    const searchInput = document.getElementById('searchInput');
    const sortableHeaders = document.querySelectorAll('.sortable-header'); // 💡 NEW: Select sortable headers
    let allClientData = []; // Variable to store all fetched data
    // 💡 NEW: Variables to track current sort state
    let currentSort = {
        key: null,
        direction: 'asc' // 'asc' or 'desc'
    };


    if (!tableBody) {
        console.error('Clients table body not found.');
        return;
    }

    tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">Loading client data...</div>`;

    // Function to calculate the next payment date (KEPT AS IS)
    const calculateNextPaymentDate = (startDate, frequency, lastPaymentDate) => {
        let currentDate = new Date(startDate);
        
        if (isNaN(currentDate.getTime())) {
            return 'Date Error';
        }

        if (!lastPaymentDate) {
            return currentDate.toLocaleDateString();
        }

        const lastPayment = new Date(lastPaymentDate);

        while (currentDate <= lastPayment) {
            if (frequency === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (frequency === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                return 'N/A';
            }
        }
        
        if (isNaN(currentDate.getTime())) {
            return 'Date Error';
        }

        return currentDate.toLocaleDateString();
    };

    // 💡 NEW: Helper function to get the display name
    const getFullName = (item) => {
        return `${item.first_name} ${item.middle_name ? item.middle_name + ' ' : ''}${item.last_name}`;
    };
    
    // 💡 NEW: Helper function to get the next payment date for sorting
    const getNextPaymentDateForSorting = (item) => {
        if (item.balance > 0.01 && item.date_start && item.payment_frequency) {
            const calculatedDate = calculateNextPaymentDate(item.date_start, item.payment_frequency, item.last_payment_date);
            // Return the raw date string for comparison or a value that pushes 'N/A' to the end.
            return (calculatedDate && calculatedDate !== 'Invalid Date' && calculatedDate !== 'Date Error' && calculatedDate !== 'N/A') ? new Date(calculatedDate).getTime() : Infinity; 
        }
        return Infinity; // Put N/A items at the end
    }

    // 💡 NEW: Function to handle sorting logic
    const sortData = (data, key, direction) => {
        return data.sort((a, b) => {
            let aValue, bValue;

            if (key === 'name') {
                aValue = getFullName(a).toLowerCase();
                bValue = getFullName(b).toLowerCase();
            } else if (key === 'date') {
                aValue = getNextPaymentDateForSorting(a);
                bValue = getNextPaymentDateForSorting(b);
                
                // Special handling for dates (Infinity = N/A)
                if (aValue === Infinity && bValue !== Infinity) return direction === 'asc' ? 1 : -1;
                if (aValue !== Infinity && bValue === Infinity) return direction === 'asc' ? -1 : 1;
                
                return (aValue - bValue) * (direction === 'asc' ? 1 : -1);

            } else if (key === 'balance') {
                // Balance is a number (raw balance from the item)
                aValue = parseFloat(a.balance || 0);
                bValue = parseFloat(b.balance || 0);
            } else {
                // Default to string comparison for all others
                aValue = String(a[key]).toLowerCase();
                bValue = String(b[key]).toLowerCase();
            }

            // For numbers (like balance), the logic is different
            if (key === 'balance' || key === 'date') {
                return (aValue - bValue) * (direction === 'asc' ? 1 : -1);
            }

            // For strings (like name)
            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // NEW: Function to update sort icons
    const updateSortIcons = () => {
        sortableHeaders.forEach(header => {
            header.classList.remove('sorted');
            const icon = header.querySelector('.sort-icon');
            if (icon) {
                icon.textContent = '↕'; // Default icon
            }
            
            if (header.dataset.sortKey === currentSort.key) {
                header.classList.add('sorted');
                if (icon) {
                    icon.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
                }
            }
        });
    };

    // Function to render the table with the given data
    const renderTable = (dataToRender) => {
        // ... (renderTable logic is mostly the same, using getFullName) ...
        if (!Array.isArray(dataToRender) || dataToRender.length === 0) {
            tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">No client data found.</div>`;
            return;
        }

        tableBody.innerHTML = '';
        
        dataToRender.forEach(item => {
            const fullName = getFullName(item); // Use the helper function
            
            let nextPaymentDate;
            
            // Recalculate nextPaymentDate for display
            if (item.balance > 0.01 && item.date_start && item.payment_frequency) {
                const calculatedDate = calculateNextPaymentDate(item.date_start, item.payment_frequency, item.last_payment_date);
                
                if (calculatedDate && calculatedDate !== 'Invalid Date' && calculatedDate !== 'Date Error') {
                    nextPaymentDate = calculatedDate;
                } else {
                    nextPaymentDate = 'Date Error'; 
                }
            } else {
                // Fully Paid or No Loan: Display N/A
                nextPaymentDate = 'N/A';
            }
            
            const balanceDisplay = item.balance_display; 

            const row = document.createElement('div');
            row.className = item.client_ID ? 'clients-row clickable-row' : 'clients-row'; 
            row.dataset.clientId = item.client_ID; 

            row.innerHTML = `
                <div class="clients-cell">${fullName}</div>
                <div class="clients-cell">${item.phone_number || ''}</div>
                <div class="clients-cell">${nextPaymentDate}</div>
                <div class="clients-cell">${balanceDisplay}</div>`; 

            if (item.client_ID) {
                row.addEventListener('click', function() {
                    const clientId = this.dataset.clientId;
                    window.location.href = `LedgersView.html?client_id=${clientId}`;
                });
            }
            
            tableBody.appendChild(row);
        });
        
        // Update icons after rendering
        updateSortIcons();
    };

    // Function to handle search input (UPDATED to call renderTable with filtered *and sorted* data)
    const handleSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        let dataToDisplay = allClientData;
        
        if (searchTerm !== '') {
            dataToDisplay = allClientData.filter(item => {
                const fullName = getFullName(item).toLowerCase(); // Use helper function
                const clientId = String(item.client_ID).toLowerCase();
                const loanId = String(item.loan_ID).toLowerCase(); 

                // Search by Client ID, Loan ID, or Name
                return clientId.includes(searchTerm) || 
                       loanId.includes(searchTerm) ||
                       fullName.includes(searchTerm);
            });
        }

        // Re-sort the filtered or unfiltered data
        if (currentSort.key) {
            dataToDisplay = sortData([...dataToDisplay], currentSort.key, currentSort.direction);
        }

        renderTable(dataToDisplay);
    };

    // 💡 NEW: Event listener for sortable headers
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const key = this.dataset.sortKey;
            
            if (!key) return;

            // Determine the new sort direction
            if (currentSort.key === key) {
                // Toggle direction if same key is clicked
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // New key clicked, set to default ascending
                currentSort.key = key;
                currentSort.direction = 'asc';
            }

            // Re-sort the data based on the new state
            let dataToDisplay = allClientData;
            
            // Preserve search filter if one is active
            const searchTerm = searchInput.value.toLowerCase().trim();
            if (searchTerm !== '') {
                dataToDisplay = allClientData.filter(item => {
                    const fullName = getFullName(item).toLowerCase();
                    const clientId = String(item.client_ID).toLowerCase();
                    const loanId = String(item.loan_ID).toLowerCase(); 

                    return clientId.includes(searchTerm) || 
                           loanId.includes(searchTerm) ||
                           fullName.includes(searchTerm);
                });
            }

            // Sort the current view (filtered or unfiltered)
            const sortedData = sortData(dataToDisplay, currentSort.key, currentSort.direction);
            
            renderTable(sortedData);
        });
    });

    // Fetch data and attach listeners
    fetch('PHP/ledger_handler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched client data:', data);

            if (!Array.isArray(data)) {
                allClientData = [];
            } else {
                allClientData = data; // Store the fetched data
            }

            // Initial render (no sorting applied yet, or apply default sort if desired)
            renderTable(allClientData);
            
            // Attach the search event listener
            if (searchInput) {
                searchInput.addEventListener('input', handleSearch);
            }
        })
        .catch(error => {
            console.error('Error fetching client data:', error);
            tableBody.innerHTML = `<div style="padding: 10px; text-align: center;">Error loading data. Check the browser console for details.</div>`;
        });
});