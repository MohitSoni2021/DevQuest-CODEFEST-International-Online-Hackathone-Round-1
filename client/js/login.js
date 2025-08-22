import { BASE_AUTH_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${BASE_AUTH_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data));
                
                showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showMessage(data.message || 'Login failed', 'danger');
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', 'danger');
            console.error('Login error:', error);
        }
    });

    function showMessage(message, type) {
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
});
