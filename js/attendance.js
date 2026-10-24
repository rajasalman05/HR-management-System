/* Check-in / check-out using the Admin's rules + camera check-in (bonus) */
function checkIn(uid,extra){
  const c=company(),td=today();
  if(!isWorkingDay(td))return{ok:false,msg:'Today is not a working day.'};
  if(onLeave(uid,td))return{ok:false,msg:'You are on approved leave today.'};
  const all=allAttendance();
  if(all.some(r=>r.employeeId===uid&&r.date===td))return{ok:false,msg:'You already checked in today.'};
  const t=nowTime(),late=toMin(t)>toMin(c.start)+c.grace;
  all.push(Object.assign({employeeId:uid,date:td,in:t,out:null,status:late?'late':'present',late},extra||{}));
  DB.set('hcm_attendance',all);
  return{ok:true,msg:'Checked in at '+t+(late?' (Late)':'')};
}
function checkOut(uid){
  const td=today(),all=allAttendance(),r=all.find(x=>x.employeeId===uid&&x.date===td);
  if(!r)return{ok:false,msg:'Check in first.'};
  if(r.out)return{ok:false,msg:'You already checked out.'};
  r.out=nowTime();const h=hoursWorked(r);
  if(h<5)r.status='half';
  DB.set('hcm_attendance',all);
  return{ok:true,msg:'Checked out at '+r.out+' ('+h.toFixed(1)+' h)'+(h<5?' - Half day':'')};
}
/* ---- Camera + location + face check-in ---- */
let camStream=null,modelsReady=false;
const FACE_MODELS='https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
function distance(la1,lo1,la2,lo2){
  const R=6371000,r=x=>x*Math.PI/180,dl=r(la2-la1),dn=r(lo2-lo1);
  const h=Math.sin(dl/2)**2+Math.cos(r(la1))*Math.cos(r(la2))*Math.sin(dn/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
async function openCamera(){
  $('#camModal').showModal();$('#camMsg').textContent='Starting camera...';
  try{camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}});$('#cam').srcObject=camStream;$('#camMsg').textContent='Look at the camera, then press Verify.'}
  catch(e){$('#camMsg').textContent='Camera not available: '+e.message}
}
function closeCamera(){if(camStream)camStream.getTracks().forEach(t=>t.stop());camStream=null;$('#camModal').close()}
async function verifyAndCheckIn(){
  const msg=$('#camMsg'),c=company();
  try{
    msg.textContent='Checking location...';
    const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:10000}));
    const lat=pos.coords.latitude,lng=pos.coords.longitude;
    if(c.officeLat!==null&&c.officeLat!==''&&c.officeLat!==undefined){
      const d=distance(lat,lng,c.officeLat,c.officeLng);
      if(d>c.radius){msg.textContent='Outside office area ('+Math.round(d)+' m away).';return}
    }
    msg.textContent='Detecting face...';
    if(typeof faceapi==='undefined')throw new Error('Face library did not load (check internet).');
    if(!modelsReady){await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS);modelsReady=true}
    const face=await faceapi.detectSingleFace($('#cam'),new faceapi.TinyFaceDetectorOptions());
    if(!face){msg.textContent='No face detected. Try again.';return}
    const r=checkIn(currentUser().id,{via:'camera',lat,lng});
    msg.textContent=r.msg;
    if(r.ok)setTimeout(()=>{closeCamera();location.reload()},1200);
  }catch(e){msg.textContent='Error: '+e.message}
}
