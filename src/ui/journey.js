export function setupJourney(root, tour, reduce, mascot, handoff) {
 const journey=root.querySelector('#landing-journey');
 const steps=[...root.querySelectorAll('.journey-step')];
 const sentence=root.querySelector('#journey-speech');
 const counter=root.querySelector('#journey-counter');
 const bar=root.querySelector('#journey-progress-bar');
 const stage=root.querySelector('.journey-sticky');
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
 const wheelQuietTime=120;
 let active=-1, updateFrame=0, journeyFrame=0, lastWheel=-Infinity;
 let mobileWalkFrame=0;
 let lastMobileScroll=window.scrollY;
 let mobileEntryTimer=0, mobileEntryPending=false, mobileTouching=false;
 let mobileSwipe=null;
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
   if(journey.getBoundingClientRect().top>2) moveJourney(window.scrollY+journey.getBoundingClientRect().top,null);
 }

 function positionSpeech(){
   if(!desktopJourney.matches||!avatar.offsetWidth) return;
   stage.style.setProperty('--speech-left',(avatar.offsetLeft+avatar.offsetWidth/2)+'px');
   stage.style.setProperty('--speech-top',(avatar.offsetTop-12)+'px');
 }
 if('ResizeObserver' in window){
   const observer=new ResizeObserver(positionSpeech);
   observer.observe(avatar);
   observer.observe(stage);
 }

 function setActive(index){
   if(index===active) return;
   active=index;
   steps.forEach((step,i)=>{
     const on=i===index;
     step.classList.toggle('is-active',on);
     if(on) step.setAttribute('aria-current','step');
     else step.removeAttribute('aria-current');
   });
   if(sentence) sentence.textContent=phrases[index];
   if(counter) counter.textContent=String(index+1).padStart(2,'0')+' / 07';
   if(bar) bar.style.width=((index+1)/steps.length*100)+'%';
 }

 function cardCenters(){
   return steps.map(step=>{
     const rect=step.getBoundingClientRect();
     return window.scrollY+(rect.top+rect.bottom)/2;
   });
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
   const focusLine=desktopJourney.matches?viewport/2:(viewport+stage.getBoundingClientRect().height)/2;
   setActive(nearestCard(cardCenters(),window.scrollY+focusLine));
   positionSpeech();
   if(!desktopJourney.matches&&mobileMoved&&Math.abs(stage.getBoundingClientRect().top)<2) playMobileWalk();
 }

 function showWalkProgress(progress){
   const gait=Math.floor(progress*1.5*frameCount)%frameCount;
   showJourneyPose(gait);
   const lift=Math.sin(progress*3*Math.PI);
   avatar.style.transform='translateY('+(-5*lift*lift)+'px)';
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
 }

 function reactToCard(index){
   const card=steps[index].querySelector('.journey-card').getBoundingClientRect();
   const actor=avatar.getBoundingClientRect();
   const towardCard=Math.sign(card.left+card.width/2-actor.left-actor.width/2);
   cardReaction=avatar.animate([
     {transform:'none'},
     {transform:`translate(${towardCard*3}px, 2px) rotate(${towardCard*2}deg)`,offset:.48},
     {transform:'none'},
   ],{delay:120,duration:460,easing:'ease-in-out'});
 }

 function moveJourney(destination,index,walking=false){
   const duration=walking?walkDuration:boundaryDuration;
   const origin=window.scrollY;
   const start=performance.now();
   const tourOpen=!tour.hidden;
   const desktopAtStart=desktopJourney.matches;
   if(!desktopAtStart) document.documentElement.dataset.journeyTransition='';
   const tick=now=>{
     if(root.hidden||tourOpen!==!tour.hidden||reduce.matches||desktopJourney.matches!==desktopAtStart){
       stopJourneyTransition();
       return;
     }
     const progress=Math.max(0,Math.min(1,(now-start)/duration));
     if(progress===1){
       window.scrollTo({top:destination,behavior:'instant'});
       if(index!==null) setActive(index);
       stopJourneyTransition();
       if(index!==null) reactToCard(index);
       return;
     }
     const travel=progress*progress*(3-2*progress);
     window.scrollTo({top:origin+(destination-origin)*travel,behavior:'instant'});
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
   const topOf=element=>window.scrollY+element.getBoundingClientRect().top;
   const start=topOf(journey),end=topOf(afterJourney);
   if(scrollTop<start-2||scrollTop>end+2) return;
   const header=stage.getBoundingClientRect().height;
   const targets=[
     {top:topOf(beforeJourney)+Math.max(0,beforeJourney.offsetHeight-innerHeight),index:null},
     {top:start,index:null},
     ...steps.map((step,index)=>({top:topOf(step)-header,index,section:step})),
     {top:end,index:null},
   ];
   const current=targets.findLast(target=>target.top<=scrollTop+2);
   if(current?.section){
     const lastReadableTop=topOf(current.section)+current.section.offsetHeight-innerHeight;
     if(direction>0&&scrollTop<lastReadableTop-2) return;
     if(direction<0&&scrollTop>current.top+2) return;
   }
   return direction>0?targets.find(target=>target.top>scrollTop+2):targets.findLast(target=>target.top<scrollTop-2);
 }

 function onMobileTouchStart(event){
   mobileTouching=true;
   cancelMobileEntry();
   mobileSwipe=null;
   if(desktopJourney.matches||root.hidden||tour.hidden||reduce.matches||!mascot.ready||event.touches.length!==1) return;
   if(document.activeElement.matches('input,select,textarea,[contenteditable]')||document.querySelector('dialog[open]')) return;
   if(event.target.closest?.('input,select,textarea,[contenteditable],#companion-chat,#case-companion,button,a')) return;
   const touch=event.touches[0];
   mobileSwipe={x:touch.clientX,y:touch.clientY,top:window.scrollY,locked:!!journeyFrame};
 }

 function onMobileTouchMove(event){
   if(!mobileSwipe||event.touches.length!==1||!event.cancelable) return;
   if(mobileSwipe.locked||journeyFrame){event.preventDefault();return;}
   const touch=event.touches[0];
   const delta=mobileSwipe.y-touch.clientY;
   if(Math.abs(delta)<18||Math.abs(delta)<=Math.abs(mobileSwipe.x-touch.clientX)) return;
   mobileSwipe.destination=mobileDestination(Math.sign(delta),mobileSwipe.top);
   if(mobileSwipe.destination) event.preventDefault();
 }

 function onMobileTouchEnd(){
   mobileTouching=false;
   const swipe=mobileSwipe;
   mobileSwipe=null;
   if(swipe?.destination&&!swipe.locked&&!journeyFrame){
     cancelMobileEntry();
     cardReaction?.cancel();
     const {top,index}=swipe.destination;
     if(index===null&&top>swipe.top) handoff(avatar,boundaryDuration);
     moveJourney(top,index,index!==null);
   }else if(mobileEntryPending){
     clearTimeout(mobileEntryTimer);
     mobileEntryTimer=setTimeout(finishMobileEntry,120);
   }
 }

 function onJourneyWheel(event){
   if(root.hidden||!desktopJourney.matches||reduce.matches||!mascot.ready) return;
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
   const centers=cardCenters();
   const halfViewport=window.innerHeight/2;
   const scrollTop=window.scrollY;
   const topOf=element=>scrollTop+element.getBoundingClientRect().top;
   const section=element=>({top:topOf(element),index:null,section:element});
   const targets=[
     section(welcome),
     ...(!tour.hidden?[
       section(about),section(beforeJourney),
       {top:topOf(journey),index:null},
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
   if(current?.section){
     const lastReadableTop=current.top+current.section.getBoundingClientRect().height-window.innerHeight;
     if(direction>0&&scrollTop<lastReadableTop-2) return;
     if(direction<0&&scrollTop>current.top+2) return;
   }
   event.preventDefault();
   lastWheel=now;
   cardReaction?.cancel();
   if(direction>0&&next.section===afterJourney) handoff(avatar,boundaryDuration);
   const walking=next.index!==null&&scrollTop>=centers[0]-halfViewport-2&&scrollTop<=centers.at(-1)-halfViewport+2;
   moveJourney(next.top,next.index,walking);
 }

 const requestUpdate=()=>{if(!updateFrame) updateFrame=requestAnimationFrame(update);};
 window.addEventListener('wheel',onJourneyWheel,{passive:false});
 window.addEventListener('wheel',event=>{if(!desktopJourney.matches&&event.deltaY<0) cancelMobileEntry();},{passive:true});
 window.addEventListener('touchstart',onMobileTouchStart,{passive:true});
 window.addEventListener('touchmove',onMobileTouchMove,{passive:false});
 window.addEventListener('touchend',onMobileTouchEnd,{passive:true});
 window.addEventListener('touchcancel',()=>{mobileTouching=false;mobileSwipe=null;cancelMobileEntry();},{passive:true});
 document.addEventListener('click',event=>{
   if(event.target.closest?.('[data-scroll-target],[data-preview-go],[data-go]')) stopJourneyTransition();
 },true);
 document.addEventListener('focusin',event=>{
   if(event.target.matches('input,select,textarea,[contenteditable]')) stopJourneyTransition();
 });
 window.addEventListener('popstate',stopJourneyTransition);
 window.addEventListener('scroll',requestUpdate,{passive:true});
 window.addEventListener('resize',()=>{
   cardReaction?.cancel();
   if(journeyFrame||mobileWalkFrame) stopJourneyTransition();
   requestUpdate();
   positionSpeech();
 });
 reduce.addEventListener('change',()=>{if(reduce.matches){cardReaction?.cancel();stopJourneyTransition();}});
 requestUpdate();
}
