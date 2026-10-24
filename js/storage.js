/* Shared helpers: localStorage read/write, dates, business-rule calculations */
const DB={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v===null||v===undefined?d:v}catch(e){return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const ROOT=location.pathname.includes('/pages/')?'../':'';
const pad=n=>String(n).padStart(2,'0');
const fmtDate=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>fmtDate(new Date());
const nowTime=()=>{const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes())};
const toMin=t=>{const p=t.split(':');return +p[0]*60+ +p[1]};
const parseD=s=>{const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const company=()=>DB.get('hcm_company',null);
const users=()=>DB.get('hcm_users',[]);
const saveUsers=u=>DB.set('hcm_users',u);
const employees=()=>users().filter(u=>u.role==='employee');
const allAttendance=()=>DB.get('hcm_attendance',[]);
const allLeaves=()=>DB.get('hcm_leaves',[]);
const currentUser=()=>{const s=DB.get('hcm_session',null);return s?users().find(u=>u.id===s.id)||null:null};
const isWorkingDay=ds=>(company().workingDays||[1,2,3,4,5]).includes(parseD(ds).getDay());
function datesBetween(from,to){const out=[];for(let d=parseD(from);d<=parseD(to);d.setDate(d.getDate()+1))out.push(fmtDate(d));return out}
const workingDaysBetween=(f,t)=>datesBetween(f,t).filter(isWorkingDay).length;
function monthRange(ym){const p=ym.split('-').map(Number);return[ym+'-01',ym+'-'+pad(new Date(p[0],p[1],0).getDate())]}
const onLeave=(uid,ds)=>allLeaves().some(l=>l.employeeId===uid&&l.status==='approved'&&l.from<=ds&&l.to>=ds);
const leaveUsed=(uid,withPending)=>allLeaves().filter(l=>l.employeeId===uid&&(l.status==='approved'||(withPending&&l.status==='pending'))).reduce((s,l)=>s+l.days,0);
const hoursWorked=r=>r.out?(toMin(r.out)-toMin(r.in))/60:0;
/* monthly summary for one employee: absent = working day, already passed, after joining, no record, not on approved leave */
function summary(uid,ym){
  const r=monthRange(ym),u=users().find(x=>x.id===uid),td=today();
  const recs=allAttendance().filter(a=>a.employeeId===uid&&a.date>=r[0]&&a.date<=r[1]);
  let absent=0,leaveDays=0;
  datesBetween(r[0],r[1]).filter(isWorkingDay).forEach(d=>{
    if(onLeave(uid,d)){leaveDays++;return}
    if(d<td&&d>=u.joined&&!recs.some(a=>a.date===d))absent++;
  });
  return{present:recs.length,late:recs.filter(a=>a.late).length,half:recs.filter(a=>a.status==='half').length,absent,leaveDays};
}
function attStatus(emp,date){
  const r=allAttendance().find(a=>a.employeeId===emp.id&&a.date===date);
  if(r)return r.status;
  if(onLeave(emp.id,date))return'on leave';
  if(!isWorkingDay(date)||date<emp.joined||date>today())return'-';
  return date===today()?'not checked in':'absent';
}
const clearErrs=f=>$$('.err',f).forEach(e=>e.textContent='');
const setErr=(f,n,m)=>{const e=$('[data-err="'+n+'"]',f);if(e)e.textContent=m};
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2500)}
function toggleDark(){const d=!document.body.classList.contains('dark');document.body.classList.toggle('dark',d);DB.set('hcm_dark',d)}
if(DB.get('hcm_dark',false))document.body.classList.add('dark');
function downloadCSV(name,rows){
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=name;a.click();
}
