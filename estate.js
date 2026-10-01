const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const story=document.querySelector('.story-layout');
const stage=document.querySelector('.drawing-stage');
const chapters=[...document.querySelectorAll('.story-chapter')];
const drawingSteps=[
 {at:0,label:'Tegningsgrunnlag',title:'Et godt grunnlag.'},
 {at:.08,label:'Arealfordeling',title:'Arealene får sin egen farge.'},
 {at:.46,label:'Seksjon 1 og 2',title:'De første seksjonene blir tydelige.'},
 {at:.65,label:'Seksjon 3 og 4',title:'Fire seksjoner. Tydelig tilhørighet.'},
 {at:.83,label:'Fellesareal',title:'Gangen binder seksjonene sammen.'}
];
const color=document.querySelector('.drawing-color');
const planLabels=[...document.querySelectorAll('.plan-label')];
const progressbar=document.querySelector('.drawing-progress i');
const hero=document.querySelector('.hero-image img');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>x*x*(3-2*x);
stage.classList.add('has-scroll-labels');
let queued=false,active=-1,activeStep=-1;
function update(){
 const mobile=innerWidth<=760;
 const stageHeight=mobile?stage.offsetHeight:0;
 const line=mobile?stageHeight+(innerHeight-stageHeight)*.45:innerHeight*.5;
 let nearest=0,dist=Infinity;
 chapters.forEach((chapter,i)=>{const r=chapter.getBoundingClientRect();const d=Math.abs(r.top+r.height/2-line);if(d<dist){dist=d;nearest=i;}});
 if(nearest!==active){active=nearest;chapters.forEach((c,i)=>c.classList.toggle('active',i===active));}
 const first=chapters[0].getBoundingClientRect();const last=chapters[chapters.length-1].getBoundingClientRect();
 const reduced=motionPreference.matches;
 const p=reduced?1:clamp((line-(first.top+first.height*.3))/((last.top+last.height*.7)-(first.top+first.height*.3)));
 const step=drawingSteps.findLastIndex(item=>p>=item.at);
 if(step!==activeStep){activeStep=step;document.querySelector('#drawing-title').textContent=drawingSteps[step].title;document.querySelector('#drawing-counter').textContent=`0${step+1} / 05`;document.querySelector('#drawing-label').textContent=drawingSteps[step].label;}
 // Complete the colour reveal before adding either pair of section labels.
 color.style.clipPath=`inset(0 ${100-clamp((p-.08)/.32)*100}% 0 0)`;
 for(const label of planLabels){const reveal=ease(clamp((p-Number(label.dataset.revealAt))/.08));label.style.setProperty('--label-reveal',String(reveal));label.style.setProperty('--label-rise',`${(1-reveal)*6}px`);}
 stage.style.setProperty('--common-reveal',String(ease(clamp((p-.83)/.08))));
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
 duplicate.inert=true;
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
 toggle.addEventListener('click',()=>{paused=!paused;sync();});
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
