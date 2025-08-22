import { BASE_AUTH_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const messageDiv = document.getElementById('message');

    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${BASE_AUTH_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Account created successfully! Please login.', 'success');
                
                // Redirect to login page after successful signup
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Signup failed', 'danger');
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', 'danger');
            console.error('Signup error:', error);
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
