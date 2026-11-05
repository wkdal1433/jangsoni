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
   const viewCenter=window.scrollY+halfViewport;
   const first=centers[0], last=centers[centers.length-1];
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);
   if(viewCenter<first-2||viewCenter>last+2){
     const enteringFromAbove=viewCenter<first&&viewCenter+delta>=first;
     const enteringFromBelow=viewCenter>last&&viewCenter+delta<=last;
     if(!enteringFromAbove&&!enteringFromBelow) return;
     event.preventDefault();
     lastWheel=now;
     const entry=enteringFromAbove?0:centers.length-1;
     moveJourney(centers[entry]-halfViewport,entry);
     return;
   }

   const next=nearestCard(centers,viewCenter)+direction;
   event.preventDefault();
   lastWheel=now;
   if(next<0||next>=centers.length){
     if(next>=centers.length) handoff(avatar,boundaryDuration);
     const destination=(next<0?beforeJourney:afterJourney).getBoundingClientRect();
     moveJourney(window.scrollY+(destination.top+destination.bottom)/2-halfViewport,null);
   }else{
     moveJourney(centers[next]-halfViewport,next,true);
   }
 }

 const requestUpdate=()=>{if(!updateFrame) updateFrame=requestAnimationFrame(update);};
 window.addEventListener('wheel',onJourneyWheel,{passive:false});
 window.addEventListener('scroll',requestUpdate,{passive:true});
 window.addEventListener('resize',()=>{
   if(journeyFrame) stopJourneyTransition();
   requestUpdate();
 });
 requestUpdate();
}
