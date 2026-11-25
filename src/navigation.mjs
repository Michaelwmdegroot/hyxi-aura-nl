/** Accessible, script-independent anchor links, progressive menu enhancement.
 * No tracking, no customer data, no leadflow side effects. */
const button=document.getElementById('launch-menu-toggle');
const menu=document.getElementById('launch-mobile-nav');
if(button && menu){
  const close=(focus=false)=>{
    menu.hidden=true;
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label','Menu openen');
    if(focus)button.focus({preventScroll:true});
  };
  const open=()=>{
    menu.hidden=false;
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-label','Menu sluiten');
    menu.querySelector('a')?.focus({preventScroll:true});
  };
  button.addEventListener('click',()=>{
    if(menu.hidden)open();
    else close(true);
  });
  menu.addEventListener('click',event=>{if(event.target.closest('a'))close();});
  document.addEventListener('pointerdown',event=>{
    if(!menu.hidden && !menu.contains(event.target) && !button.contains(event.target))close();
  });
  document.addEventListener('keydown',event=>{
    if(!menu.hidden && event.key==='Escape'){event.preventDefault();close(true);}
  });
  window.addEventListener('hashchange',()=>close());
  const desktop=window.matchMedia('(min-width: 1101px)');
  desktop.addEventListener?.('change',event=>{if(event.matches)close();});
}
