(() => {
  'use strict';
  const key='handc-financial-planning-v1';
  // Remove planning edits retained by the former public page.
  try{localStorage.removeItem(key);}catch(_){}
  document.querySelector('.logout-form')?.addEventListener('submit',()=>{try{sessionStorage.removeItem(key);}catch(_){}});
  let checking=false;
  async function checkSession(){
    if(checking)return;checking=true;
    try{
      const response=await fetch('/business/session',{cache:'no-store',credentials:'same-origin'});
      if(response.status===401||response.status===503){try{sessionStorage.removeItem(key);}catch(_){}location.replace('/business/login');return;}
      if(!response.ok)throw new Error('session unavailable');
      document.documentElement.style.visibility='';
    }catch(_){document.documentElement.style.visibility='hidden';location.replace('/business/login');}
    finally{checking=false;}
  }
  window.addEventListener('pagehide',()=>{document.documentElement.style.visibility='hidden';});
  window.addEventListener('pageshow',checkSession);
  window.addEventListener('focus',checkSession);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkSession();});
  setInterval(checkSession,60000);
})();
