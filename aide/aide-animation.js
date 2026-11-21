import {createBuildingImages,buildingCatalog} from './carte-images.js';
import {createPuppetRenderer,puppetReady,DEFAULT_LOOKS} from './personnages-rig.js';
import {createCartImages,cartReady} from './charrette-images.js';

const $=id=>document.getElementById(id), canvas=$('demo-canvas'), pen=canvas.getContext('2d');
const scenes=[
  {title:'Rejoindre',text:'Partage ton identité Twitch et choisis une guilde disponible pendant une session ouverte. Ton personnage reçoit son logement et rejoint le village.',tab:'Bienvenue',place:'Choix de guilde',action:'Rejoindre les Forestiers',condition:'Session ouverte · une guilde disponible',help:'debuter',art:'townHall'},
  {title:'Travailler',text:'Utilise Aller pour rejoindre ta guilde, puis Interagir pour démarrer. Chez les Forestiers, la tournée prend sa charrette et revient automatiquement au dépôt avec le bois.',tab:'Interagir',place:'Forestiers',action:'Récolter du bois',condition:'Énergie · poste et charrette libres · place au dépôt',help:'forestiers',art:'depot'},
  {title:'Échanger et livrer',text:'Le marché valide les offres de matériaux. Après la vente, un membre de la guilde livre les lots prêts depuis son dépôt. Le client récupère ses achats chez lui.',tab:'Interagir',place:'Marché des matériaux',action:'Acheter une offre / Répondre',condition:'Pièces ou ressources · ordre ouvert · droits du compte',help:'marche',art:'market'},
  {title:'Construire ensemble',text:'Les matériaux livrés ouvrent les modules du chantier communal. Le village avance avec les constructions : la boutique d’art arrive au niveau 2, la carrière au niveau 3.',tab:'Interagir',place:'Chantier communal',action:'Construire un module',condition:'Bon chantier · matériaux livrés · énergie et budget',help:'chantier',art:'artShop'},
  {title:'Rentrer et créer',text:'À domicile, tu récupères normalement ton énergie, ou deux fois plus vite dans un lit installé. Un art débloqué démarre avec sa matière. Ta collection est dans Arts ; ton apparence dans Personnalisation.',tab:'Interagir',place:'Chez toi',action:'Créer dans un art disponible',condition:'Chez toi · session ouverte · matière dans le sac ou le coffre',help:'appartement',art:'workshop'},
];
const duration=100,chapterLength=duration/scenes.length,reduced=matchMedia('(prefers-reduced-motion: reduce)');
let position=0,playing=false,lastFrame=null,frame=0,active=-1;
const buildings=createBuildingImages(pen,draw), puppet=createPuppetRenderer(pen), cart=createCartImages(pen,draw);
const room=new Image();room.decoding='async';
room.onload=draw;room.src=new URL('assets/buildings/appartement-interieur-v1.png',import.meta.url).href;
function seconds(value){return `${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;}
function index(){return Math.min(scenes.length-1,Math.floor(position/chapterLength));}
function refresh(){
  const i=index(),scene=scenes[i];
  $('position').value=String(position);$('position').setAttribute('aria-valuetext',`${seconds(position)}, ${scene.title}`);
  $('time').textContent=`${seconds(position)} / ${seconds(duration)}`;
  $('play').textContent=playing?'Pause':position>=duration?'Revoir':'Lire';
  $('previous').disabled=i===0;$('next').disabled=i===scenes.length-1;
  if(active!==i){
    active=i;$('step-title').textContent=scene.title;$('step-text').textContent=scene.text;
    $('sample-tab').textContent=scene.tab;$('sample-place').textContent=scene.place;
    $('sample-action').textContent=scene.action;$('sample-condition').textContent=scene.condition;
    $('step-help').href=`aide-${scene.help}.html`;
    [...$('chapters').children].forEach((button,n)=>button.setAttribute('aria-current',String(n===i)));
  }
  draw();
}
function draw(){
  const i=index(),scene=scenes[i],t=position%chapterLength;
  pen.setTransform(1.5,0,0,1.5,0,0);pen.clearRect(0,0,800,360);
  const sky=pen.createLinearGradient(0,0,0,360);sky.addColorStop(0,'#c7d7c5');sky.addColorStop(1,'#e8e2bb');
  pen.fillStyle=sky;pen.fillRect(0,0,800,360);pen.fillStyle='#91a477';pen.fillRect(0,278,800,82);
  pen.fillStyle='#c5af85';pen.fillRect(0,310,800,37);
  pen.save();pen.translate(400,300);pen.scale(1.55,1.55);
  const place={id:scene.art==='artShop'?'galerie':'demo',art:scene.art,name:scene.art==='artShop'?'Boutique d’art':undefined,x:0};
  if(scene.art==='market')place.marketStock={bois:25,planches:10};
  if(i===4 && room.complete && room.naturalWidth){
    const top=Math.round(room.naturalHeight*.18);
    pen.drawImage(room,0,top,room.naturalWidth,room.naturalHeight-top,-185,-150,370,150);
  }else buildings.draw(place,0);
  pen.restore();
  const move=!reduced.matches && [0,1,2].includes(i),walk=move?Math.sin(t*.23)*115:0;
  const x=400+walk,direction=move && Math.cos(t*.23)<0?-1:1;
  const mode=move?(i===1||i===2?'cart':'walk'):i===3?'saw':i===4?'paint':'idle';
  const look={...DEFAULT_LOOKS.garcon,outfit:[1,3].includes(i)?'tablier':'chemise'};
  const actorTime=reduced.matches?0:position;
  if(mode==='cart'){pen.save();pen.translate(x,322);pen.scale(direction*1.55,1.55);cart(i===1 && t<10?'empty':'bois',actorTime,move);pen.restore();}
  if(puppet.ready){
    const actor=puppet.draw(look,mode,actorTime,{x,y:322,scale:1.55,direction});
    if(i===3){
      pen.fillStyle='#8c613f';pen.fillRect(x+12,291,53,6);pen.fillRect(x+17,297,5,25);pen.fillRect(x+55,297,5,25);
      pen.fillStyle='#d1a06a';pen.fillRect(x+10,282,58,8);
      pen.strokeStyle='#67716a';pen.lineWidth=3;pen.beginPath();pen.moveTo(...actor.hand);pen.lineTo(actor.hand[0]+32,actor.hand[1]+3);pen.stroke();
    }
    if(i===4){
      pen.strokeStyle='#88603e';pen.lineWidth=4;pen.beginPath();pen.moveTo(x+21,321);pen.lineTo(x+42,248);pen.lineTo(x+62,321);pen.moveTo(x+25,284);pen.lineTo(x+60,284);pen.stroke();
      pen.fillStyle='#ede2bb';pen.fillRect(x+23,256,38,37);pen.fillStyle='#829b6e';pen.beginPath();pen.moveTo(x+23,291);pen.lineTo(x+41,270);pen.lineTo(x+61,291);pen.fill();
      pen.strokeStyle='#6a4e35';pen.lineWidth=2;pen.beginPath();pen.moveTo(...actor.hand);pen.lineTo(x+34,273);pen.stroke();
    }
    puppet.draw({...DEFAULT_LOOKS.fille,outfit:'chemise'},'idle',actorTime,{x:510,y:318,scale:1.45,direction:-1,phase:1.8});
  }
  pen.fillStyle='#253d30';pen.font='600 13px system-ui';pen.textAlign='center';pen.fillText(i===4?'Atelier à domicile':scene.place,400,30);
}
function stop(){playing=false;lastFrame=null;cancelAnimationFrame(frame);frame=0;refresh();}
function tick(now){
  if(!playing || document.hidden)return;
  if(lastFrame!==null)position=Math.min(duration,position+Math.min((now-lastFrame)/1000,.25));
  lastFrame=now;refresh();
  if(position>=duration){stop();return;}
  frame=requestAnimationFrame(tick);
}
function seek(value){position=Math.max(0,Math.min(duration,value));lastFrame=null;refresh();}
$('play').addEventListener('click',()=>{if(playing){stop();return;}if(position>=duration)position=0;playing=true;lastFrame=null;refresh();frame=requestAnimationFrame(tick);});
$('previous').addEventListener('click',()=>seek((index()-1)*chapterLength));
$('next').addEventListener('click',()=>seek((index()+1)*chapterLength));
$('position').addEventListener('input',event=>seek(Number(event.target.value)));
scenes.forEach((scene,i)=>{const button=document.createElement('button');button.type='button';button.textContent=`${i+1}. ${scene.title}`;button.addEventListener('click',()=>seek(i*chapterLength));$('chapters').append(button);});
// Keep the text alternative complete even when images or scripts cannot load.
$('transcript').replaceChildren(...scenes.map(scene=>{const li=document.createElement('li'),title=document.createElement('strong');title.textContent=`${scene.title}. `;li.append(title,scene.text);return li;}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
reduced.addEventListener('change',stop);
Promise.all([puppetReady,buildingCatalog,cartReady]).then(()=>{$('demo-status').textContent='Choisis une étape ou lance la lecture. Les explications restent lisibles en pause.';draw();}).catch(()=>{$('demo-status').textContent='Certains visuels ne sont pas disponibles. Les étapes et leur transcription restent accessibles.';});
refresh();
