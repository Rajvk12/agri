// auth.js - Handles AgriXpress Signup & Login Interactivity (Backend Connected)

const API_URL = 'http://localhost:3000/api';

// --- SIGNUP LOGIC ---
const signupForm = document.getElementById('signup-form');
const sendOtpBtn = document.getElementById('send-otp-btn');
const otpSection = document.getElementById('otp-section');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const otpStatus = document.getElementById('otp-status');
const createAccountBtn = document.getElementById('create-account-btn');
const signupPhone = document.getElementById('signup-phone');
const signupOtp = document.getElementById('signup-otp');
let otpVerified = false;

// --- Handle Send OTP button click ---
sendOtpBtn.addEventListener('click', async function() {
    const phone = signupPhone.value.trim();
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
        const res = await fetch(`${API_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (data.success) {
            otpSection.style.display = 'block';
            otpStatus.textContent = 'OTP sent!';
            otpStatus.style.color = 'green';
            signupOtp.value = '';
            otpVerified = false;
            createAccountBtn.disabled = true;
            alert('OTP sent to your phone!');
        } else {
            otpStatus.textContent = data.error || 'Failed to send OTP';
            otpStatus.style.color = 'red';
            otpSection.style.display = 'none';
            alert(data.error || 'Failed to send OTP');
        }
    } catch (err) {
        otpStatus.textContent = 'Network error';
        otpStatus.style.color = 'red';
        otpSection.style.display = 'none';
        alert('Network error while sending OTP');
    }
    btn.disabled = false;
    btn.textContent = 'Send OTP';
});

// Verify OTP (calls backend)
verifyOtpBtn.addEventListener('click', async () => {
    const phone = signupPhone.value.trim();
    const otp = signupOtp.value.trim();
    try {
        const res = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });
        const data = await res.json();
        if (data.success) {
            otpVerified = true;
            otpStatus.textContent = 'OTP Verified!';
            otpStatus.style.color = 'green';
            checkSignupFormValidity();
        } else {
            otpStatus.textContent = data.error || 'Invalid OTP';
            otpStatus.style.color = 'red';
            otpVerified = false;
            createAccountBtn.disabled = true;
        }
    } catch (err) {
        otpStatus.textContent = 'Network error';
        otpStatus.style.color = 'red';
        otpVerified = false;
        createAccountBtn.disabled = true;
    }
});

// Password show/hide toggles
function setupPasswordToggle(toggleBtnId, inputId) {
    const btn = document.getElementById(toggleBtnId);
    const input = document.getElementById(inputId);
    btn.addEventListener('click', () => {
        if (input.type === 'password') {
            input.type = 'text';
            btn.querySelector('span').classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            btn.querySelector('span').classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
}
setupPasswordToggle('toggle-signup-password', 'signup-password');
setupPasswordToggle('toggle-signup-confirm-password', 'signup-confirm-password');
setupPasswordToggle('toggle-login-password', 'login-password');

// Role dropdown logic
const signupRole = document.getElementById('signup-role');
const orgFarmGroup = document.getElementById('org-farm-group');
signupRole.addEventListener('change', () => {
    if (signupRole.value === 'Farmer' || signupRole.value === 'Service Partner') {
        orgFarmGroup.style.display = 'block';
    } else {
        orgFarmGroup.style.display = 'none';
    }
});

// Location detection
const detectLocationBtn = document.getElementById('detect-location-btn');
const locationStatus = document.getElementById('location-status');
const manualLocationGroup = document.getElementById('manual-location-group');
const manualLocation = document.getElementById('manual-location');
const signupLocation = document.getElementById('signup-location');

detectLocationBtn.addEventListener('click', () => {
    locationStatus.textContent = 'Detecting...';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const coords = pos.coords.latitude + ',' + pos.coords.longitude;
                signupLocation.value = coords;
                locationStatus.textContent = 'Location detected!';
                manualLocationGroup.style.display = 'none';
            },
            err => {
                locationStatus.textContent = 'Failed. Enter manually.';
                manualLocationGroup.style.display = 'block';
            }
        );
    } else {
        locationStatus.textContent = 'Not supported. Enter manually.';
        manualLocationGroup.style.display = 'block';
    }
});
manualLocation.addEventListener('input', () => {
    signupLocation.value = manualLocation.value;
});

// Enable Create Account only if all required fields are valid and OTP verified
function checkSignupFormValidity() {
    const formValid = signupForm.checkValidity();
    const termsChecked = document.getElementById('signup-terms').checked;
    if (formValid && otpVerified && termsChecked) {
        createAccountBtn.disabled = false;
    } else {
        createAccountBtn.disabled = true;
    }
}
signupForm.addEventListener('input', checkSignupFormValidity);
document.getElementById('signup-terms').addEventListener('change', checkSignupFormValidity);

// Signup submit (calls backend)
signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!otpVerified) {
        otpStatus.textContent = 'Please verify OTP';
        otpStatus.style.color = 'red';
        return;
    }
    if (!signupForm.checkValidity()) {
        signupForm.reportValidity();
        return;
    }
    if (document.getElementById('signup-password').value !== document.getElementById('signup-confirm-password').value) {
        alert('Passwords do not match!');
        return;
    }
    // Gather form data
    const data = {
        fullName: document.getElementById('signup-fullname').value.trim(),
        phone: signupPhone.value.trim(),
        email: document.getElementById('signup-email').value.trim(),
        password: document.getElementById('signup-password').value,
        role: signupRole.value,
        orgFarm: document.getElementById('signup-org').value.trim(),
        location: signupLocation.value
    };
    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            localStorage.setItem('token', result.token);
            window.location.href = '/dashboard.html';
        } else {
            alert(result.error || 'Signup failed');
        }
    } catch (err) {
        alert('Network error');
    }
});

// Show/hide farmer fields based on role selection
document.querySelectorAll('input[name="roles"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const farmerFields = document.getElementById('farmerFields');
        if (document.getElementById('roleFarmer').checked) {
            farmerFields.style.display = 'block';
        } else {
            farmerFields.style.display = 'none';
        }
    });
});

// --- LOGIN LOGIC ---
const loginForm = document.getElementById('login-form');
const loginDetectLocationBtn = document.getElementById('login-detect-location-btn');
const loginLocationStatus = document.getElementById('login-location-status');
const loginLocation = document.getElementById('login-location');

// Location access for login
loginDetectLocationBtn.addEventListener('click', () => {
    loginLocationStatus.textContent = 'Detecting...';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                loginLocation.value = `${latitude},${longitude}`;
                loginLocationStatus.textContent = 'Location detected!';
            },
            err => {
                loginLocationStatus.textContent = 'Failed to detect.';
            }
        );
    } else {
        loginLocationStatus.textContent = 'Not supported.';
    }
});

// Add login logic with verify button and role selection
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const location = loginLocation.value;
    // Get selected role if present
    let selectedRole = null;
    const roleSelect = document.getElementById('login-role');
    if (roleSelect && roleSelect.style.display !== 'none' && roleSelect.value) {
        selectedRole = roleSelect.value;
    }
    let loginData = {
        identifier,
        password,
        location
    };
    if (selectedRole) loginData.role = selectedRole;
    // Fallback for legacy forms with separate phone/email fields
    const phoneField = document.getElementById('login-phone');
    const emailField = document.getElementById('login-email');
    if (!identifier && phoneField && phoneField.value) loginData.phone = phoneField.value.trim();
    if (!identifier && emailField && emailField.value) loginData.email = emailField.value.trim();

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            window.location.href = 'dashboard.html';
        } else if (data.pendingVerification) {
            // Show verify section/modal
            showVerifySection(data.roles || []);
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (err) {
        console.error(err);
        alert('Login failed. Please try again.');
    }
});

// Show verify section/modal for role selection and email verification
function showVerifySection(roles) {
    // Create modal dynamically if not present
    let modal = document.getElementById('verifyModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'verifyModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.innerHTML = `
            <div style="background:white;padding:2rem;border-radius:10px;max-width:400px;width:100%;text-align:center;">
                <h3>Email Verification Required</h3>
                <div id="roleSelectContainer"></div>
                <button id="verifyEmailBtn" class="btn btn-success mt-3">Verify Email</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    // Populate roles
    const roleSelectContainer = modal.querySelector('#roleSelectContainer');
    if (roles.length > 0) {
        let html = '<label>Select Role:</label><br><select id="verifyRoleSelect" class="form-select mt-2">';
        roles.forEach(r => html += `<option value="${r}">${r}</option>`);
        html += '</select>';
        roleSelectContainer.innerHTML = html;
    } else {
        roleSelectContainer.innerHTML = '';
    }
    // Show modal
    modal.style.display = 'flex';
    // Verify button logic
    modal.querySelector('#verifyEmailBtn').onclick = async function() {
        const selectedRole = roles.length > 0 ? document.getElementById('verifyRoleSelect').value : null;
        try {
            const res = await fetch('/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole })
            });
            const result = await res.json();
            if (result.success) {
                alert('Email verified! You can now access the dashboard.');
                modal.style.display = 'none';
                window.location.href = 'dashboard.html';
            } else {
                alert(result.error || 'Verification failed.');
            }
        } catch (err) {
            alert('Network error during verification.');
        }
    };
}

// Forgot password link (demo)
document.getElementById('forgot-password-link').addEventListener('click', function(e) {
    e.preventDefault();
    alert('Forgot password flow coming soon!');
});

// Utility: close modal by clicking outside content
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal(modal.id);
    });
});
