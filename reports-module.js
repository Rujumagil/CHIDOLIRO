(()=>{
  'use strict';
  const KEY='chidoliro_kitchen_session';
  let lastToken='';let allowed=false;let checking=false;
  function removeCard(){document.querySelectorAll('a[data-chidoliro-reports-card]').forEach(x=>x.remove())}
  function ensureCard(){
    const box=document.getElementById('modules');
    if(!box||!allowed)return;
    if(box.querySelector('a[data-chidoliro-reports-card]'))return;
    const a=document.createElement('a');
    a.className='module';a.href='/reportes.html';a.dataset.chidoliroReportsCard='1';
    a.innerHTML='<div class="moduleIcon">⏱️</div><h3>Tiempos y rendimiento</h3><p>Cocina, Barra, entregas, productos lentos y desempeño por mesero.</p><div class="moduleFooter"><span>Ver indicadores</span><span>→</span></div>';
    box.appendChild(a);
  }
  async function syncPermission(){
    const token=sessionStorage.getItem(KEY)||'';
    if(!token){lastToken='';allowed=false;removeCard();return}
    if(checking)return;
    if(token===lastToken){ensureCard();return}
    checking=true;
    try{
      const r=await fetch('/api/kitchen',{method:'POST',cache:'no-store',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'profile'})});
      const p=await r.json().catch(()=>null);
      allowed=!!(r.ok&&p?.ok&&(p.permissions||[]).includes('reports'));
      lastToken=token;
      if(allowed)ensureCard();else removeCard();
    }catch(_){allowed=false;removeCard()}finally{checking=false}
  }
  const mo=new MutationObserver(()=>{if(allowed)ensureCard()});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(syncPermission,1800);syncPermission();
})();
