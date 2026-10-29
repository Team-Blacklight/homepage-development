const searchInput=document.getElementById('game-search');
const filters=[...document.querySelectorAll('.filter')];
const cards=[...document.querySelectorAll('.game-card')];
const emptyState=document.getElementById('empty-state');
const count=document.getElementById('game-count');
let activeFilter='all';
function updateLibrary(){
  const query=(searchInput?.value||'').trim().toLowerCase();
  let visible=0;
  cards.forEach(card=>{
    const category=card.dataset.category||'';
    const terms=(card.dataset.search||card.innerText).toLowerCase();
    const matchesCategory=activeFilter==='all'||category===activeFilter;
    const matchesQuery=!query||terms.includes(query);
    const show=matchesCategory&&matchesQuery;
    card.hidden=!show;
    if(show)visible++;
  });
  emptyState.hidden=visible!==0;
  count.textContent=visible+' '+(visible===1?'TITLE':'TITLES')+' SHOWN';
}
searchInput?.addEventListener('input',updateLibrary);
filters.forEach(button=>button.addEventListener('click',()=>{
  activeFilter=button.dataset.filter||'all';
  filters.forEach(item=>item.classList.toggle('active',item===button));
  updateLibrary();
}));
document.getElementById('year').textContent=new Date().getFullYear();
updateLibrary();
