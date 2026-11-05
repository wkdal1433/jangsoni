import { mountAtlas } from './sprite.js';

export function createMascot(root, atlas) {
 const original=root.querySelector('img.mascots-img');
 const stage=root.querySelector('.hero-art .mascot-stage');
 root.querySelectorAll('img[data-mascot-clone]').forEach(img=>{ img.src=original.src; });
 const avatar=root.querySelector('.journey-mascot-wrap');
 const walkImg=root.querySelector('#journey-walk-frame');
 const staticImg=root.querySelector('#journey-static-frame');
 const frames=Array.isArray(window.JANGSONI_WALK_FRAMES)?window.JANGSONI_WALK_FRAMES.filter(x=>typeof x==='string'&&x):[];
 const stand=typeof window.JANGSONI_STAND_FRAME==='string'?window.JANGSONI_STAND_FRAME.trim():'';
 const frameCount=atlas?atlas.walk.length:frames.length;
 // Keep the seated image as a fallback until the walking poses have loaded.
 let spritesReady=false;
 let journeyAtlas=null;
 if(atlas){
   const source=new Image();
   source.onload=()=>{
     if(atlas.hero){
       mountAtlas(stage,source,atlas.hero,atlas.referenceBackground?'mascot-atlas reference-atlas':'mascot-atlas');
       original.hidden=true;
       stage.classList.add('has-mascot-atlas');
     }
     journeyAtlas=mountAtlas(avatar,source,atlas.stand,atlas.referenceBackground?'mascot-atlas reference-atlas':'mascot-atlas');
     staticImg.hidden=true;
     avatar.closest('.journey-sticky').classList.add('has-mascot-atlas');
     spritesReady=true;
   };
   source.src=atlas.src;
 }else if(frames.length>=4&&walkImg&&staticImg&&avatar){
   const all=[...frames,...(stand?[stand]:[])];
   Promise.all(all.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(src);img.onerror=reject;img.src=src;})))
     .then(()=>{staticImg.src=stand||frames[0];spritesReady=true;}).catch(()=>{});
 }
 function showJourneyPose(index){
   if(journeyAtlas){
     const crop=index<0?atlas.stand:atlas.walk[index];
     journeyAtlas.setAttribute('viewBox',crop.join(' '));
   }else{
     if(index>=0) walkImg.src=frames[index];
     walkImg.hidden=index<0;
     staticImg.hidden=index>=0;
   }
 }
 return {avatar, frameCount, showJourneyPose, get ready(){ return spritesReady; }};
}
