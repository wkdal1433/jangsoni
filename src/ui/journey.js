export function setupJourney(root, tour, reduce, mascot, handoff) {
 const journey=root.querySelector('#landing-journey');
 const steps=[...root.querySelectorAll('.journey-step')];
 const sentence=root.querySelector('#journey-speech');
 const counter=root.querySelector('#journey-counter');
 const bar=root.querySelector('#journey-progress-bar');
 const phrases=['여기부터 살펴볼게요.','약관도 확인해 봐요.','코드도 찾아볼까요?','판례는 이쪽이에요.','논문도 같이 봐요.','음… 이것도 중요해요.','이제 정리해 볼까요?'];
 const {avatar, frameCount, showJourneyPose}=mascot;
 const desktopJourney=window.matchMedia('(min-width: 721px)');
 const walkDuration=900;
 const boundaryDuration=420;
 const beforeJourney=root.querySelector("#landing-guide");
 const afterJourney=root.querySelector(".demo-section");
 const wheelQuietTime=120;
 let active=-1, updateFrame=0, journeyFrame=0, lastWheel=-Infinity;
 let cardReaction;

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
   if(root.hidden||tour.hidden||journeyFrame) return;
   const viewport=window.innerHeight;
   const rect=journey.getBoundingClientRect();
   if(rect.bottom<0||rect.top>viewport) return;
   const focusLine=viewport*(desktopJourney.matches?.5:.66);
   setActive(nearestCard(cardCenters(),window.scrollY+focusLine));
 }

 function stopJourneyTransition(){
   cancelAnimationFrame(journeyFrame);
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
   let displayedFrame=-1;
   const tick=now=>{
     if(root.hidden||tour.hidden||reduce.matches||!desktopJourney.matches){
       stopJourneyTransition();
       return;
     }
     const progress=Math.min(1,(now-start)/duration);
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
       const gait=Math.floor(progress*1.5*frameCount)%frameCount;
       if(gait!==displayedFrame){
         showJourneyPose(gait);
         displayedFrame=gait;
       }
       const lift=Math.sin(progress*3*Math.PI);
       avatar.style.transform='translateY('+(-5*lift*lift)+'px)';
     }
     journeyFrame=requestAnimationFrame(tick);
   };
   journeyFrame=requestAnimationFrame(tick);
 }

 function onJourneyWheel(event){
   if(root.hidden||tour.hidden||!desktopJourney.matches||reduce.matches||!mascot.ready) return;
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
   const targets=[
     {top:topOf(beforeJourney),index:null},
     {top:topOf(journey),index:null},
     ...centers.map((center,index)=>({top:center-halfViewport,index})),
     {top:topOf(afterJourney),index:null},
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
   event.preventDefault();
   lastWheel=now;
   cardReaction?.cancel();
   if(direction>0&&next.top===last) handoff(avatar,boundaryDuration);
   const walking=next.index!==null&&scrollTop>=centers[0]-halfViewport-2&&scrollTop<=centers.at(-1)-halfViewport+2;
   moveJourney(next.top,next.index,walking);
 }

 const requestUpdate=()=>{if(!updateFrame) updateFrame=requestAnimationFrame(update);};
 window.addEventListener('wheel',onJourneyWheel,{passive:false});
 window.addEventListener('scroll',requestUpdate,{passive:true});
 window.addEventListener('resize',()=>{
   cardReaction?.cancel();
   if(journeyFrame) stopJourneyTransition();
   requestUpdate();
 });
 reduce.addEventListener('change',()=>{if(reduce.matches) cardReaction?.cancel();});
 requestUpdate();
}
