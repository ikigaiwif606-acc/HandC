(() => {
  'use strict';
  const root=document.documentElement,toggle=document.getElementById('themeToggle'),label=document.getElementById('themeLabel');
  let theme='night';
  try{theme=localStorage.getItem('raja-uda-wellness-theme')==='day'?'day':'night';}catch(_){}
  function apply(){root.dataset.theme=theme;if(toggle){toggle.setAttribute('aria-pressed',String(theme==='night'));toggle.setAttribute('aria-label','Switch to '+(theme==='night'?'day':'night')+' mode');}if(label)label.textContent=theme==='night'?'Night mode':'Day mode';}
  if(toggle)toggle.addEventListener('click',()=>{theme=theme==='night'?'day':'night';try{localStorage.setItem('raja-uda-wellness-theme',theme);}catch(_){}apply();});
  const print=document.getElementById('printButton');if(print)print.addEventListener('click',()=>window.print());
  let details=[];
  window.addEventListener('beforeprint',()=>{details=Array.from(document.querySelectorAll('.wellness-details')).map(el=>[el,el.open]);details.forEach(([el])=>{el.open=true;});});
  window.addEventListener('afterprint',()=>{details.forEach(([el,open])=>{el.open=open;});details=[];});
  apply();
})();
