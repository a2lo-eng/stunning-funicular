const KEY='monstart-v1';
const today=()=>new Date().toISOString().slice(0,10);
const defaultData=()=>({profile:{name:'',station:'',callsign:''},availability:'Non définie',shifts:[],history:[],alerts:[]});
let data=load();
function load(){try{return {...defaultData(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return defaultData()}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function niceDate(d){if(!d)return '';return new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
function empty(msg){return `<div class="empty">${msg}</div>`}
function item(title,meta,desc,kind,id,date=''){return `<article class="list-item"><div>${date?`<time>${esc(date)}</time>`:''}<h3>${esc(title)}</h3><p>${esc(meta||'')}${desc?'<br>'+esc(desc):''}</p></div><button class="delete-btn" data-delete="${kind}" data-id="${esc(id)}" aria-label="Supprimer">✕</button></article>`}
function render(){
 const name=data.profile.name?.trim();document.querySelector('.welcome h1').textContent=`Salut${name?' '+name:''} 👋`;
 document.getElementById('availability').value=data.availability||'Non définie';
 document.getElementById('availabilityLabel').textContent=data.availability||'Non définie';
 const shifts=[...data.shifts].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const upcoming=shifts.find(s=>s.date>=today());
 document.getElementById('nextShift').textContent=upcoming?upcoming.title:'À renseigner';
 document.getElementById('nextShiftMeta').textContent=upcoming?`${niceDate(upcoming.date)} · ${upcoming.time}${upcoming.place?' · '+upcoming.place:''}`:'Ajoute une garde dans ton planning.';
 document.getElementById('shiftCount').textContent=shifts.length;
 document.getElementById('shiftsList').innerHTML=shifts.length?shifts.map(s=>item(s.title,`${s.time}${s.place?' · '+s.place:''}`,'','shifts',s.id,niceDate(s.date))).join(''):empty('Aucune garde enregistrée. Ajoute ton premier événement ci-dessus.');
 const hist=[...data.history].sort((a,b)=>b.date.localeCompare(a.date));
 document.getElementById('historyList').innerHTML=hist.length?hist.map(h=>item(h.title,'',h.notes,'history',h.id,niceDate(h.date))).join(''):empty('Ton carnet personnel est vide.');
 document.getElementById('alertsList').innerHTML=data.alerts.length?data.alerts.map(a=>item(a.text,a.when?new Date(a.when).toLocaleString('fr-FR'):'Rappel personnel','', 'alerts',a.id)).join(''):empty('Aucun rappel personnel. Ajoute un rappel si besoin.');
 document.getElementById('profileName').value=data.profile.name||'';document.getElementById('profileStation').value=data.profile.station||'';document.getElementById('profileCallsign').value=data.profile.callsign||'';
}
function page(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.page===name));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+name));if(name==='map')setTimeout(()=>map?.invalidateSize(),80);window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.go)));
document.getElementById('availability').addEventListener('change',e=>{data.availability=e.target.value;save()});
document.getElementById('shiftDate').value=today();document.getElementById('historyDate').value=today();
document.getElementById('shiftForm').addEventListener('submit',e=>{e.preventDefault();data.shifts.push({id:crypto.randomUUID(),title:document.getElementById('shiftTitle').value.trim(),date:document.getElementById('shiftDate').value,time:document.getElementById('shiftTime').value,place:document.getElementById('shiftPlace').value.trim()});save();e.target.reset();document.getElementById('shiftDate').value=today();document.getElementById('shiftTime').value='08:00'});
document.getElementById('historyForm').addEventListener('submit',e=>{e.preventDefault();data.history.push({id:crypto.randomUUID(),date:document.getElementById('historyDate').value,title:document.getElementById('historyTitle').value.trim(),notes:document.getElementById('historyNotes').value.trim()});save();e.target.reset();document.getElementById('historyDate').value=today()});
document.getElementById('profileForm').addEventListener('submit',e=>{e.preventDefault();data.profile={name:document.getElementById('profileName').value.trim(),station:document.getElementById('profileStation').value.trim(),callsign:document.getElementById('profileCallsign').value.trim()};save();alert('Profil enregistré sur cet appareil.')});
document.getElementById('addAlert').addEventListener('click',()=>document.getElementById('alertDialog').showModal());
document.getElementById('alertForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const text=document.getElementById('alertText').value.trim();if(!text)return;data.alerts.push({id:crypto.randomUUID(),text,when:document.getElementById('alertWhen').value});save();document.getElementById('alertDialog').close();e.target.reset()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;const k=b.dataset.delete;data[k]=data[k].filter(x=>x.id!==b.dataset.id);save()});
document.getElementById('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='monstart-donnees.json';a.click();URL.revokeObjectURL(a.href)});
document.getElementById('clearBtn').addEventListener('click',()=>{if(confirm('Effacer définitivement toutes les données locales de MonStart ?')){data=defaultData();save()}});
let map,marker;
function initMap(){if(!window.L)return;map=L.map('map').setView([48.3904,-4.4861],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);marker=L.marker([48.3904,-4.4861]).addTo(map).bindPopup('Exemple de centre de carte · Brest').openPopup()}
initMap();
document.getElementById('locateBtn').addEventListener('click',()=>{if(!navigator.geolocation){alert('La géolocalisation n’est pas prise en charge par ce navigateur.');return}const btn=document.getElementById('locateBtn');btn.disabled=true;btn.textContent='Localisation…';navigator.geolocation.getCurrentPosition(pos=>{const {latitude:lat,longitude:lon}=pos.coords;map?.setView([lat,lon],15);if(marker)marker.setLatLng([lat,lon]).bindPopup('Ta position actuelle').openPopup();else marker=L.marker([lat,lon]).addTo(map);document.getElementById('locationTitle').textContent='Position obtenue';document.getElementById('locationText').textContent=`Latitude ${lat.toFixed(5)} · Longitude ${lon.toFixed(5)}`;const a=document.getElementById('openMaps');a.href=`https://maps.apple.com/?ll=${lat},${lon}`;a.hidden=false;btn.disabled=false;btn.textContent='Me localiser'},err=>{document.getElementById('locationTitle').textContent='Localisation indisponible';document.getElementById('locationText').textContent=err.code===1?'Autorisation refusée. Vérifie les réglages de Safari.':'Impossible d’obtenir la position. Réessaie à l’extérieur.';btn.disabled=false;btn.textContent='Réessayer'},{enableHighAccuracy:true,timeout:12000,maximumAge:30000})});
document.getElementById('notifyBtn').addEventListener('click',async()=>{if(!('Notification'in window)){alert('Les notifications ne sont pas prises en charge ici.');return}try{const p=await Notification.requestPermission();alert(p==='granted'?'Autorisation accordée. Dans cette version, les rappels sont visibles dans l’application mais aucun service ne garantit une notification programmée.': 'Notifications non autorisées.')}catch{alert('Impossible de demander l’autorisation des notifications.')}});
if('serviceWorker'in navigator && location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
render();