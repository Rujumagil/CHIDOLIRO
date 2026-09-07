(() => {
  'use strict';

  function closeAllSheets(){
    document.querySelectorAll('.sheetBg').forEach(sheet=>{
      sheet.classList.remove('show');
      sheet.style.removeProperty('display');
    });
    document.body.classList.remove('no-scroll');
  }

  function forceOpenSheet(id){
    const sheet=document.getElementById(id);
    if(!sheet){
      console.error('[CHIDOLIRO] No se encontró la hoja:', id);
      return false;
    }
    closeAllSheets();
    sheet.classList.add('show');
    sheet.style.display='flex';
    document.body.classList.add('no-scroll');
    requestAnimationFrame(()=>{
      const inner=sheet.querySelector('.sheet');
      if(inner) inner.scrollTop=0;
    });
    return true;
  }

  window.closeSheets=closeAllSheets;
  window.openSheet=forceOpenSheet;

  function bindMenuTriggers(){
    document.querySelectorAll('[onclick]').forEach(el=>{
      const code=el.getAttribute('onclick')||'';
      if(!code.includes("menuSheet")) return;
      if(el.dataset.menuBound==='1') return;
      el.dataset.menuBound='1';
      el.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        forceOpenSheet('menuSheet');
      },true);
    });

    document.querySelectorAll('a,button').forEach(el=>{
      const label=(el.textContent||'').trim().toLowerCase();
      if(label==='menú' || label==='ver menú' || label.includes('ver menú')){
        if(el.dataset.menuBoundText==='1') return;
        el.dataset.menuBoundText='1';
        el.addEventListener('click',event=>{
          event.preventDefault();
          event.stopPropagation();
          forceOpenSheet('menuSheet');
        },true);
      }
    });
  }

  function ensureMenuVisibleCss(){
    if(document.getElementById('menuControllerFixStyles')) return;
    const style=document.createElement('style');
    style.id='menuControllerFixStyles';
    style.textContent=`
      #menuSheet.sheetBg{z-index:900!important}
      #menuSheet.sheetBg.show{display:flex!important}
      #menuSheet .sheet{position:relative;z-index:901}
      @media(max-width:700px){
        #menuSheet.sheetBg{padding:0!important;align-items:stretch!important}
        #menuSheet .sheet{width:100%!important;height:100dvh!important;max-height:none!important;border-radius:0!important}
      }
    `;
    document.head.appendChild(style);
  }

  function boot(){
    ensureMenuVisibleCss();
    bindMenuTriggers();
    const observer=new MutationObserver(bindMenuTriggers);
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
