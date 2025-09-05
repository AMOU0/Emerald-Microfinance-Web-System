
function checkSessionAndRedirect() {
    // We use a fetch request to query a small PHP script on the server.
    fetch('PHP/check_session.php')
        .then(response => response.json())
        .then(data => {
            // If the PHP script returns 'inactive', redirect the user.
            if (data.status === 'inactive') {
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Error checking session:', error);
            // In case of an error, it's safer to redirect to prevent unauthorized access.
            window.location.href = 'login.html';
        });
}
