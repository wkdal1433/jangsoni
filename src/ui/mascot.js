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
 function mountAtlas(parent, source, crop){
   const namespace='http://www.w3.org/2000/svg';
   const svg=document.createElementNS(namespace,'svg');
   svg.setAttribute('aria-hidden','true');
   svg.setAttribute('class',atlas.referenceBackground?'mascot-atlas reference-atlas':'mascot-atlas');
   svg.setAttribute('width',crop[2]);
   svg.setAttribute('height',crop[3]);
   svg.setAttribute('viewBox',crop.join(' '));
   svg.setAttribute('preserveAspectRatio','xMidYMax meet');
   const image=document.createElementNS(namespace,'image');
   image.setAttribute('href',source.src);
   image.setAttribute('width',source.naturalWidth);
   image.setAttribute('height',source.naturalHeight);
   svg.append(image);
   parent.append(svg);
   return svg;
 }
 if(atlas){
   const source=new Image();
   source.onload=()=>{
     if(atlas.hero){
       mountAtlas(stage,source,atlas.hero);
       original.hidden=true;
       stage.classList.add('has-mascot-atlas');
     }
     journeyAtlas=mountAtlas(avatar,source,atlas.stand);
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
