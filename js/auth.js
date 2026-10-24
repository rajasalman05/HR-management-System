/* Login, first-run setup, guards, logout, change password, navbar */
const validEmail=e=>/^\S+@\S+\.\S+$/.test(e);
const homeFor=u=>ROOT+(u.role==='admin'?'pages/admin.html':'pages/employee.html');
function guard(roles){
  const u=currentUser();
  if(!u||!company()){location.replace(ROOT+'index.html');return null}
  if(!roles.includes(u.role)){location.replace(homeFor(u));return null}
  return u;
}
function logout(){localStorage.removeItem('hcm_session');location.href=ROOT+'index.html'}
function changePassword(){
  const u=currentUser(),old=prompt('Current password:');if(old===null)return;
  if(old!==u.password)return alert('Wrong current password.');
  const n=prompt('New password (min 4 characters):');if(n===null)return;
  if(n.length<4)return alert('Password too short.');
  const all=users();all.find(x=>x.id===u.id).password=n;saveUsers(all);alert('Password changed.');
}
function layout(active){
  const u=currentUser(),c=company();
  const links=u.role==='admin'?[['admin','Dashboard'],['employees','Employees'],['leaves','Leaves'],['payslip','Payslips'],['settings','Settings']]:[['employee','Dashboard'],['payslip','Payslip']];
  $('#nav').innerHTML='<b>🏢 '+esc(c.name)+'</b>'+links.map(l=>'<a href="'+ROOT+'pages/'+l[0]+'.html" class="'+(l[0]===active?'active':'')+'">'+l[1]+'</a>').join('')+
    '<span style="opacity:.7;font-size:13px">'+esc(u.name)+'</span><button onclick="toggleDark()" title="Dark mode">🌙</button><button onclick="changePassword()" title="Change password">🔑</button><button onclick="logout()">Logout</button>';
}
/* index.html logic */
if(document.body.dataset.page==='login'){
  const u0=currentUser();if(u0&&company())location.replace(homeFor(u0));
  const first=!company()||!users().some(u=>u.role==='admin');
  $('#setupBox').hidden=!first;$('#loginBox').hidden=first;
  $('#setupForm').addEventListener('submit',e=>{
    e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f));clearErrs(f);let ok=true;
    const bad=(n,m)=>{setErr(f,n,m);ok=false};
    if(!v.company.trim())bad('company','Required');
    if(!v.name.trim())bad('name','Required');
    if(!validEmail(v.email.trim()))bad('email','Enter a valid email');
    if(v.password.length<4)bad('password','Min 4 characters');
    if(!ok)return;
    DB.set('hcm_company',{name:v.company.trim(),start:'09:00',grace:15,quota:20,workingDays:[1,2,3,4,5],officeLat:null,officeLng:null,radius:200});
    const admin={id:Date.now(),name:v.name.trim(),email:v.email.trim().toLowerCase(),password:v.password,role:'admin',department:'Management',salary:0,joined:today()};
    saveUsers([admin]);DB.set('hcm_session',{id:admin.id});location.href='pages/admin.html';
  });
  $('#loginForm').addEventListener('submit',e=>{
    e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f));clearErrs(f);
    const u=users().find(x=>x.email.toLowerCase()===v.email.trim().toLowerCase()&&x.password===v.password);
    if(!u)return setErr(f,'password','Wrong email or password');
    DB.set('hcm_session',{id:u.id});location.href=homeFor(u);
  });
}
