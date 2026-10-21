'use strict';
// First-frame readiness plus the identity reveal; no percentage or artificial hold.
const intro=$('.intro-loader');
let introFinished=false,introFinishing=false,introTimeout=0,introReady=false,introRevealDone=false;
const introAnimations=[];
function hideIntro(){
 if(introFinished)return;introFinished=true;introFinishing=false;clearTimeout(introTimeout);
 introAnimations.forEach(a=>a?.cancel());intro.hidden=true;intro.setAttribute('aria-busy','false');document.documentElement.dataset.intro='off';
 if(intro.contains(document.activeElement))$('.brand').focus({preventScroll:true});
}
function finishIntro(immediate=false){
 if(introFinished)return;
 if(immediate||reduced||document.hidden){hideIntro();return;}
 if(introFinishing)return;introFinishing=true;intro.setAttribute('aria-busy','false');
 intro.classList.add('is-exiting');
 const exit=animateMotion(intro,[{opacity:1,transform:'translate3d(0,0,0) scale(1)'},{opacity:.88,transform:'translate3d(0,0,0) scale(1.018)',offset:.58},{opacity:0,transform:'translate3d(0,0,0) scale(1.045)'}],{duration:420,easing:'cubic-bezier(.72,0,.22,1)'});
 if(exit)exit.finished.then(hideIntro,hideIntro);else hideIntro();
}
function completeIntroWhenReady(){if(introReady&&introRevealDone)finishIntro();}
function firstFrameImageCheck(img){return new Promise(resolve=>{
 const done=()=>{cleanup();if(img.naturalWidth&&img.decode)img.decode().catch(()=>{}).then(()=>resolve(true));else resolve(!!img.naturalWidth)};
 const cleanup=()=>{img.removeEventListener('load',done);img.removeEventListener('error',done)};
 if(img.complete){done();return;}img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});
});}
if(document.documentElement.dataset.intro!=='pending'||reduced){hideIntro();}
else{
 introAnimations.push(...$$('.intro-word>span').map((el,i)=>animateMotion(el,[{transform:'translate3d(0,18%,0) rotateX(-22deg) scaleY(.88)',opacity:.12},{transform:'translate3d(0,-2%,0) rotateX(2deg) scaleY(1.015)',opacity:1,offset:.78},{transform:'translate3d(0,0,0) rotateX(0deg) scaleY(1)',opacity:1}],{duration:720,delay:i*46,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'})));
 introAnimations.push(animateMotion($('.intro-light'),[{transform:'translate3d(-72%,0,0) skewX(-9deg)',opacity:0},{opacity:.85,offset:.42},{transform:'translate3d(72%,0,0) skewX(-9deg)',opacity:0}],{duration:980,delay:110,easing:'cubic-bezier(.4,0,.2,1)'}));
 introAnimations.push(animateMotion($('.intro-prism'),[{transform:'translate3d(-50%,-50%,0) rotate(45deg) scale(.55)',opacity:0},{opacity:.52,offset:.45},{transform:'translate3d(-50%,-50%,0) rotate(45deg) scale(1.16)',opacity:0}],{duration:900,delay:120,easing:'cubic-bezier(.16,1,.3,1)'}));
 const revealPromises=introAnimations.filter(Boolean).map(a=>a.finished.catch(()=>{}));
 Promise.all(revealPromises).then(()=>{introRevealDone=true;completeIntroWhenReady()});
 if(!revealPromises.length){introRevealDone=true;}
 const images=[$('.hero-full'),$('.close-reveal img')];let settled=0,loaded=0;
 images.forEach(img=>firstFrameImageCheck(img).then(ok=>{
  settled++;if(ok)loaded++;if(introFinished)return;
  $('.intro-progress').setAttribute('aria-valuenow',String(settled));$('.intro-progress i').style.transform=`scaleX(${settled/images.length})`;
  $('.intro-status').textContent=`FIRST FRAME / ${settled} OF ${images.length} IMAGE CHECKS COMPLETE`;
  if(settled===images.length){if(loaded!==images.length)$('.intro-status').textContent='CONTINUING / SOME MEDIA UNAVAILABLE';introReady=true;completeIntroWhenReady();}
 }));
 // A ceiling only: slow or failed requests never hold the portfolio hostage.
 introTimeout=setTimeout(()=>{introReady=true;completeIntroWhenReady()},2200);
}
$('.intro-skip').addEventListener('click',()=>finishIntro(true));
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')finishIntro(true)});
document.addEventListener('pointerdown',ev=>{if(ev.target.closest('header a,.skip,.hero-copy a'))finishIntro(true)},{capture:true,passive:true});
document.addEventListener('click',ev=>{if(ev.target.closest('header a,.skip,.hero-copy a'))finishIntro(true)},{capture:true});
addEventListener('minx:motionchange',()=>{if(reduced)finishIntro(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)finishIntro(true)});

// One tactile vocabulary for mouse, touch, pen and keyboard; native video stays native.
const interactiveSelector='a[href],button';
let pressedElement=null;
function releasePress(){pressedElement?.classList.remove('is-pressed');pressedElement=null;}
document.addEventListener('pointerdown',ev=>{const el=ev.target.closest(interactiveSelector);if(!el||el.disabled)return;releasePress();pressedElement=el;el.classList.add('is-pressed');if(reduced||el.closest('.featured-media,.archive-card'))return;const r=el.getBoundingClientRect(),wave=document.createElement('span');wave.className='tap-wave';wave.style.left=`${ev.clientX-r.left}px`;wave.style.top=`${ev.clientY-r.top}px`;el.append(wave);const a=wave.animate([{transform:'translate(-50%,-50%) scale(0)',opacity:.38},{transform:'translate(-50%,-50%) scale(1)',opacity:0}],{duration:520,easing:LUX});a.finished.then(()=>wave.remove(),()=>wave.remove())},{passive:true});
for(const event of ['pointerup','pointercancel','blur'])addEventListener(event,releasePress,{passive:true});
document.addEventListener('keydown',ev=>{if((ev.key==='Enter'||ev.key===' ')&&!ev.repeat){const el=ev.target.closest(interactiveSelector);if(el){releasePress();pressedElement=el;el.classList.add('is-pressed')}}});
document.addEventListener('keyup',releasePress);

// Overdamped, low-amplitude attraction on small controls. No cursor replacement.
const magnets=new Map();let magneticRAF=0,magneticTime=0;
const magneticControls=$$('nav a,.text-link,.pill,.gallery-controls button,.filters button,.motion-toggle,.copy-email,.contact-mail,.contact-phone,.social-links a,.footer-socials a,.archive-source a,.intro-skip,.close-project,.project-nav button,.project-nav a');
function magneticTick(now){
 magneticRAF=0;const dt=Math.min(.032,magneticTime?(now-magneticTime)/1000:.0167);magneticTime=now;let moving=false;
 for(const [el,s] of magnets){
  if(reduced){el.style.removeProperty('--mx');el.style.removeProperty('--my');magnets.delete(el);continue;}
  // Spring values are critically damped, so a release settles without bouncing.
  for(const axis of ['x','y']){const target=s['t'+axis];const velocity='v'+axis;s[velocity]+=(150*(target-s[axis])-25*s[velocity])*dt;s[axis]+=s[velocity]*dt;}
  el.style.setProperty('--mx',s.x.toFixed(3)+'px');el.style.setProperty('--my',s.y.toFixed(3)+'px');
  if(Math.abs(s.tx-s.x)+Math.abs(s.ty-s.y)+Math.abs(s.vx)+Math.abs(s.vy)>.035)moving=true;
  else if(!s.hover){el.style.removeProperty('--mx');el.style.removeProperty('--my');magnets.delete(el);}
 }
 if(moving)magneticRAF=requestAnimationFrame(magneticTick);else magneticTime=0;
}
function runMagnets(){if(!magneticRAF&&!reduced)magneticRAF=requestAnimationFrame(magneticTick);}
for(const el of magneticControls){
 el.addEventListener('pointermove',ev=>{if(reduced||ev.pointerType!=='mouse')return;const rect=el.getBoundingClientRect();let s=magnets.get(el);if(!s){s={x:0,y:0,vx:0,vy:0,tx:0,ty:0,hover:true};magnets.set(el,s)}s.tx=clamp((ev.clientX-rect.left)/rect.width-.5,-.5,.5)*5;s.ty=clamp((ev.clientY-rect.top)/rect.height-.5,-.5,.5)*4;s.hover=true;runMagnets()},{passive:true});
 const release=()=>{const s=magnets.get(el);if(s){s.tx=0;s.ty=0;s.hover=false;runMagnets()}};
 el.addEventListener('pointerleave',release,{passive:true});el.addEventListener('blur',release);
}
for(const card of $$('.featured-media,.archive-card')){
 const surface=card.matches('.archive-card')?$('.archive-media',card):card;
 card.addEventListener('pointermove',ev=>{if(reduced||ev.pointerType!=='mouse')return;const r=surface.getBoundingClientRect(),x=clamp((ev.clientX-r.left)/r.width),y=clamp((ev.clientY-r.top)/r.height);surface.style.setProperty('--hx',`${x*100}%`);surface.style.setProperty('--hy',`${y*100}%`);surface.style.setProperty('--rx',`${(y-.5)*-3.2}deg`);surface.style.setProperty('--ry',`${(x-.5)*4.2}deg`)},{passive:true});
 card.addEventListener('pointerleave',()=>{surface.style.setProperty('--rx','0deg');surface.style.setProperty('--ry','0deg')},{passive:true});
}
addEventListener('minx:motionchange',()=>{if(reduced){cancelAnimationFrame(magneticRAF);magneticRAF=0;for(const [el] of magnets){el.style.removeProperty('--mx');el.style.removeProperty('--my')}magnets.clear();releasePress();}});

// A masked title enters once, without hiding unobserved or reduced-motion content.
const titleObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const el=entry.target;titleObserver.unobserve(el);animateMotion(el,[{clipPath:'inset(0 0 95% 0)',transform:'translate3d(0,18px,0)'},{clipPath:'inset(0)',transform:'translate3d(0,0,0)'}],{duration:850,easing:LUX});}},{threshold:.15});
$$('.archive-head h2,.about-intro>h2,.process-copy h2,.contact h2').forEach(el=>titleObserver.observe(el));

// Pre-decode the lightweight scrub sequence near its scene, avoiding blank frames on seeks.
const sequenceImages=[];let sequenceReady=false;
const sequenceObserver=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;sequenceObserver.disconnect();
 Promise.all(Array.from({length:24},(_,i)=>new Promise(resolve=>{const img=new Image();sequenceImages[i]=img;img.onload=()=>img.decode().catch(()=>{}).then(resolve);img.onerror=resolve;img.src=`assets/sequence/spiderverse-${String(i+1).padStart(2,'0')}.jpg`;}))).then(()=>{sequenceReady=true;requestRender()});
},{rootMargin:'100% 0px'});sequenceObserver.observe($('#edit'));
