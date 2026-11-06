import { renderIcon } from './icons.js';

export function setupJourney(root, tour, reduce, mascot, handoff) {
 const journey=root.querySelector('#landing-journey');
 const steps=[...root.querySelectorAll('.journey-step')];
 const sentence=root.querySelector('#journey-speech');
 const counter=root.querySelector('#journey-counter');
 const bar=root.querySelector('#journey-progress-bar');
 const stage=root.querySelector('.journey-sticky');
 const board=root.querySelector('.journey-board');
 const scrollTrack=root.querySelector('.journey-scroll-track');
 const snapPoints=steps.map(()=>{
   const point=document.createElement('div');
   point.className='journey-snap-point';
   scrollTrack.append(point);
   return point;
 });
 const phrases=['여기부터 살펴볼게요.','약관도 확인해 봐요.','코드도 찾아볼까요?','판례는 이쪽이에요.','논문도 같이 봐요.','음… 이것도 중요해요.','이제 정리해 볼까요?'];
 const {avatar, frameCount, showJourneyPose}=mascot;
 const desktopJourney=window.matchMedia('(min-width: 721px)');
 const walkDuration=900;
 const boundaryDuration=420;
 const welcome=root.querySelector('#landing-welcome');
 const about=root.querySelector('#landing-about');
 const beforeJourney=root.querySelector('#landing-guide');
 const afterJourney=root.querySelector(".demo-section");
 const workbench=root.querySelector('#analysis-workbench');
 const swipeSurfaces=[welcome,about,beforeJourney,journey,afterJourney,board];
 const swipeSelector='#landing-welcome,#landing-about,#landing-guide,#landing-journey,.demo-section,.journey-board';
 const wheelQuietTime=120;
 let active=-1, updateFrame=0, journeyFrame=0, lastWheel=-Infinity;
 let mobileWalkFrame=0;
 let lastMobileScroll=window.scrollY;
 let mobileEntryTimer=0, mobileEntryPending=false, mobileTouching=false;
 let mobileSwipe=null;
 let viewportWidth=window.innerWidth;
 let ignoreMobileClick=false;
 let revealTimer=0;
 let cardReaction;

 function cancelMobileEntry(){
   clearTimeout(mobileEntryTimer);
   mobileEntryPending=false;
 }
 function finishMobileEntry(){
   if(mobileTouching) return;
   const pending=mobileEntryPending;
   cancelMobileEntry();
   if(!pending||desktopJourney.matches||root.hidden||tour.hidden||reduce.matches) return;
   if(document.activeElement.matches('input,select,textarea,[contenteditable]')||document.querySelector('dialog[open]')) return;
   if(journey.getBoundingClientRect().top>2) moveJourney(window.scrollY+journey.getBoundingClientRect().top,null,false,{section:journey});
 }

 function positionSpeech(){
   if(!desktopJourney.matches||!avatar.offsetWidth) return;
   stage.style.setProperty('--speech-left',(avatar.offsetLeft+avatar.offsetWidth/2)+'px');
   stage.style.setProperty('--speech-top',(avatar.offsetTop-12)+'px');
 }
 function syncDetails(){
   steps.forEach((step,index)=>{
     const expanded=desktopJourney.matches||index===Math.max(active,0);
     const toggle=step.querySelector('.step-toggle');
     toggle.disabled=desktopJourney.matches;
     toggle.setAttribute('aria-expanded',String(expanded));
     renderIcon(toggle.querySelector('[data-icon]'),expanded?'minus':'plus');
     step.querySelector('.step-detail').inert=!expanded;
   });
 }
 if('ResizeObserver' in window){
   const observer=new ResizeObserver(positionSpeech);
   observer.observe(avatar);
   observer.observe(stage);
 }
 syncDetails();

 function setActive(index){
   if(index===active) return;
   active=index;
   steps.forEach((step,i)=>{
     const on=i===index;
     step.classList.toggle('is-active',on);
     if(on) step.setAttribute('aria-current','step');
     else step.removeAttribute('aria-current');
   });
   syncDetails();
   clearTimeout(revealTimer);
   if(!desktopJourney.matches) revealTimer=setTimeout(()=>revealCard(index),reduce.matches?0:360);
   if(sentence) sentence.textContent=phrases[index];
   if(counter) counter.textContent=String(index+1).padStart(2,'0')+' / 07';
   if(bar) bar.style.width=((index+1)/steps.length*100)+'%';
 }
 function revealCard(index){
   if(root.hidden||tour.hidden||desktopJourney.matches) return;
   const list=steps[index].parentElement;
   const card=steps[index].getBoundingClientRect();
   const viewport=list.getBoundingClientRect();
   const offset=card.top<viewport.top?card.top-viewport.top:Math.max(0,card.bottom-viewport.bottom);
   if(offset) list.scrollBy({top:offset,behavior:reduce.matches?'instant':'smooth'});
 }

 function cardCenters(){
   return steps.map(step=>{
     const rect=step.getBoundingClientRect();
     return window.scrollY+(rect.top+rect.bottom)/2;
   });
 }
 function mobileCardTops(){
   return snapPoints.map(point=>window.scrollY+point.getBoundingClientRect().top);
 }

 function nearestCard(centers, viewportCenter){
   return centers.reduce((nearest,center,i)=>{
     return Math.abs(center-viewportCenter)<Math.abs(centers[nearest]-viewportCenter)?i:nearest;
   },0);
 }

 function update(){
   updateFrame=0;
   const mobileDelta=window.scrollY-lastMobileScroll;
   const mobileMoved=Math.abs(mobileDelta)>1;
   lastMobileScroll=window.scrollY;
   if(root.hidden||tour.hidden||journeyFrame) return;
   const viewport=window.innerHeight;
   const rect=journey.getBoundingClientRect();
   if(rect.bottom<0||rect.top>viewport) return;
   if(!desktopJourney.matches&&!reduce.matches){
     if(mobileDelta>1&&rect.top>2&&rect.top<viewport-24) mobileEntryPending=true;
     if(mobileEntryPending){clearTimeout(mobileEntryTimer);mobileEntryTimer=setTimeout(finishMobileEntry,120);}
   }
   setActive(desktopJourney.matches?nearestCard(cardCenters(),window.scrollY+viewport/2):nearestCard(mobileCardTops(),window.scrollY));
   positionSpeech();
   if(!desktopJourney.matches&&mobileMoved&&Math.abs(stage.getBoundingClientRect().top)<2) playMobileWalk();
 }

 function showWalkProgress(progress){
   const gait=Math.floor(progress*1.5*frameCount)%frameCount;
   showJourneyPose(gait);
   const lift=Math.sin(progress*3*Math.PI);
   const amplitude=desktopJourney.matches?5:1.2*Math.sin(progress*Math.PI);
   avatar.style.transform='translateY('+(-amplitude*lift*lift)+'px)';
 }

 function playMobileWalk(){
   if(mobileWalkFrame||reduce.matches||!mascot.ready) return;
   const start=performance.now();
   const tick=now=>{
     const rect=journey.getBoundingClientRect();
     const progress=Math.max(0,Math.min(1,(now-start)/walkDuration));
     if(progress===1||root.hidden||tour.hidden||reduce.matches||desktopJourney.matches||rect.bottom<=0||rect.top>=innerHeight){
       cancelAnimationFrame(mobileWalkFrame);
       mobileWalkFrame=0;
       showJourneyPose(-1);
       avatar.style.transform='';
       return;
     }
     showWalkProgress(progress);
     mobileWalkFrame=requestAnimationFrame(tick);
   };
   mobileWalkFrame=requestAnimationFrame(tick);
 }

 function stopJourneyTransition(){
   cancelMobileEntry();
   delete document.documentElement.dataset.journeyTransition;
   cancelAnimationFrame(journeyFrame);
   cancelAnimationFrame(mobileWalkFrame);
   mobileWalkFrame=0;
   journeyFrame=0;
   showJourneyPose(-1);
   avatar.style.transform='';
   lastMobileScroll=window.scrollY;
 }

 function reactToCard(index){
   if(!desktopJourney.matches) return;
   const card=steps[index].querySelector('.journey-card').getBoundingClientRect();
   const actor=avatar.getBoundingClientRect();
   const towardCard=Math.sign(card.left+card.width/2-actor.left-actor.width/2);
   cardReaction=avatar.animate([
     {transform:'none'},
     {transform:`translate(${towardCard*3}px, 2px) rotate(${towardCard*2}deg)`,offset:.48},
     {transform:'none'},
   ],{delay:120,duration:460,easing:'ease-in-out'});
 }

 function moveJourney(destination,index,walking=false,{section,atEnd=false}={}){
   const duration=walking?walkDuration:boundaryDuration;
   const origin=window.scrollY;
   const start=performance.now();
   const tourOpen=!tour.hidden;
   const desktopAtStart=desktopJourney.matches;
   const targetTop=()=>{
     if(section) return window.scrollY+section.getBoundingClientRect().top+(atEnd?Math.max(0,section.offsetHeight-innerHeight):0);
     if(!desktopAtStart&&index!==null) return mobileCardTops()[index];
     return destination;
   };
   if(!desktopAtStart) document.documentElement.dataset.journeyTransition='';
   const tick=now=>{
     if(root.hidden||tourOpen!==!tour.hidden||reduce.matches||desktopJourney.matches!==desktopAtStart){
       stopJourneyTransition();
       return;
     }
     const progress=Math.max(0,Math.min(1,(now-start)/duration));
     if(progress===1){
       window.scrollTo({top:targetTop(),behavior:'instant'});
       if(index!==null) setActive(index);
       stopJourneyTransition();
       if(index!==null) reactToCard(index);
       return;
     }
     const travel=progress*progress*(3-2*progress);
     window.scrollTo({top:origin+(targetTop()-origin)*travel,behavior:'instant'});
     if(index!==null&&progress>=.5) setActive(index);
     if(walking){
       // A full gait cycle alternates two feet. Three steps take one and a half cycles.
       showWalkProgress(progress);
     }
     journeyFrame=requestAnimationFrame(tick);
   };
   journeyFrame=requestAnimationFrame(tick);
 }

 function mobileDestination(direction,scrollTop){
   const sectionStop=(section,atEnd=false)=>({section,atEnd,index:null,top:window.scrollY+section.getBoundingClientRect().top+(atEnd?Math.max(0,section.offsetHeight-innerHeight):0)});
   const targets=[
     sectionStop(welcome),sectionStop(welcome,true),
     sectionStop(about),sectionStop(about,true),
     sectionStop(beforeJourney),sectionStop(beforeJourney,true),
     sectionStop(journey),
     ...mobileCardTops().map((top,index)=>({top,index})),
     sectionStop(afterJourney),sectionStop(afterJourney,true),
     sectionStop(workbench),
   ];
   return direction>0?targets.find(target=>target.top>scrollTop+2):targets.findLast(target=>target.top<scrollTop-2);
 }

 function cancelMobileSwipe(){
   const swipe=mobileSwipe;
   mobileSwipe=null;
   delete board.dataset.swiping;
   if(swipe?.surface) delete swipe.surface.dataset.swiping;
   if(swipe?.captured&&swipe.surface.hasPointerCapture(swipe.pointer)) swipe.surface.releasePointerCapture(swipe.pointer);
 }

 function startMobileSwipe(x,y,target,pointer=null){
   cancelMobileEntry();
   cancelMobileSwipe();
   if(desktopJourney.matches||root.hidden||tour.hidden||!mascot.ready) return;
   if(reduce.matches&&pointer===null) return;
   if(document.activeElement.matches('input,select,textarea,[contenteditable]')||document.querySelector('dialog[open]')) return;
   if(target.closest?.('input,select,textarea,[contenteditable],#companion-chat,#case-companion')) return;
   const surface=target.closest?.(swipeSelector);
   if(!surface) return;
   mobileSwipe={pointer,x,y,top:window.scrollY,locked:!!journeyFrame,captured:false,surface};
 }

 function chooseMobileSwipe(x,y){
   const delta=mobileSwipe.y-y;
   if(Math.abs(delta)<18||Math.abs(delta)<=Math.abs(mobileSwipe.x-x)){
     mobileSwipe.destination=null;
     return false;
   }
   if(!mobileSwipe.locked&&!journeyFrame) mobileSwipe.destination=mobileDestination(Math.sign(delta),mobileSwipe.top);
   return mobileSwipe.locked||!!journeyFrame||!!mobileSwipe.destination;
 }

 function onMobilePointerDown(event){
   ignoreMobileClick=false;
   if(!event.isPrimary){if(event.pointerType==='touch') cancelMobileSwipe();return;}
   if(event.button!==0||!event.target.closest?.(swipeSelector)) return;
   if(event.pointerType==='touch'&&reduce.matches) return;
   startMobileSwipe(event.clientX,event.clientY,event.target,event.pointerId);
   if(mobileSwipe&&mobileSwipe.surface!==board&&event.pointerType==='mouse'){
     window.getSelection()?.removeAllRanges();
     event.preventDefault();
   }
 }

 function onMobilePointerMove(event){
   if(mobileSwipe?.pointer!==event.pointerId) return;
   if(event.pointerType==='mouse'&&event.buttons===0){cancelMobileSwipe();return;}
   if(!chooseMobileSwipe(event.clientX,event.clientY)) return;
   if(!mobileSwipe.captured){
     mobileSwipe.surface.setPointerCapture(event.pointerId);
     mobileSwipe.captured=true;
     mobileSwipe.surface.dataset.swiping='';
   }
   if(event.cancelable) event.preventDefault();
 }

 function finishMobileSwipe(){
   const swipe=mobileSwipe;
   ignoreMobileClick=swipe.captured;
   cancelMobileSwipe();
   if(swipe?.destination&&!swipe.locked&&!journeyFrame){
     cancelMobileEntry();
     cardReaction?.cancel();
     const {top,index}=swipe.destination;
     if(reduce.matches){
       window.scrollTo({top,behavior:'instant'});
       if(index!==null) setActive(index);
     }else{
       if(swipe.destination.section===afterJourney&&top>swipe.top) handoff(avatar,boundaryDuration);
       moveJourney(top,index,index!==null,swipe.destination);
     }
   }
 }

 function onMobilePointerUp(event){
   if(mobileSwipe?.pointer===event.pointerId) finishMobileSwipe();
 }

 function onJourneyWheel(event){
   if(root.hidden||reduce.matches||!mascot.ready) return;
   if(document.activeElement.matches('input,select,textarea,[contenteditable]')||document.querySelector('dialog[open]')) return;
   if(event.target.closest?.('input,select,textarea,[contenteditable],#companion-chat')) return;
   if(!event.cancelable||event.defaultPrevented||event.ctrlKey||event.shiftKey||Math.abs(event.deltaY)<=Math.abs(event.deltaX)) return;
   const now=performance.now();
   if(journeyFrame||now-lastWheel<wheelQuietTime){
     event.preventDefault();
     lastWheel=now;
     return;
   }

   const direction=Math.sign(event.deltaY);
   const desktop=desktopJourney.matches;
   const centers=desktop?cardCenters():mobileCardTops();
   const halfViewport=desktop?window.innerHeight/2:0;
   const scrollTop=window.scrollY;
   const topOf=element=>scrollTop+element.getBoundingClientRect().top;
   const section=element=>({top:topOf(element),index:null,section:element});
   const targets=[
     section(welcome),
     ...(!tour.hidden?[
       section(about),
       ...(!desktop&&about.offsetHeight>innerHeight?[
         {top:topOf(about)+about.offsetHeight-innerHeight,index:null,section:about,atEnd:true},
       ]:[]),
       section(beforeJourney),
       section(journey),
       ...centers.map((center,index)=>({top:center-halfViewport,index})),
       section(afterJourney),
     ]:[]),
     section(workbench),
   ];
   const first=targets[0].top, last=targets.at(-1).top;
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);
   if(scrollTop<first-2||scrollTop>last+2){
     const enteringFromAbove=scrollTop<first&&scrollTop+delta>=first;
     const enteringFromBelow=scrollTop>last&&scrollTop+delta<=last;
     if(!enteringFromAbove&&!enteringFromBelow) return;
     event.preventDefault();
     lastWheel=now;
     cardReaction?.cancel();
     moveJourney(enteringFromAbove?first:last,null);
     return;
   }

   const next=direction>0
     ?targets.find(target=>target.top>scrollTop+2)
     :targets.findLast(target=>target.top<scrollTop-2);
   if(!next) return;
   const current=targets.findLast(target=>target.top<=scrollTop+2);
   if(current?.section&&current.section!==about&&current.section!==journey){
     const lastReadableTop=current.top+current.section.getBoundingClientRect().height-window.innerHeight;
     if(direction>0&&scrollTop<lastReadableTop-2) return;
     if(direction<0&&scrollTop>current.top+2) return;
   }
   event.preventDefault();
   lastWheel=now;
   cardReaction?.cancel();
   if(direction>0&&next.section===afterJourney) handoff(avatar,boundaryDuration);
   const walking=next.index!==null&&scrollTop>=centers[0]-halfViewport-2&&scrollTop<=centers.at(-1)-halfViewport+2;
   moveJourney(next.top,next.index,walking,next);
 }

 const requestUpdate=()=>{if(!updateFrame) updateFrame=requestAnimationFrame(update);};
 steps.forEach((step,index)=>step.querySelector('.step-toggle').addEventListener('click',()=>{
   if(desktopJourney.matches||journeyFrame||index===active) return;
   cancelMobileEntry();
   if(reduce.matches){
     window.scrollTo({top:mobileCardTops()[index],behavior:'instant'});
     setActive(index);
   }else moveJourney(mobileCardTops()[index],index,true);
 }));
 window.addEventListener('wheel',onJourneyWheel,{passive:false});
 window.addEventListener('wheel',event=>{if(!desktopJourney.matches&&event.deltaY<0) cancelMobileEntry();},{passive:true});
 window.addEventListener('pointerdown',onMobilePointerDown);
 window.addEventListener('pointermove',onMobilePointerMove,{passive:false});
 window.addEventListener('pointerup',onMobilePointerUp);
 window.addEventListener('pointercancel',event=>{if(mobileSwipe?.pointer===event.pointerId) cancelMobileSwipe();});
 swipeSurfaces.forEach(surface=>surface.addEventListener('lostpointercapture',event=>{if(event.target===surface&&mobileSwipe?.pointer===event.pointerId) cancelMobileSwipe();}));
 window.addEventListener('blur',()=>{cancelMobileSwipe();cancelMobileEntry();mobileTouching=false;});
 window.addEventListener('touchstart',event=>{
   mobileTouching=true;
   if(event.touches.length!==1){cancelMobileSwipe();cancelMobileEntry();return;}
   if(mobileSwipe?.pointer!=null) return;
   const touch=event.touches[0];
   startMobileSwipe(touch.clientX,touch.clientY,event.target);
 },{passive:true});
 window.addEventListener('touchmove',event=>{
   if(!mobileSwipe||mobileSwipe.pointer!==null||event.touches.length!==1||!event.cancelable) return;
   const touch=event.touches[0];
   if(mobileSwipe.locked||journeyFrame||chooseMobileSwipe(touch.clientX,touch.clientY)) event.preventDefault();
 },{passive:false});
 window.addEventListener('touchend',event=>{
   mobileTouching=event.touches.length>0;
   if(!mobileTouching&&mobileSwipe?.pointer===null) finishMobileSwipe();
   if(!mobileTouching&&mobileEntryPending){clearTimeout(mobileEntryTimer);mobileEntryTimer=setTimeout(finishMobileEntry,120);}
 },{passive:true});
 window.addEventListener('touchcancel',()=>{mobileTouching=false;cancelMobileSwipe();cancelMobileEntry();},{passive:true});
 document.addEventListener('click',event=>{
   if(ignoreMobileClick&&event.detail>0){ignoreMobileClick=false;event.preventDefault();event.stopPropagation();return;}
   if(event.target.closest?.('[data-scroll-target],[data-preview-go],[data-go]')){cancelMobileSwipe();stopJourneyTransition();}
 },true);
 document.addEventListener('focusin',event=>{
   if(event.target.matches('input,select,textarea,[contenteditable]')){cancelMobileSwipe();stopJourneyTransition();}
 });
 window.addEventListener('popstate',()=>{cancelMobileSwipe();stopJourneyTransition();});
 window.addEventListener('scroll',requestUpdate,{passive:true});
 window.addEventListener('resize',()=>{
   // Mobile browser chrome can change height during a swipe without changing the layout width.
   if(desktopJourney.matches||window.innerWidth!==viewportWidth){
     cardReaction?.cancel();
     cancelMobileSwipe();
     if(journeyFrame||mobileWalkFrame) stopJourneyTransition();
   }
   viewportWidth=window.innerWidth;
   requestUpdate();
   syncDetails();
   positionSpeech();
 });
 reduce.addEventListener('change',()=>{if(reduce.matches){cardReaction?.cancel();cancelMobileSwipe();stopJourneyTransition();}});
 requestUpdate();
}
