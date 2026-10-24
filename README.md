# HCM Lite (Beginner Track)
HTML + CSS + JavaScript only. No backend: data lives in `localStorage`.

## How to use
1. Open `index.html` (best via Live Server / GitHub Pages / Netlify / Vercel; camera needs https or localhost).
2. First run: create the company and the Admin account.
3. Admin -> **Settings**: start time, grace minutes, leave quota, working days (and optional office location).
4. Admin -> **Employees**: add employee (this creates their login: email + password).
5. Employee logs in: check in/out, apply leave, ask the helper, view payslip.
6. Admin -> **Leaves**: approve/reject with a comment. **Payslips**: pick employee + month, then print/save as PDF.

## Business rules
Late = check-in after start + grace. Under 5 hours worked = half day. No record on a past working day (not on approved leave) = absent.
Leave: working days only, no overlaps, cannot exceed quota. Payslip: per day = salary / working days; deduction = per day x (absent + 0.5 x half); net = salary - deduction.

## Smart helper
Admin: "How many employees do we have?", "Who is on leave today?", "Who was late today?", "Who is absent?", "Pending leaves?"
Employee: "How many leaves do I have left?", "Was I late today?", "How many hours did I work this week?" (own data only).

## Bonus done
Camera check-in (getUserMedia + geolocation + face-api.js), Chart.js charts, dark mode, CSV export, printable monthly report.

## Files
index.html, pages/*.html, css/style.css, js/storage.js, auth.js, employees.js, attendance.js, leave.js, helper.js
Note: passwords are plain text in localStorage (learning project only).
