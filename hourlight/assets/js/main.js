
const burger = document.querySelector('.burger');
const navlinks = document.querySelector('.navlinks');
if(burger){
  burger.addEventListener('click', ()=>{
    navlinks.style.display = navlinks.style.display === 'flex' ? 'none':'flex';
  });
}
document.querySelectorAll('[data-scroll-to]').forEach(el=>{
  el.addEventListener('click', (e)=>{
    const target = document.querySelector(el.getAttribute('data-scroll-to'));
    if(target){
      e.preventDefault();
      window.scrollTo({top: target.offsetTop-72, behavior: 'smooth'});
    }
  });
});
