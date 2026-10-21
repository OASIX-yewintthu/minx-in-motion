'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const preferenceStore={get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};
const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
let explicitMotion=preferenceStore.get('minx-motion');
let reduced=explicitMotion?explicitMotion==='reduced':systemMotion.matches;
const motionAnimations=new Set();
const LUX='cubic-bezier(.22,.8,.2,1)';
function animateMotion(el,frames,options){
 if(reduced||!el?.animate)return null;
 const animation=el.animate(frames,options);motionAnimations.add(animation);
 animation.finished.then(()=>motionAnimations.delete(animation),()=>motionAnimations.delete(animation));return animation;
}
function cancelMotionAnimations(){for(const animation of motionAnimations)animation.cancel();motionAnimations.clear();}
let transitionSerial=0,returnHash="#work";
let featured=PROJECTS.filter(p=>p.featured), activeProject=null, returnFocus=null, savedScroll=0, currentFeature=0, dialogOpen=false, transitionBusy=false;
const dialog=$('.project-dialog'),player=$('.full-player');
const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const playIcon='<svg class="ui-icon" aria-hidden="true"><use href="#icon-play"/></svg>';
function projectCard(p,i,featuredCard=false){return featuredCard?`<article class="featured-card" data-slug="${p.slug}"><button class="featured-media" data-project="${p.slug}" aria-label="Watch ${p.title}"><video class="preview" muted playsinline loop preload="none" poster="assets/${p.slug}-poster.jpg" data-src="assets/${p.slug}-preview.mp4" aria-hidden="true"></video><span class="feature-index">0${i+1} / ${p.category.toUpperCase()}</span><span class="feature-text"><span><span class="eyebrow">${p.label}</span><h3>${p.title}</h3></span><span class="play-circle" aria-hidden="true">${playIcon}</span></span></button></article>`:`<button class="archive-card" data-project="${p.slug}" data-category="${p.category}" aria-label="Watch ${p.title}"><div class="archive-media"><img src="assets/${p.slug}-poster.jpg" alt="Frame from ${p.title}" loading="lazy"><span class="mini-play" aria-hidden="true">${playIcon}</span></div><h3>${p.title}</h3><span class="mono">${p.category.toUpperCase()} / ${fmt(p.duration)}</span></button>`}
$('.gallery-track').innerHTML=featured.map((p,i)=>projectCard(p,i,true)).join('');
$('.archive-grid').innerHTML=PROJECTS.map((p,i)=>projectCard(p,i)).join('');
$('.frame-world').innerHTML=featured.map((p,i)=>`<div class="floating-frame" data-plane="${i}"><img src="assets/${p.slug}-poster.jpg" alt=""></div>`).join('');
$('.tracks').innerHTML=[0,1,2].map((r)=>`<div class="track">${[...featured,...featured].map((p,i)=>`<div class="clip">${[0,1,2].map(()=>`<img src="assets/${p.slug}-poster.jpg" alt="">`).join('')}</div>`).join('')}</div>`).join('')+'<div class="waveform"></div>';
const previewObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(!e.isIntersecting){e.target.pause();}})},{threshold:.2});$$('.preview').forEach(v=>previewObserver.observe(v));
function playPreview(i){$$('.preview').forEach((v,j)=>{if(j===i&&!reduced&&!dialogOpen&&!document.hidden){if(!v.src){v.src=v.dataset.src;v.load()}if(v.paused)v.play().catch(()=>{});}else v.pause();});}
let dims={},dirty=true,raf=0,lastFrame=0,filmY=scrollY,cursor={x:0,y:0},camera={x:0,y:0};
const sceneElements={heroFull:$('.hero-full'),heroWord:$('.hero-word'),heroSubject:$('.hero-subject'),heroCopy:$('.hero-copy'),heroEnvironment:$('.hero-environment'),close:$('.close-reveal'),slit:$('.light-slit'),timecode:$('.timecode'),planes:$$('.floating-frame'),portalTitle:$('.portal-title'),timeline:$('.timeline-camera'),playhead:$('.playhead'),assembled:$('.assembled-frame'),sequence:$('.assembled-frame img'),editHeading:$('.edit-heading'),track:$('.gallery-track'),cards:$$('.featured-card'),counter:$('#gallery-counter'),reading:$('.reading-progress'),chapters:$$('.chapter-progress a')};
let galleryStep=0,timelineWidth=0,focusedPreview=-2;
function setMotion(){
 let anchor=null,position=0;const previousFeature=currentFeature;
 for(const id of ['film','portal','edit','work','about','process','contact']){const d=dims[id];if(d&&scrollY>=d.top-1){anchor=id;position=clamp((scrollY-d.top)/Math.max(1,d.height-innerHeight));}}
 if(anchor==='work')position=previousFeature/(featured.length-1);
 document.body.classList.toggle('reduced',reduced);document.documentElement.dataset.motion=reduced?'reduced':'full';
 if(reduced){cancelMotionAnimations();$$('.preview').forEach(v=>v.pause());}
 $('.motion-toggle').setAttribute('aria-pressed',String(reduced));$('.motion-toggle').title=reduced?'Enable cinematic motion':'Reduce motion';
 camera={x:0,y:0};cursor={x:0,y:0};measure();
 if(anchor){const d=dims[anchor];scrollTo({top:d.top+position*Math.max(0,d.height-innerHeight),behavior:'instant'});}
 if(reduced){sceneElements.track.scrollLeft=previousFeature*galleryStep;sceneElements.counter.textContent=`0${previousFeature+1} / 0${featured.length}`;}
 filmY=scrollY;lastFrame=0;focusedPreview=-2;requestRender();dispatchEvent(new Event('minx:motionchange'));
}
$('.motion-toggle').addEventListener('click',()=>{reduced=!reduced;explicitMotion=reduced?'reduced':'full';preferenceStore.set('minx-motion',explicitMotion);setMotion();});
systemMotion.addEventListener('change',e=>{if(!explicitMotion){reduced=e.matches;setMotion();}});
function measure(){for(const id of ['film','portal','edit','work','about','process','contact']){const el=$('#'+id);dims[id]={top:el.offsetTop,height:el.offsetHeight};}galleryStep=sceneElements.cards[0].offsetWidth+innerWidth*.06;timelineWidth=sceneElements.timeline.offsetWidth;}
function progress(id){const d=dims[id];return clamp((filmY-d.top)/Math.max(1,d.height-innerHeight));}
function focusPreview(i){if(i!==focusedPreview){focusedPreview=i;playPreview(i);}}
function snapCamera(){filmY=scrollY;lastFrame=0;requestRender();}
function requestRender(){dirty=true;if(!raf)raf=requestAnimationFrame(render);}
function render(now){raf=0;if(!dirty||dialogOpen)return;dirty=false;
const dt=Math.min(48,lastFrame?now-lastFrame:16.7);lastFrame=now;
const targetY=scrollY;filmY=reduced?targetY:lerp(filmY,targetY,1-Math.exp(-dt/(innerWidth<600?48:72)));
if(Math.abs(filmY-targetY)<.15)filmY=targetY;
const y=filmY;let p=progress('film'),q=progress('portal'),e=progress('edit'),w=progress('work');const mobile=innerWidth<600;
if(!reduced){
 // A reversible iris and a dolly pullback: one scroll position owns all scene state.
 const iris=smooth(clamp((p-.07)/.21));const pull=smooth(clamp((p-.26)/.38));const exit=smooth(clamp((p-.72)/.28));
 const close=sceneElements.close;close.style.opacity=String(Math.sin(clamp(p/.42)*Math.PI)*.97);close.style.clipPath=`inset(${lerp(12,0,iris)}% ${lerp(48,0,iris)}%)`;close.style.transform=`scale(${lerp(1.25,1,iris)})`;
 sceneElements.slit.style.opacity=String(Math.sin(clamp(p/.28)*Math.PI));sceneElements.heroFull.style.transform=`scale(${1+exit*.22}) translateX(${exit*4}%)`;
 sceneElements.heroWord.style.transform=`translate3d(${exit*-100}px,${pull*-35}px,${pull*130}px) scale(${1+pull*.1})`;
 sceneElements.heroSubject.style.transform=`scale(${1+exit*.22}) translateX(${exit*4}%)`;
 sceneElements.heroCopy.style.transform=`translate3d(${exit*-90}px,${exit*-30}px,0)`;sceneElements.heroCopy.style.opacity=String(1-exit*.9);
 sceneElements.heroEnvironment.style.transform=`perspective(1200px) rotateY(${camera.x*1.2}deg) rotateX(${-camera.y*.6}deg)`;
 sceneElements.timecode.textContent=`00:00:${String(Math.floor(p*28)).padStart(2,'0')}:${String(Math.floor(p*840)%30).padStart(2,'0')}`;
 const portalVisible=y>dims.portal.top-innerHeight&&y<dims.portal.top+dims.portal.height;
 if(portalVisible){const base=[[-.9,-.08,-350,-18],[.16,.12,-80,12],[-.55,.5,-600,10],[.65,.44,-450,-15]];sceneElements.planes.forEach((el,i)=>{let [x,t,z,r]=base[i];let zmove=smooth(q)*900;el.style.transform=`translate3d(${x*(mobile?innerWidth*.7:innerWidth*.6)-q*innerWidth*.18}px,${t*innerHeight-q*innerHeight*.18}px,${z+zmove}px) rotateY(${r*(1-q)}deg) rotateZ(${(i%2?1:-1)*3*(1-q)}deg)`;el.style.opacity=String((1-smooth(clamp((z+zmove-300)/400)))*smooth(clamp((1-q)*5)));});sceneElements.portalTitle.style.transform=`translateX(${-q*140}px)`;sceneElements.portalTitle.style.opacity=String(clamp(1-q*2));}
 if(y>dims.edit.top-innerHeight&&y<dims.edit.top+dims.edit.height){const fold=smooth(clamp((e-.5)/.45));sceneElements.timeline.style.transform=`translate3d(${-e*innerWidth*.3}px,${-e*60}px,${-fold*550}px) rotateX(${45-fold*45}deg) rotateY(${fold*-25}deg) rotateZ(${-15+fold*15}deg) scale(${1-fold*.45})`;sceneElements.timeline.style.opacity=String(1-fold);sceneElements.playhead.style.transform=`translate3d(${e*timelineWidth*.6}px,0,0)`;sceneElements.assembled.style.opacity=String(fold);const frame=String(1+Math.floor(clamp((e-.5)/.48)*23)).padStart(2,'0');const seq=sceneElements.sequence;const path=`assets/sequence/spiderverse-${frame}.jpg`;if(typeof sequenceReady!=='undefined'&&sequenceReady&&seq.getAttribute('src')!==path)seq.src=path;sceneElements.assembled.style.transform=`translate3d(${-fold*innerWidth*.08}px,${-fold*50}px,${fold*100}px) rotateY(${(1-fold)*-25}deg) scale(${.6+fold*.55})`;sceneElements.editHeading.style.transform=`translateY(${-fold*60}px)`;sceneElements.editHeading.style.opacity=String(1-fold*.8);}
 const track=sceneElements.track,cards=sceneElements.cards,step=galleryStep;const total=step*(featured.length-1);track.style.transform=`translate3d(${-w*total}px,0,0)`;const fi=clamp(Math.round(w*(featured.length-1)),0,featured.length-1);currentFeature=fi;
 cards.forEach((el,i)=>{const distance=i-w*(featured.length-1);el.style.transform=`perspective(1400px) rotateY(${clamp(distance,-1,1)*-9}deg) translateZ(${-Math.abs(clamp(distance,-1.5,1.5))*45}px)`;});
 if(y>=dims.work.top-innerHeight*.05&&y<dims.work.top+dims.work.height-innerHeight*.3)focusPreview(fi);else focusPreview(-1);
 sceneElements.counter.textContent=`0${fi+1} / 0${featured.length}`;
}else focusPreview(-1);
const fraction=scrollY/(document.documentElement.scrollHeight-innerHeight);sceneElements.reading.style.width=`${clamp(fraction)*100}%`;
let chapter='film';for(const id of ['film','portal','edit','work','about','process','contact'])if(y>=dims[id].top-innerHeight*.4)chapter=id;sceneElements.chapters.forEach(a=>a.classList.toggle('active',a.hash==='#'+chapter));
if(!reduced){const alpha=1-Math.exp(-dt/130);camera.x=lerp(camera.x,cursor.x,alpha);camera.y=lerp(camera.y,cursor.y,alpha);if(Math.abs(cursor.x-camera.x)>.005||Math.abs(cursor.y-camera.y)>.005||Math.abs(filmY-targetY)>.15)requestRender();}
}
addEventListener('scroll',requestRender,{passive:true});addEventListener('resize',()=>{measure();snapCamera();},{passive:true});addEventListener('pointermove',ev=>{if(ev.pointerType!=='mouse'||reduced)return;cursor={x:(ev.clientX/innerWidth-.5)*2,y:(ev.clientY/innerHeight-.5)*2};requestRender();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){$$('video').forEach(v=>v.pause());}else{focusedPreview=-2;requestRender()}});
function jumpFeature(dir){const next=clamp(currentFeature+dir,0,featured.length-1);if(reduced){const card=sceneElements.cards[next];sceneElements.track.scrollTo({left:card.offsetLeft,behavior:'instant'});currentFeature=next;$('#gallery-counter').textContent=`0${next+1} / 0${featured.length}`;}else scrollTo({top:dims.work.top+next/(featured.length-1)*(dims.work.height-innerHeight),behavior:'smooth'});}
$('#prev-feature').addEventListener('click',()=>jumpFeature(-1));$('#next-feature').addEventListener('click',()=>jumpFeature(1));
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$$('.archive-card').forEach(c=>c.hidden=b.dataset.filter!=='all'&&c.dataset.category!==b.dataset.filter);measure();requestRender();}));
function fillProject(p){activeProject=p;$('.project-category').textContent=`${p.category.toUpperCase()} / ${p.label}`;$('#project-title').textContent=p.title;$('.project-context').textContent=p.context;$('.project-format').textContent=`${p.width} × ${p.height}`;$('.project-duration').textContent=fmt(p.duration);player.pause();player.poster=`assets/${p.slug}-poster.jpg`;player.src=`assets/${p.slug}.mp4`;player.load();$('.video-error').hidden=true;$('.video-error a').href=p.source;dialog.scrollTop=0;document.title=`${p.title} — MINX / FRAME/SHIFT`;}
function projectTransitionMedia(p,useCurrentFrame=false){
 const layer=$('.transition-frame');layer.replaceChildren();
 if(useCurrentFrame&&player.readyState>=2){try{const canvas=document.createElement('canvas');canvas.width=Math.min(1280,player.videoWidth);canvas.height=Math.round(canvas.width*player.videoHeight/player.videoWidth);canvas.getContext('2d').drawImage(player,0,0,canvas.width,canvas.height);layer.append(canvas);return layer;}catch{}}
 const img=new Image();img.src=`assets/${p.slug}-poster.jpg`;img.alt='';layer.append(img);return layer;
}
function stopProjectTransition(){transitionSerial++;const layer=$('.transition-frame');layer.getAnimations().forEach(a=>a.cancel());layer.style.opacity='0';layer.replaceChildren();transitionBusy=false;}
async function openProject(slug,trigger,push=true){
 const p=PROJECTS.find(p=>p.slug===slug);if(!p||transitionBusy)return;
 stopProjectTransition();transitionBusy=true;const serial=transitionSerial;
 const rect=trigger?.getBoundingClientRect();
 if(!dialogOpen){returnHash=location.hash.startsWith('#project/')?'#work':(location.hash||'#work');savedScroll=trigger?scrollY:(location.hash.startsWith('#project/')?dims.work.top:scrollY);returnFocus=trigger||document.querySelector(`[data-project="${slug}"]`);}
 focusPreview(-1);fillProject(p);dialogOpen=true;if(!dialog.open)dialog.showModal();dialog.classList.add('visible');$('.close-project').focus({preventScroll:true});
 if(push)history.pushState({project:slug},'',`#project/${slug}`);
 if(rect&&!reduced){
  const layer=projectTransitionMedia(p);dialog.append(layer);layer.style.opacity='1';
  const from=`translate3d(${rect.left}px,${rect.top}px,0) scale(${rect.width/innerWidth},${rect.height/innerHeight})`;
  const a=animateMotion(layer,[{transform:from,opacity:1},{transform:'translate3d(0,0,0) scale(1)',opacity:1,offset:.8},{transform:'translate3d(0,0,0) scale(1)',opacity:0}],{duration:540,easing:LUX});
  if(a)await a.finished.catch(()=>{});
 }
 if(serial===transitionSerial){const layer=$('.transition-frame');layer.style.opacity='0';layer.replaceChildren();transitionBusy=false;}
}
function closeProject(updateHistory=true){
 if(!dialog.open)return;
 const p=activeProject;stopProjectTransition();const layer=projectTransitionMedia(p,true);document.body.append(layer);
 player.pause();player.removeAttribute('src');player.load();dialog.classList.remove('visible');dialog.close();dialogOpen=false;document.title='MINX — FRAME/SHIFT · Video Editor';
 if(updateHistory)history.replaceState(null,'',returnHash);
 scrollTo({top:savedScroll,behavior:'instant'});snapCamera();returnFocus?.focus({preventScroll:true});
 const rect=returnFocus?.getBoundingClientRect();
 if(!reduced&&rect&&rect.bottom>0&&rect.top<innerHeight){
  const serial=transitionSerial;layer.style.opacity='1';
  const to=`translate3d(${rect.left}px,${rect.top}px,0) scale(${rect.width/innerWidth},${rect.height/innerHeight})`;
  const a=animateMotion(layer,[{transform:'translate3d(0,0,0) scale(1)',opacity:1},{transform:to,opacity:.8,offset:.85},{transform:to,opacity:0}],{duration:430,easing:LUX});
  a?.finished.catch(()=>{}).then(()=>{if(serial===transitionSerial){layer.style.opacity='0';layer.replaceChildren();}});
 }else{layer.style.opacity='0';layer.replaceChildren();}
 focusedPreview=-2;requestRender();
}
document.addEventListener('click',ev=>{const t=ev.target.closest('[data-project]');if(t)openProject(t.dataset.project,t);});
$('.close-project').addEventListener('click',()=>closeProject());$('.return-gallery').addEventListener('click',()=>closeProject());
dialog.addEventListener('cancel',ev=>{ev.preventDefault();closeProject()});
$('.next-project').addEventListener('click',()=>{
 stopProjectTransition();const i=PROJECTS.indexOf(activeProject),p=PROJECTS[(i+1)%PROJECTS.length];
 fillProject(p);history.replaceState({project:p.slug},'',`#project/${p.slug}`);$('.close-project').focus({preventScroll:true});
 animateMotion($('.project-body'),[{transform:'translate3d(20px,0,0)',opacity:.72},{transform:'translate3d(0,0,0)',opacity:1}],{duration:360,easing:LUX});
});
player.addEventListener('error',()=>{if(player.getAttribute('src'))$('.video-error').hidden=false});
addEventListener('popstate',()=>{
 if(location.hash.startsWith('#project/'))openProject(location.hash.slice(9),null,false);
 else if(dialog.open)closeProject(false);else{document.title='MINX — FRAME/SHIFT · Video Editor';snapCamera();}
});
$('.copy-email').addEventListener('click',async()=>{try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText('gorgeousthawtar@gmail.com');}else{const input=document.createElement('textarea');input.value='gorgeousthawtar@gmail.com';input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();if(!copied)throw new Error('Copy unavailable');}const t=$('.toast');t.textContent='Email copied. Let’s make the next frame.';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}catch{location.href='mailto:gorgeousthawtar@gmail.com';}});
function enterInitialChapter(){measure();if(location.hash.startsWith('#project/')){if(!dialog.open)openProject(location.hash.slice(9),null,false);}else if(/^#[a-z-]+$/.test(location.hash)){const target=$(location.hash);if(target)scrollTo({top:target.offsetTop,behavior:'instant'});}snapCamera();}
setMotion();enterInitialChapter();addEventListener('load',enterInitialChapter,{once:true});
// Chapter links are immediate entry points, independent of the film's length.
$$('a[href^="#"]').filter(a=>!a.closest('dialog')).forEach(a=>a.addEventListener('click',ev=>{const target=$(a.getAttribute('href'));if(!target)return;ev.preventDefault();stopProjectTransition();history.pushState(null,'',a.getAttribute('href'));scrollTo({top:target.offsetTop,behavior:'instant'});snapCamera();}));

$('.project-bar .brand').addEventListener('click',ev=>{ev.preventDefault();closeProject();});

// Keep the static gallery counter in sync with touch/swipe when decorative motion is off.
sceneElements.track.addEventListener('scroll',()=>{if(reduced){const next=Math.round(sceneElements.track.scrollLeft/galleryStep);currentFeature=clamp(next,0,featured.length-1);sceneElements.counter.textContent=`0${currentFeature+1} / 0${featured.length}`;}},{passive:true});

document.addEventListener('pointerdown',ev=>{if(!dialogOpen&&ev.target.closest('a,button'))stopProjectTransition();},{capture:true,passive:true});
