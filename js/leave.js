/* Leave: employee apply + list, admin approve/reject */
function applyLeave(form){
  const u=currentUser(),c=company(),f=Object.fromEntries(new FormData(form));clearErrs(form);let ok=true;
  const bad=(n,m)=>{setErr(form,n,m);ok=false};
  if(!f.type)bad('type','Select a type');
  if(!f.from)bad('from','Required');
  if(!f.to)bad('to','Required');
  if(!f.reason.trim())bad('reason','Required');
  let days=0;
  if(f.from&&f.to){
    if(f.from>f.to)bad('to','From date must be on or before To date');
    else{
      days=workingDaysBetween(f.from,f.to);
      if(!days)bad('to','No working days in this range');
      else if(allLeaves().some(l=>l.employeeId===u.id&&l.status!=='rejected'&&l.from<=f.to&&l.to>=f.from))bad('from','Overlaps another leave');
      else if(leaveUsed(u.id,true)+days>c.quota)bad('to','Over quota. Days left: '+(c.quota-leaveUsed(u.id,true)));
    }
  }
  if(!ok)return false;
  const all=allLeaves();
  all.push({id:Date.now(),employeeId:u.id,type:f.type,from:f.from,to:f.to,days,reason:f.reason.trim(),status:'pending',comment:''});
  DB.set('hcm_leaves',all);form.reset();toast('Leave request sent');return true;
}
function renderMyLeaves(){
  const u=currentUser(),c=company(),mine=allLeaves().filter(l=>l.employeeId===u.id).reverse();
  $('#balance').textContent=(c.quota-leaveUsed(u.id))+' / '+c.quota;
  $('#myLeaves').innerHTML=mine.map(l=>'<tr><td>'+l.type+'</td><td>'+l.from+' → '+l.to+'</td><td>'+l.days+'</td><td><span class="tag '+l.status+'">'+l.status+'</span></td><td>'+esc(l.comment)+'</td></tr>').join('')||'<tr><td colspan=5>No leave requests yet</td></tr>';
}
function renderLeaveAdmin(){
  const flt=$('#statusFilter').value,us=users();
  const rows=allLeaves().filter(l=>!flt||l.status===flt).reverse();
  $('#leaveBody').innerHTML=rows.map(l=>{
    const e=us.find(x=>x.id===l.employeeId)||{name:'(deleted)'};
    const act=l.status==='pending'?'<input id="cm'+l.id+'" placeholder="Comment" style="width:150px"> <button class="btn sm" onclick="decide('+l.id+',\'approved\')">Approve</button><button class="btn sm bad" onclick="decide('+l.id+',\'rejected\')">Reject</button>':esc(l.comment);
    return'<tr><td>'+esc(e.name)+'</td><td>'+l.type+'</td><td>'+l.from+' → '+l.to+'</td><td>'+l.days+'</td><td>'+esc(l.reason)+'</td><td><span class="tag '+l.status+'">'+l.status+'</span></td><td>'+act+'</td></tr>';
  }).join('')||'<tr><td colspan=7>No leave requests</td></tr>';
}
function decide(id,status){
  const all=allLeaves(),l=all.find(x=>x.id===id),comment=$('#cm'+id).value.trim();
  if(status==='rejected'&&!comment)return alert('Please write a comment for rejection.');
  if(status==='approved'&&leaveUsed(l.employeeId)+l.days>company().quota)return alert('Approving this exceeds the employee quota.');
  l.status=status;l.comment=comment;DB.set('hcm_leaves',all);renderLeaveAdmin();toast('Leave '+status);
}
