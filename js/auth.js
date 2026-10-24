/* Login, first-run setup, guards, logout, change password, navbar, and eye toggle */
const validEmail = e => /^\S+@\S+\.\S+$/.test(e);

// Relative root path calculator
const getRoot = () => (location.pathname.includes('/pages/') ? '../' : './');

const homeFor = u => getRoot() + (u.role === 'admin' ? 'pages/admin.html' : 'pages/employee.html');

function guard(roles) {
    const u = currentUser();
    const c = company();
    if (!u || !c) {
        location.replace(getRoot() + 'index.html');
        return null;
    }
    if (!roles.includes(u.role)) {
        location.replace(homeFor(u));
        return null;
    }
    return u;
}

function logout() {
    localStorage.removeItem('hcm_session');
    location.href = getRoot() + 'index.html';
}

function changePassword() {
    const u = currentUser();
    if (!u) return;
    const oldPass = prompt('Current password:');
    if (oldPass === null) return;
    if (oldPass !== u.password) return alert('Wrong current password.');

    const newPass = prompt('New password (min 4 characters):');
    if (newPass === null) return;
    if (newPass.length < 4) return alert('Password too short.');

    const all = users();
    const target = all.find(x => x.id === u.id);
    if (target) {
        target.password = newPass;
        saveUsers(all);
        alert('Password updated successfully!');
    }
}

// Password show/hide eye toggle function
function togglePassword(fieldId, iconElem) {
    const field = document.getElementById(fieldId);
    if (field) {
        if (field.type === 'password') {
            field.type = 'text';
            iconElem.textContent = '👁️‍🗨️'; 
        } else {
            field.type = 'password';
            iconElem.textContent = '👁️';
        }
    }
}

// Forgot Password simple recovery feature
function forgotPassword(e) {
    e.preventDefault();
    const emailInput = prompt('Enter your registered email address to reset password:');
    if (!emailInput) return;

    const allUsers = users();
    const targetUser = allUsers.find(x => x.email.toLowerCase() === emailInput.trim().toLowerCase());

    if (!targetUser) {
        alert('No account found with this email address.');
        return;
    }

    const newPass = prompt('Account found! Enter a new password (min 4 characters):');
    if (newPass === null) return;
    if (newPass.length < 4) {
        alert('Password too short. Minimum 4 characters required.');
        return;
    }

    targetUser.password = newPass;
    saveUsers(allUsers);
    alert('Password has been reset successfully! You can now login with your new password.');
}

// Toggle between Login, Setup and Register boxes
function showRegister(e) {
    e.preventDefault();
    const setupBox = $('#setupBox');
    const loginBox = $('#loginBox');
    const registerBox = $('#registerBox');
    if (setupBox) setupBox.hidden = true;
    if (loginBox) loginBox.hidden = true;
    if (registerBox) registerBox.hidden = false;
}

function showLogin(e) {
    e.preventDefault();
    const setupBox = $('#setupBox');
    const loginBox = $('#loginBox');
    const registerBox = $('#registerBox');
    if (setupBox) setupBox.hidden = true;
    if (registerBox) registerBox.hidden = true;
    if (loginBox) loginBox.hidden = false;
}

// Mobile-friendly Navbar with Toggle Support
function layout(active) {
    const u = currentUser(), c = company();
    if (!u || !c) return;

    const links = u.role === 'admin' 
        ? [['admin', 'Dashboard'], ['employees', 'Employees'], ['leaves', 'Leaves'], ['payslip', 'Payslips'], ['settings', 'Settings']]
        : [['employee', 'Dashboard'], ['payslip', 'Payslip']];

    const rootPath = getRoot();
    
    const navHTML = `
        <b>🏢 ${esc(c.name)}</b>
        <div class="nav-links" id="navLinks">
            ${links.map(l => `<a href="${rootPath}pages/${l[0]}.html" class="${l[0] === active ? 'active' : ''}">${l[1]}</a>`).join('')}
        </div>
        <div class="nav-actions">
            <span class="user-name">👤 ${esc(u.name)}</span>
            <button onclick="toggleDark()" title="Toggle Theme" class="btn-icon">🌙</button>
            <button onclick="changePassword()" title="Change Password" class="btn-icon">🔑</button>
            <button onclick="logout()" class="btn-logout">Logout</button>
        </div>
    `;

    const navElem = $('#nav');
    if (navElem) {
        navElem.innerHTML = navHTML;
    }
}

/* index.html Page Logic */
if (document.body.dataset.page === 'login') {
    const u0 = currentUser();
    if (u0 && company()) {
        location.replace(homeFor(u0));
    }

    const first = !company() || !users().some(u => u.role === 'admin');
    
    const setupBox = $('#setupBox');
    const loginBox = $('#loginBox');
    const registerBox = $('#registerBox');
    
    if (setupBox && loginBox) {
        setupBox.hidden = !first;
        loginBox.hidden = first;
        if (registerBox) registerBox.hidden = true;
    }

    const setupForm = $('#setupForm');
    if (setupForm) {
        setupForm.addEventListener('submit', async e => {
            e.preventDefault();
            const f = e.target, v = Object.fromEntries(new FormData(f));
            clearErrs(f);
            let ok = true;
            const bad = (n, m) => { setErr(f, n, m); ok = false; };

            if (!v.company || !v.company.trim()) bad('company', 'Required');
            if (!v.name || !v.name.trim()) bad('name', 'Required');
            if (!validEmail((v.email || '').trim())) bad('email', 'Enter a valid email');
            if ((v.password || '').length < 4) bad('password', 'Min 4 characters');

            if (!ok) return;

            const compObj = {
                id: 1,
                name: v.company.trim(),
                start: '09:00',
                grace: 15,
                quota: 20,
                workingdays: [1, 2, 3, 4, 5],
                office_lat: null,
                office_lng: null,
                radius: 200
            };

            DB.set('hcm_company', {
                id: 1,
                name: compObj.name,
                start: compObj.start,
                grace: compObj.grace,
                quota: compObj.quota,
                workingDays: compObj.workingdays,
                officeLat: null,
                officeLng: null,
                radius: 200
            });

            // Save Company to Supabase Cloud so Foreign Key works for employees!
            if (typeof supabaseClient !== 'undefined') {
                await supabaseClient.from('companies').upsert(compObj);
            }

            const admin = {
                id: Date.now(),
                companyId: 1,
                name: v.name.trim(),
                email: v.email.trim().toLowerCase(),
                password: v.password,
                role: 'admin',
                department: 'Management',
                salary: 0,
                joined: today()
            };

            saveUsers([admin]);
            DB.set('hcm_session', { id: admin.id });
            location.href = 'pages/admin.html';
        });
    }

    const loginForm = $('#loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const f = e.target, v = Object.fromEntries(new FormData(f));
            clearErrs(f);

            const u = users().find(x => x.email.toLowerCase() === (v.email || '').trim().toLowerCase() && x.password === v.password);
            if (!u) return setErr(f, 'password', 'Wrong email or password');

            DB.set('hcm_session', { id: u.id });
            location.href = homeFor(u);
        });
    }

    const registerForm = $('#registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            clearErrs(registerForm);
            
            const formData = new FormData(registerForm);
            const name = formData.get('name').trim();
            const email = formData.get('email').trim().toLowerCase();
            const password = formData.get('password');

            let ok = true;
            const bad = (n, m) => { setErr(registerForm, n, m); ok = false; };

            if (!name) bad('name', 'Name is required');
            if (!validEmail(email)) bad('email', 'Enter a valid email');
            if (!password || password.length < 4) bad('password', 'Password must be at least 4 chars');

            if (!ok) return;

            const currentUsers = users();
            if (currentUsers.some(u => u.email === email)) {
                bad('email', 'Email already registered');
                return;
            }

            const comp = company();
            const newUser = {
                id: Date.now(),
                companyId: comp ? comp.id : 1,
                name: name,
                email: email,
                password: password,
                role: currentUsers.length === 0 ? 'admin' : 'employee',
                department: 'General',
                salary: 0,
                joined: today()
            };

            currentUsers.push(newUser);
            saveUsers(currentUsers); // Storage.js ke zariye Supabase par sync ho jayega!

            toast('Registration successful! Please login.');
            registerForm.reset();
            if (registerBox) registerBox.hidden = true;
            if (loginBox) loginBox.hidden = false;
        });
    }
}