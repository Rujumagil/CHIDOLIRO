(() => {
  'use strict';
  const KEY='chidoliro_active_reservation_v1';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function today(){
    const d=new Date();
    const off=d.getTimezoneOffset();
    return new Date(d.getTime()-off*60000).toISOString().slice(0,10);
  }
  function defaultTime(){
    const d=new Date();
    d.setMinutes(Math.ceil((d.getMinutes()+30)/30)*30,0,0);
    const hh=String(Math.max(11,Math.min(21,d.getHours()))).padStart(2,'0');
    const mm=String(d.getMinutes()).padStart(2,'0');
    return `${hh}:${mm}`;
  }
  function formatDate(v){
    try{return new Date(`${v}T12:00:00`).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});}catch(_){return v;}
  }
  function toast(message){
    let el=$('#reservationToast');
    if(!el){
      el=document.createElement('div');el.id='reservationToast';el.className='reservationToast';document.body.appendChild(el);
    }
    el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2300);
  }
  function injectStyles(){
    if($('#reservationFlowStyles')) return;
    const style=document.createElement('style');style.id='reservationFlowStyles';style.textContent=`
      #reserveSheet .sheet{max-width:650px}.reservationIntro{display:flex;align-items:flex-start;gap:10px;background:#e8efea;border:1px solid rgba(19,122,126,.13);padding:12px;border-radius:15px;margin:2px 0 14px;color:var(--ocean)}
      .reservationIntro b{display:block;font-size:.76rem}.reservationIntro span{display:block;color:var(--muted);font-size:.67rem;line-height:1.4;margin-top:3px}
      .reserveGrid .field span{font-size:.7rem}.reserveGrid textarea{min-height:78px;border:1px solid var(--line);border-radius:14px;background:white;padding:12px;color:var(--ink);resize:vertical;font:inherit}
      .reservationSubmit{width:100%;margin-top:12px}.reservationSubmit:disabled{opacity:.55;cursor:wait}.reservationLegal{font-size:.62rem;color:var(--muted);line-height:1.45;margin:9px 3px 0;text-align:center}
      .reservationSuccess{text-align:center;padding:18px 4px 5px}.reservationSuccessIcon{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:#def2e6;color:#12663b;font-size:1.75rem;margin:0 auto 14px}.reservationSuccess h3{font-size:2.25rem!important;margin-bottom:8px!important}.reservationNumber{display:inline-block;background:var(--ocean);color:white;padding:9px 14px;border-radius:999px;font-weight:900;margin:4px 0 12px}.reservationSummary{background:white;border:1px solid var(--line);border-radius:17px;padding:13px;margin:14px 0;text-align:left}.reservationSummary div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:.73rem}.reservationSummary span{color:var(--muted)}.reservationActions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.reservationToast{position:fixed;z-index:1100;left:50%;bottom:105px;transform:translate(-50%,18px);opacity:0;pointer-events:none;background:#04171b;color:white;padding:11px 14px;border-radius:13px;font-size:.75rem;font-weight:800;box-shadow:0 14px 38px rgba(0,0,0,.25);transition:.2s;max-width:calc(100% - 28px);text-align:center}.reservationToast.show{opacity:1;transform:translate(-50%,0)}
      @media(max-width:700px){#reserveSheet{padding:0;align-items:stretch}#reserveSheet .sheet{width:100%;height:100dvh;max-height:none;border-radius:0;padding:calc(16px + env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom))}.reservationActions{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }
  function enhanceSheet(){
    const sheet=$('#reserveSheet');if(!sheet||sheet.dataset.reservationLive==='1') return;
    sheet.dataset.reservationLive='1';
    const head=$('.sheetHead h3',sheet);if(head) head.textContent='Reserva tu mesa';
    const grid=$('.reserveGrid',sheet);if(!grid) return;
    grid.insertAdjacentHTML('beforebegin','<div class="reservationIntro"><div>◷</div><div><b>Solicita tu mesa en menos de un minuto</b><span>El restaurante recibirá tu solicitud y podrás consultar aquí mismo cuando quede confirmada.</span></div></div>');
    grid.innerHTML=`
      <label class="field"><span>Nombre *</span><input id="reservationName" autocomplete="name" maxlength="100" placeholder="Tu nombre"></label>
      <label class="field"><span>Teléfono *</span><input id="reservationPhone" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="10 dígitos"></label>
      <label class="field"><span>Fecha *</span><input id="reservationDate" type="date" min="${today()}" value="${today()}"></label>
      <label class="field"><span>Hora *</span><input id="reservationTime" type="time" min="11:00" max="22:00" value="${defaultTime()}"></label>
      <label class="field full"><span>Personas *</span><select id="reservationParty">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i===1?'selected':''}>${i+1} persona${i?'s':''}</option>`).join('')}<option value="15">13–15 personas</option><option value="20">16–20 personas</option></select></label>
      <label class="field full"><span>Notas (opcional)</span><textarea id="reservationNotes" maxlength="600" placeholder="Cumpleaños, silla para bebé, preferencia de mesa o alguna indicación"></textarea></label>`;
    const button=$('#reserveSheet .btn.btnOrange');
    if(button){button.classList.add('reservationSubmit');button.textContent='Solicitar reservación';button.removeAttribute('onclick');button.addEventListener('click',submitReservation);}
    button?.insertAdjacentHTML('afterend','<p class="reservationLegal">La solicitud queda pendiente hasta que CHIDOLIRO la confirme.</p>');
  }
  async function submitReservation(){
    const name=$('#reservationName')?.value.trim()||'';
    const phone=$('#reservationPhone')?.value.trim()||'';
    const date=$('#reservationDate')?.value||'';
    const time=$('#reservationTime')?.value||'';
    const party=Number($('#reservationParty')?.value||0);
    const notes=$('#reservationNotes')?.value.trim()||'';
    if(!name){toast('Escribe tu nombre.');$('#reservationName')?.focus();return;}
    if(phone.replace(/\D/g,'').length<7){toast('Escribe un teléfono válido.');$('#reservationPhone')?.focus();return;}
    if(!date||!time){toast('Selecciona fecha y hora.');return;}
    const selected=new Date(`${date}T${time}:00`);
    if(Number.isFinite(selected.getTime())&&selected.getTime()<Date.now()-5*60000){toast('Selecciona una fecha y hora futuras.');return;}
    const button=$('.reservationSubmit');if(button){button.disabled=true;button.textContent='Enviando solicitud…';}
    try{
      const r=await fetch('/api/reservation',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_name:name,customer_phone:phone,reservation_date:date,reservation_time:time,party_size:party,notes:notes||null})});
      const p=await r.json().catch(()=>null);
      if(!r.ok||!p?.ok) throw new Error(p?.message||'No pudimos registrar la reservación.');
      const record={token:p.public_token,number:p.reservation_number,date:p.reservation_date,time:p.reservation_time,party:p.party_size,status:p.status,createdAt:Date.now()};
      localStorage.setItem(KEY,JSON.stringify(record));
      renderSuccess(record);
      window.dispatchEvent(new CustomEvent('chidoliro:reservation-created',{detail:record}));
    }catch(error){toast(error.message||'No pudimos registrar la reservación.');if(button){button.disabled=false;button.textContent='Solicitar reservación';}}
  }
  function renderSuccess(record){
    const inner=$('#reserveSheet .sheet');if(!inner) return;
    inner.innerHTML=`<div class="reservationSuccess"><div class="reservationSuccessIcon">✓</div><h3>Solicitud recibida</h3><div class="reservationNumber">Reserva R-${esc(record.number)}</div><p style="color:var(--muted);font-size:.8rem;line-height:1.5">CHIDOLIRO ya recibió tu solicitud. Conserva este seguimiento para ver cuando quede confirmada.</p><div class="reservationSummary"><div><span>Fecha</span><b>${esc(formatDate(record.date))}</b></div><div><span>Hora</span><b>${esc(record.time)}</b></div><div><span>Personas</span><b>${esc(record.party)}</b></div><div><span>Estado</span><b>Pendiente de confirmación</b></div></div><div class="reservationActions"><a class="btn btnDark" href="/reserva.html?t=${encodeURIComponent(record.token)}">Ver estado</a><button class="btn btnWhite" id="reservationClose" type="button">Seguir explorando</button></div></div>`;
    $('#reservationClose')?.addEventListener('click',()=>{if(typeof closeSheets==='function')closeSheets();location.hash='inicio';setTimeout(()=>location.reload(),80);});
  }
  function start(){injectStyles();enhanceSheet();window.reservationDemo=submitReservation;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
