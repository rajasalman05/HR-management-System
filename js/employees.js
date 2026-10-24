/* Manage employees: add (creates login), edit, delete, search, filter */
let editId = null;

function renderEmployees() {
    const q = $('#search').value.toLowerCase(), dep = $('#depFilter').value;
    const deps = [...new Set(employees().map(e => e.department))].sort();
    
    $('#depFilter').innerHTML = '<option value="">All departments</option>' + deps.map(d => '<option ' + (d === dep ? 'selected' : '') + '>' + esc(d) + '</option>').join('');
    $('#depList').innerHTML = deps.map(d => '<option value="' + esc(d) + '">').join('');
    
    const rows = employees().filter(e => (e.name + ' ' + e.email + ' ' + (e.empId || '') + ' ' + (e.fatherName || '')).toLowerCase().includes(q) && (!dep || e.department === dep));
    
    $('#tbody').innerHTML = rows.map(e => `
        <tr>
            <td><b>${esc(e.empId || '-')}</b></td>
            <td>${esc(e.name)}</td>
            <td>${esc(e.fatherName || '-')}</td>
            <td>${esc(e.department)}</td>
            <td>${esc(e.phone || '-')}</td>
            <td>${esc(e.email)}</td>
            <td>${e.salary}</td>
            <td>${e.joined}</td>
            <td>
                <button class="btn sm" onclick="editEmp(${e.id})">Edit</button>
                <button class="btn sm bad" onclick="delEmp(${e.id})">Delete</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="9" style="text-align:center;">No employees yet</td></tr>';
}

function resetForm() {
    editId = null;
    $('#empForm').reset();
    clearErrs($('#empForm'));
    $('#formTitle').textContent = 'Add New Employee';
    $('#cancelEdit').hidden = true;
    
    const empIdField = $('#empIdInput');
    if (empIdField) {
        empIdField.value = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
    }
}

function editEmp(id) {
    const u = users().find(x => x.id === id), f = $('#empForm');
    editId = id;
    
    f.name.value = u.name || '';
    f.fatherName.value = u.fatherName || '';
    f.empId.value = u.empId || ('EMP-' + Math.floor(1000 + Math.random() * 9000));
    f.phone.value = u.phone || '';
    f.department.value = u.department || '';
    f.salary.value = u.salary || '';
    f.email.value = u.email || '';
    f.password.value = '';
    
    $('#formTitle').textContent = 'Edit Employee (leave password blank to keep it)';
    $('#cancelEdit').hidden = false;
    scrollTo(0, 0);
}

function delEmp(id) {
    if (!confirm('Delete this employee and all their attendance and leaves?')) return;
    saveUsers(users().filter(u => u.id !== id));
    DB.set('hcm_attendance', allAttendance().filter(a => a.employeeId !== id));
    DB.set('hcm_leaves', allLeaves().filter(l => l.employeeId !== id));
    if (editId === id) resetForm();
    renderEmployees();
}

function saveEmployee(e) {
    e.preventDefault();
    const f = e.target, v = Object.fromEntries(new FormData(f));
    clearErrs(f);
    let ok = true;
    const bad = (n, m) => { setErr(f, n, m); ok = false; };

    v.name = (v.name || '').trim();
    v.fatherName = (v.fatherName || '').trim();
    v.empId = (v.empId || '').trim();
    v.phone = (v.phone || '').trim();
    v.email = (v.email || '').trim().toLowerCase();
    v.department = (v.department || '').trim();

    if (!v.name) bad('name', 'Required');
    if (!v.fatherName) bad('fatherName', 'Required');
    if (!v.empId) bad('empId', 'Required');
    if (!v.phone) bad('phone', 'Required');
    if (!v.email) bad('email', 'Required');
    else if (!validEmail(v.email)) bad('email', 'Enter a valid email');
    else if (users().some(u => u.email.toLowerCase() === v.email && u.id !== editId)) bad('email', 'This email is already used');

    if (users().some(u => u.empId === v.empId && u.id !== editId)) bad('empId', 'This Employee ID is already used');

    if ((!editId || v.password) && v.password.length < 4) bad('password', 'Min 4 characters');
    if (!v.department) bad('department', 'Required');
    if (!(+v.salary > 0)) bad('salary', 'Salary must be greater than 0');

    if (!ok) return;

    const all = users();
    if (editId) {
        const u = all.find(x => x.id === editId);
        Object.assign(u, {
            name: v.name,
            fatherName: v.fatherName,
            empId: v.empId,
            phone: v.phone,
            email: v.email,
            department: v.department,
            salary: +v.salary
        });
        if (v.password) u.password = v.password;
    } else {
        all.push({
            id: Date.now(),
            name: v.name,
            fatherName: v.fatherName,
            empId: v.empId,
            phone: v.phone,
            email: v.email,
            password: v.password,
            role: 'employee',
            department: v.department,
            salary: +v.salary,
            joined: today()
        });
    }

    saveUsers(all);
    toast(editId ? 'Employee updated successfully!' : 'Employee added & login created!');
    resetForm();
    renderEmployees();
}