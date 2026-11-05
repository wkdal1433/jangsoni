import { blink, scheduleIdleEffect } from './idle-motion.js';

export function setupIntro(root, reduce, navigate) {
 document.querySelectorAll('[data-scroll-target]:not([data-go])').forEach(button => {
   button.addEventListener('click', () => navigate('intro', button.dataset.scrollTarget));
 });
 root.querySelectorAll('[data-preview-go]').forEach(btn=>{
   btn.addEventListener('click',()=>{
     const caseInput=readCaseInput();
     const needsAnalysis=Object.values(caseInput).some(Boolean) && JSON.stringify(caseInput)!==analyzedCaseKey;
     if(needsAnalysis && !prepareCaseAnalysis()) return;
     // 메뉴와 같은 진입 경로로 판례 검색 조건과 타임라인 입력값을 적용한다.
     document.querySelector('#menu .menu-item[data-go="'+btn.dataset.previewGo+'"]').click();
   });
 });
 const stage=root.querySelector('.hero-art .mascot-stage');
 const closedFrame=stage.querySelector('.mascot-closed-frame');
 scheduleIdleEffect(stage,reduce,[2700,5000],()=>true,()=>blink(closedFrame));
 if(stage && !reduce.matches){
   let noticeTimer=0;
   stage.addEventListener('pointerenter',(e)=>{
     if(e.pointerType==='touch')return;
     clearTimeout(noticeTimer);
     noticeTimer=setTimeout(()=>stage.classList.add('is-noticing'),460);
   });
   stage.addEventListener('pointerleave',()=>{
     clearTimeout(noticeTimer);
     stage.classList.remove('is-noticing');
   });
 }
 if('IntersectionObserver' in window && !reduce.matches){
   const io=new IntersectionObserver(entries=>{
     entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}});
   },{rootMargin:'0px 0px -5% 0px',threshold:.09});
   root.querySelectorAll('.landing-reveal').forEach(el=>io.observe(el));
 }else root.querySelectorAll('.landing-reveal').forEach(el=>el.classList.add('is-visible'));
}
