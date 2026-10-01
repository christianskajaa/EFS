const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const story=document.querySelector('.story-layout');
const stage=document.querySelector('.drawing-stage');
const chapters=[...document.querySelectorAll('.story-chapter')];
const titles=['Et godt grunnlag.','Arealene finner sin plass.','En helhet som henger sammen.'];
const labels=['Tegningsgrunnlag','Arealer og tilhørighet','Rettigheter og fellesskap'];
const color=document.querySelector('.drawing-color');
const boundary=document.querySelector('.boundary');
const common=document.querySelector('.common-path');
const progressbar=document.querySelector('.drawing-progress i');
const hero=document.querySelector('.hero-image img');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
let queued=false,active=-1;
function update(){
 const mobile=innerWidth<=760;
 const stageHeight=mobile?stage.offsetHeight:0;
 const line=mobile?stageHeight+(innerHeight-stageHeight)*.45:innerHeight*.5;
 let nearest=0,dist=Infinity;
 chapters.forEach((chapter,i)=>{const r=chapter.getBoundingClientRect();const d=Math.abs(r.top+r.height/2-line);if(d<dist){dist=d;nearest=i;}});
 if(nearest!==active){active=nearest;chapters.forEach((c,i)=>c.classList.toggle('active',i===active));document.querySelector('#drawing-title').textContent=titles[active];document.querySelector('#drawing-counter').textContent=`0${active+1} / 03`;document.querySelector('#drawing-label').textContent=labels[active];}
 const first=chapters[0].getBoundingClientRect();const last=chapters[2].getBoundingClientRect();
 const p=clamp((line-(first.top+first.height*.3))/((last.top+last.height*.7)-(first.top+first.height*.3)));
 if(!motionPreference.matches){
 color.style.clipPath=`inset(0 ${100-clamp((p-.2)/.45)*100}% 0 0)`;
 boundary.style.strokeDashoffset=String(1000*(1-clamp(p/.3)));
 common.style.strokeDashoffset=String(500*(1-clamp((p-.63)/.3)));
 progressbar.style.width=`${p*100}%`;
 const hp=clamp(-document.querySelector('.hero').getBoundingClientRect().top/innerHeight);
 hero.style.transform=`scale(${1.04+hp*.04}) translateY(${hp*10}px)`;
 }
 queued=false;
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);motionPreference.addEventListener('change',schedule);update();
if(!motionPreference.matches){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.section-heading,.services-intro,.service-group,.process-grid,.experience,.logo-row').forEach(el=>{el.classList.add('reveal');io.observe(el)});}
document.querySelector('.copy').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('kontakt@efs.no');status.textContent='E-postadressen er kopiert.'}catch{status.textContent='E-postadresse: kontakt@efs.no'}});
