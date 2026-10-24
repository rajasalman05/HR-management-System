/* Smart helper: keyword matching, answers from real app data. Employees only get own data. */
function answer(q,u){
  const t=q.toLowerCase(),c=company(),td=today(),A=allAttendance().filter(r=>r.date===td);
  const emps=employees(),nm=id=>(emps.find(e=>e.id===id)||{name:'?'}).name,list=a=>a.length?a.join(', '):'nobody';
  if(u.role==='admin'){
    if(/how many/.test(t)&&/employee|staff/.test(t))return'We have '+emps.length+' employees.';
    if(/department/.test(t)){const m={};emps.forEach(e=>m[e.department]=(m[e.department]||0)+1);return Object.keys(m).map(k=>k+': '+m[k]).join(', ')||'No employees yet.'}
    if(/leave/.test(t)&&/pending|request/.test(t))return allLeaves().filter(l=>l.status==='pending').length+' leave request(s) are pending.';
    if(/leave/.test(t)){const a=emps.filter(e=>onLeave(e.id,td)).map(e=>e.name);return a.length+' employee(s) on leave today: '+list(a)+'.'}
    if(/late/.test(t)){const a=A.filter(r=>r.late).map(r=>nm(r.employeeId));return a.length+' late today: '+list(a)+'.'}
    if(/absent|not checked/.test(t)){const a=emps.filter(e=>attStatus(e,td)==='not checked in').map(e=>e.name);return a.length+' not checked in yet: '+list(a)+'.'}
    if(/present|checked in|attendance/.test(t))return A.length+' employee(s) checked in today.';
    return'Try: "How many employees do we have?", "Who is on leave today?", "Who was late today?", "Who is absent?", "Pending leaves?"';
  }
  const mine=allAttendance().filter(r=>r.employeeId===u.id);
  if(/employee|everyone|colleague|team|who (is|was)/.test(t))return'Sorry, I can only answer about your own data.';
  if(/leave|balance|left|remaining/.test(t)){const used=leaveUsed(u.id);return'You have '+(c.quota-used)+' leave day(s) left (quota '+c.quota+', used '+used+', pending '+(leaveUsed(u.id,true)-used)+').'}
  if(/late/.test(t)){const r=mine.find(x=>x.date===td);return!r?'You have not checked in today.':r.late?'Yes, you were late today (checked in at '+r.in+').':'No, you were on time today ('+r.in+').'}
  if(/hour|week/.test(t)){const d=new Date(),mon=new Date(d);mon.setDate(d.getDate()-((d.getDay()+6)%7));const from=fmtDate(mon);const h=mine.filter(r=>r.date>=from).reduce((s,r)=>s+hoursWorked(r),0);return'You worked '+h.toFixed(1)+' hours this week.'}
  if(/check|status|today|present/.test(t)){const r=mine.find(x=>x.date===td);return r?'Checked in at '+r.in+(r.out?', out at '+r.out:', not checked out yet')+' ('+r.status+').':'You have not checked in today.'}
  return'Try: "How many leaves do I have left?", "Was I late today?", "How many hours did I work this week?"';
}
function initHelper(){
  const u=currentUser();
  $('#helper').innerHTML='<h3>🤖 Smart Helper</h3><div class="chat" id="chat"><div class="msg b">Hi '+esc(u.name)+'! Ask me a question about your HR data.</div></div><div class="row2"><input id="q" placeholder="Type your question..."><button class="btn" id="ask">Ask</button></div>';
  const send=()=>{const q=$('#q').value.trim();if(!q)return;const ch=$('#chat');
    ch.innerHTML+='<div class="msg u">'+esc(q)+'</div><div class="msg b">'+esc(answer(q,u))+'</div>';$('#q').value='';ch.scrollTop=ch.scrollHeight};
  $('#ask').onclick=send;$('#q').addEventListener('keydown',e=>{if(e.key==='Enter')send()});
}
