const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const story=document.querySelector('.story-layout');
const stage=document.querySelector('.drawing-stage');
const fixedHeader=document.querySelector('.header');
const headerNavigation=fixedHeader?.querySelector('nav');
const chapters=[...document.querySelectorAll('.story-chapter')];
const drawingSteps=[
 {at:0,label:'Tegningsgrunnlag',title:'Et godt grunnlag.'},
 {at:.04,label:'Seksjonsgrenser',title:'Vi tegner opp seksjonene.'},
 {at:.52,label:'Arealfordeling',title:'Arealene får sin egen farge.'},
 {at:.73,label:'Seksjon 1 og 2',title:'De første seksjonene blir tydelige.'},
 {at:.83,label:'Seksjon 3, 4 og fellesareal',title:'Fire seksjoner. Fellesarealet binder dem sammen.'}
];
const color=document.querySelector('.drawing-color');
const planLabels=[...document.querySelectorAll('.plan-label')];
const planBoundaries=[...document.querySelectorAll('.plan-boundary')];
const progressbar=document.querySelector('.drawing-progress i');
const hero=document.querySelector('.hero-image img');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>x*x*(3-2*x);
stage.classList.add('has-scroll-labels');
let queued=false,active=-1,activeStep=-1;
function update(){
 // Let the three text links scroll out naturally; keep EFS and the action buttons fixed.
 // Opening the dialog temporarily fixes the body, so preserve the link position until it closes.
 if(headerNavigation&&!document.documentElement.classList.contains('menu-open')){
  const offset=Math.min(Math.max(scrollY,0),fixedHeader.offsetHeight);
  headerNavigation.style.setProperty('--nav-scroll',`${offset}px`);
  const hidden=headerNavigation.offsetHeight===0||offset>=headerNavigation.offsetTop+headerNavigation.offsetHeight;
  headerNavigation.inert=hidden;
  headerNavigation.setAttribute('aria-hidden',String(hidden));
 }
 const mobile=innerWidth<=760;
 const stageStyle=mobile?getComputedStyle(stage):null;
 const stickyStage=mobile&&stageStyle.position==='sticky';
 const stageBottom=stickyStage?stage.offsetHeight+(parseFloat(stageStyle.top)||0):0;
 const line=mobile?stageBottom+(innerHeight-stageBottom)*.45:innerHeight*.5;
 let nearest=0,dist=Infinity;
 chapters.forEach((chapter,i)=>{const r=chapter.getBoundingClientRect();const d=Math.abs(r.top+r.height/2-line);if(d<dist){dist=d;nearest=i;}});
 if(nearest!==active){active=nearest;chapters.forEach((c,i)=>c.classList.toggle('active',i===active));}
 const first=chapters[0].getBoundingClientRect();const last=chapters[chapters.length-1].getBoundingClientRect();
 const reduced=motionPreference.matches;
 const p=reduced?1:clamp((line-(first.top+first.height*.3))/((last.top+last.height*.7)-(first.top+first.height*.3)));
 const step=drawingSteps.findLastIndex(item=>p>=item.at);
 if(step!==activeStep){activeStep=step;document.querySelector('#drawing-title').textContent=drawingSteps[step].title;document.querySelector('#drawing-counter').textContent=`0${step+1} / 0${drawingSteps.length}`;document.querySelector('#drawing-label').textContent=drawingSteps[step].label;}
 // Trace the boundaries first, then reveal colour, and finally label each section.
 for(const boundary of planBoundaries){const drawn=clamp((p-Number(boundary.dataset.drawAt))/Number(boundary.dataset.drawDuration));boundary.style.setProperty('--boundary-offset',String(1-drawn));}
 color.style.clipPath=`inset(0 ${100-clamp((p-.52)/.18)*100}% 0 0)`;
 for(const label of planLabels){const reveal=ease(clamp((p-Number(label.dataset.revealAt))/.05));label.style.setProperty('--label-reveal',String(reveal));label.style.setProperty('--label-rise',`${(1-reveal)*6}px`);}
 progressbar.style.width=`${p*100}%`;
 if(!reduced){
 const hp=clamp(-document.querySelector('.hero').getBoundingClientRect().top/innerHeight);
 hero.style.transform=`scale(${1.04+hp*.04}) translateY(${hp*10}px)`;
 }
 queued=false;
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);motionPreference.addEventListener('change',schedule);update();
if(!motionPreference.matches){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.section-heading,.services-intro,.service-group,.process-grid,.experience,.logo-row').forEach(el=>{el.classList.add('reveal');io.observe(el)});}
document.querySelector('.copy').addEventListener('click',async()=>{
 const status=document.querySelector('#copy-status');
 const address=document.querySelector('.consultant-email').href.slice('mailto:'.length);
 try{await navigator.clipboard.writeText(address);status.textContent='E-postadressen er kopiert.'}
 catch{status.textContent='E-postadresse: '+address;}
});

// A native horizontal list: readable without JavaScript, controllable with touch and keyboard.
const projectViewport=document.querySelector('.project-viewport');
if(projectViewport){
 const track=projectViewport.querySelector('.project-track');
 const original=track.querySelector('.project-set');
 const duplicate=original.cloneNode(true);
 duplicate.setAttribute('aria-hidden','true');
 // Keep the looping copy clickable, with keyboard navigation on the original list only.
 duplicate.querySelectorAll('a,button,[tabindex]').forEach(element=>element.tabIndex=-1);
 track.append(duplicate);
 const controls=document.querySelector('.project-controls');
 const showcase=document.querySelector('.project-showcase');
 const toggle=controls.querySelector('.project-pause');
 controls.hidden=false;
 let paused=false,hovered=false,focused=false,visible=false,frame=0,lastTime=0,position=0;
 const period=()=>original.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap);
 function isRunning(){return !paused&&!hovered&&!focused&&visible&&!document.hidden&&!motionPreference.matches;}
 function tick(time){
  frame=0;
  if(!isRunning()){lastTime=0;return;}
  if(lastTime){
   const distance=Math.min(time-lastTime,50)*.026;
   const loop=period();
   position=(position+distance)%loop;
   projectViewport.scrollLeft=position;
  }
  lastTime=time;frame=requestAnimationFrame(tick);
 }
 function sync(){
  const reduced=motionPreference.matches;
  toggle.disabled=reduced;
  toggle.setAttribute('aria-pressed',String(paused||reduced));
  toggle.setAttribute('aria-label',reduced?'Automatisk bevegelse er av etter ditt ønske om redusert bevegelse':paused?'Start automatisk bevegelse':'Pause automatisk bevegelse');
  toggle.querySelector('.pause-label').textContent=reduced?'Bevegelse av':paused?'Start':'Pause';
  toggle.querySelector('span').textContent=paused||reduced?'▷':'Ⅱ';
  if(isRunning()){if(!frame){position=projectViewport.scrollLeft;frame=requestAnimationFrame(tick);}}
  else{cancelAnimationFrame(frame);frame=0;lastTime=0;}
 }
 function pause(){paused=true;sync();}
 toggle.addEventListener('click',()=>{paused=!paused;if(!paused)focused=false;sync();});
 for(const [selector,direction] of [['.project-prev',-1],['.project-next',1]]){
  controls.querySelector(selector).addEventListener('click',()=>{
   pause();
   // Keep previous usable at the start of the looping list.
   if(direction<0&&projectViewport.scrollLeft<1&&!motionPreference.matches)projectViewport.scrollLeft=period();
   projectViewport.scrollBy({left:direction*Math.min(projectViewport.clientWidth*.8,420),behavior:motionPreference.matches?'instant':'smooth'});
  });
 }
 projectViewport.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;sync();}});
 projectViewport.addEventListener('pointerleave',()=>{hovered=false;sync();});
 projectViewport.addEventListener('pointerdown',pause,{passive:true});
 showcase.addEventListener('focusin',()=>{focused=true;sync();});
 showcase.addEventListener('focusout',event=>{focused=showcase.contains(event.relatedTarget);sync();});
 projectViewport.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>0)pause();},{passive:true});
 projectViewport.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(event.key))pause();});
 document.addEventListener('visibilitychange',sync);
 motionPreference.addEventListener('change',()=>{if(motionPreference.matches)projectViewport.scrollLeft=Math.min(projectViewport.scrollLeft,Math.max(0,original.offsetWidth-projectViewport.clientWidth));sync();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(projectViewport);
 sync();
}

// One persistent header; preserve the compact menu and its focus/scroll handling.
(()=>{
 const root=document.documentElement;
 const header=document.querySelector('.header');
 const dialog=document.querySelector('#site-menu');
 const panel=dialog?.querySelector('.menu-panel');
 const openers=[...document.querySelectorAll('[data-menu-open]')];
 if(!header||!dialog||!panel||typeof dialog.showModal!=='function')return;
 let opener=null,scrollLock=null,navTarget=null,backdropPressed=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const saveStyles=(element,names)=>names.map(name=>[name,element.style.getPropertyValue(name),element.style.getPropertyPriority(name)]);
 const restoreStyles=(element,saved)=>saved.forEach(([name,value,priority])=>{if(value)element.style.setProperty(name,value,priority);else element.style.removeProperty(name);});
 function lockScroll(){
  const body=document.body;
  const scrollbar=innerWidth-root.clientWidth;
  scrollLock={x:scrollX,y:scrollY,body:saveStyles(body,['position','top','left','width','overflow','padding-right']),root:saveStyles(root,['overflow','scroll-behavior','--menu-scrollbar','--menu-header-width'])};
  root.style.setProperty('--menu-scrollbar',`${scrollbar}px`);
  root.style.setProperty('--menu-header-width',`${header.getBoundingClientRect().width}px`);
  if(scrollbar>0)body.style.setProperty('padding-right',`${parseFloat(getComputedStyle(body).paddingRight)+scrollbar}px`,'important');
  body.style.setProperty('position','fixed','important');
  body.style.setProperty('top',`${-scrollLock.y}px`,'important');
  body.style.setProperty('left',`${-scrollLock.x}px`,'important');
  body.style.setProperty('width','100%','important');
  body.style.setProperty('overflow','hidden','important');
  root.style.setProperty('overflow','hidden','important');
  root.style.setProperty('scroll-behavior','auto','important');
 }
 function unlockScroll(){
  if(!scrollLock)return;
  const saved=scrollLock;
  restoreStyles(document.body,saved.body);
  // Override any stylesheet smooth scrolling until the fixed-body position is restored.
  restoreStyles(root,saved.root.filter(([name])=>name!=='scroll-behavior'));
  window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
  restoreStyles(root,saved.root.filter(([name])=>name==='scroll-behavior'));
  scrollLock=null;
 }
 function focusTarget(target){
  const temporary=!target.hasAttribute('tabindex');
  if(temporary)target.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});
  if(temporary){
   const remove=()=>{if(target.getAttribute('tabindex')==='-1')target.removeAttribute('tabindex');};
   if(document.activeElement===target)target.addEventListener('blur',remove,{once:true});else remove();
  }
 }
 function openMenu(button){
  if(dialog.open||scrollLock)return;
  opener=button;
  navTarget=null;
  lockScroll();
  root.classList.add('menu-open');
  try{dialog.showModal();}
  catch(error){root.classList.remove('menu-open');unlockScroll();return;}
  openers.forEach(item=>item.setAttribute('aria-expanded','true'));
  (dialog.querySelector('[data-menu-close]')||dialog.querySelector('a[href]'))?.focus({preventScroll:true});
 }
 function closeMenu(){if(dialog.open)dialog.close();}
 openers.forEach(button=>button.addEventListener('click',()=>openMenu(button)));
 dialog.querySelectorAll('[data-menu-close]').forEach(button=>button.addEventListener('click',closeMenu));
 // Wrap the keyboard boundaries explicitly; native dialogs can otherwise hand focus to browser chrome.
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!dialog.open||event.defaultPrevented)return;
  const focusable=[...dialog.querySelectorAll('a[href],button')].filter(element=>{
   const style=getComputedStyle(element);
   return element.tabIndex>=0&&!element.matches(':disabled')&&!element.closest('[inert]')&&element.getClientRects().length>0&&style.visibility!=='hidden'&&style.visibility!=='collapse';
  });
  const first=focusable[0],last=focusable[focusable.length-1];
  if(!first){event.preventDefault();dialog.focus({preventScroll:true});return;}
  const current=document.activeElement;
  if(!focusable.includes(current)||(event.shiftKey?current===first:current===last)){
   event.preventDefault();
   (event.shiftKey?last:first).focus({preventScroll:true});
  }
 });
 // Preserve the native Escape/cancel behavior and centralize every exit in the close event.
 dialog.addEventListener('close',()=>{
  const destination=navTarget;
  navTarget=null;
  backdropPressed=false;
  root.classList.remove('menu-open');
  openers.forEach(button=>button.setAttribute('aria-expanded','false'));
  unlockScroll();
  if(destination){
   if(location.hash!==destination.hash)history.pushState(null,'',destination.hash);
   focusTarget(destination.element);
   destination.element.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
  }else{
   if(opener?.isConnected)opener.focus({preventScroll:true});
  }
  opener=null;
 });
 dialog.addEventListener('pointerdown',event=>{backdropPressed=!panel.contains(event.target);});
 dialog.addEventListener('pointercancel',()=>{backdropPressed=false;});
 dialog.addEventListener('click',event=>{
  if(backdropPressed&&!panel.contains(event.target))closeMenu();
  backdropPressed=false;
 });
 dialog.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const hash=link.getAttribute('href');
  if(!hash||hash==='#')return;
  let id;
  try{id=decodeURIComponent(hash.slice(1));}catch{return;}
  const element=document.getElementById(id);
  if(!element)return;
  event.preventDefault();
  navTarget={hash,element};
  closeMenu();
 }));
})();
