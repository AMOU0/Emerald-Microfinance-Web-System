document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('clientCreationForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const createButton = document.getElementById('create-button');
        createButton.disabled = true;
        createButton.textContent = 'Creating...';

        // Add checkbox values to the data object
        data.validId = form.elements.validId.checked;
        data.barangayClearance = form.elements.barangayClearance.checked;
        data.cr = form.elements.cr.checked;

        // Basic validation for required fields
        const requiredFields = [
            'lastName', 'firstName', 'middleName', 'maritalStatus', 'gender',
            'dateOfBirth', 'city', 'barangay', 'postalCode', 'streetAddress',
            'phoneNumber', 'incomeSalary', 'guarantorLastName', 'guarantorFirstName',
            'guarantorMiddleName', 'guarantorMaritalStatus', 'guarantorGender',
            'guarantorDateOfBirth', 'guarantorCity', 'guarantorBarangay',
            'guarantorPostalCode', 'guarantorStreetAddress', 'guarantorPhoneNumber',
            'guarantorIncomeSalary'
        ];

        for (const field of requiredFields) {
            if (!data[field]) {
                alert(`Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                createButton.disabled = false;
                createButton.textContent = 'Create';
                return;
            }
        }

        // Validate if at least one requirement checkbox is checked
        if (!data.validId && !data.barangayClearance && !data.cr) {
            alert('Please select at least one requirement.');
            createButton.disabled = false;
            createButton.textContent = 'Create';
            return;
        }

        try {
            const response = await fetch('PHP/clientcreationform_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                alert('Client created successfully!');
                form.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            createButton.disabled = false;
            createButton.textContent = 'Create';
        }
    });
});