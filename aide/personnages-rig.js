// Shared articulated prototype: image parts and outfits follow the same joints.
const TAU=Math.PI*2, assets=new Map(), tinted=new Map();
const TEXTURE_BUDGET=32*1024*1024;
let textureBytes=0;
let manifest,placements;
const BEARD_DEFAULTS={moustache:{x:3.4,y:9.1,width:4.5,height:2},bouc:{x:3.6,y:9.1,width:4.2,height:4.9},courte:{x:-2.1,y:7.3,width:10,height:8.4},fournie:{x:-2.8,y:7.3,width:10.8,height:10}};
const MAKEUP_DEFAULTS={joues:{x:1.2,y:7.9,width:3.6,height:2},levres:{x:4.775,y:10.375,width:2.25,height:.85},yeux:{x:3,y:5.4,width:2.2,height:1}};
export function setHairPlacements(data) {
  if(!data||![1,2].includes(data.version)||!data.hair)return;
  for(const entry of Object.values(data.hair))if(!['x','y','width','height'].every(key=>Number.isFinite(entry[key])))return;
  placements=structuredClone(data);
}
export function getHairPlacements(){return structuredClone(placements);}
const loadImage=file=>new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';image.onload=()=>resolve(image);image.onerror=()=>reject(Error(`Image de personnage indisponible : ${file}`));
  image.src=new URL(file,import.meta.url).href;
});
export const puppetReady=fetch(new URL('personnages-rig-v5.json',import.meta.url))
  .then(response=>{if(!response.ok)throw Error('Description des personnages indisponible.');return response.json();})
  .then(async data=>{
    if(data.version!==1)throw Error('Version de personnages inconnue.');
    manifest=data;
    const layoutResponse=await fetch(new URL('personnages-placement-v2.json',import.meta.url));
    if(!layoutResponse.ok)throw Error('Placements de coiffures indisponibles.');
    const initialPlacements=await layoutResponse.json();
    if(!placements)setHairPlacements(initialPlacements);
    if(!placements)throw Error('Placements de coiffures invalides.');
    await Promise.all(Object.entries(data.silhouettes).map(async ([id,entry])=>assets.set(id,await loadImage(entry.file))));
    await Promise.all(Object.entries(data.sharedParts||{}).map(async ([part,entry])=>assets.set(`shared:${part}`,await loadImage(entry.file))));
    await Promise.all(Object.entries(data.cosmetics||{}).map(async ([kind,entry])=>assets.set(`cosmetic:${kind}`,await loadImage(entry.file))));
    return true;
  });

export function solveJoint(start,target,upper,lower,bend=1) {
  const dx=target[0]-start[0],dy=target[1]-start[1],raw=Math.hypot(dx,dy);
  const d=Math.min(upper+lower-.001,Math.max(Math.abs(upper-lower)+.001,raw));
  const base=Math.atan2(dy,dx),offset=Math.acos(Math.max(-1,Math.min(1,(upper*upper+d*d-lower*lower)/(2*upper*d))));
  return {joint:[start[0]+upper*Math.cos(base-bend*offset),start[1]+upper*Math.sin(base-bend*offset)],
    end:[start[0]+d*Math.cos(base),start[1]+d*Math.sin(base)]};
}

function texture(variant,part,color,resolution) {
  if(!manifest||!assets.has(variant))return null;
  const key=`${variant}:${part}:${color||'source'}:${resolution}`;
  if(tinted.has(key)) {
    const cached=tinted.get(key);tinted.delete(key);tinted.set(key,cached);
    return cached;
  }
  const shared=manifest.sharedParts?.[part];
  const [kind,id]=part.split(':');
  const cosmetic=part.includes(':')?manifest.cosmetics?.[kind]:part==='head'?manifest.cosmetics?.[variant==='garcon'?'head':'femaleHead']:null;
  const source=cosmetic?cosmetic.parts[id||variant]:shared?.rect||manifest.silhouettes[variant].parts[part];
  if(!source)return null;
  // Prepare only the pixels useful at this zoom; retain the HD source for zooming in.
  const ratio=Math.min(1,resolution/Math.max(source[2],source[3]));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.ceil(source[2]*ratio));canvas.height=Math.max(1,Math.ceil(source[3]*ratio));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(assets.get(cosmetic?`cosmetic:${part==='head'?(variant==='garcon'?'head':'femaleHead'):kind}`:shared?`shared:${part}`:variant),...source,0,0,canvas.width,canvas.height);
  if(color&&/^#[0-9a-f]{6}$/i.test(color)) {
    const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    const histogram=new Uint32Array(256);let count=0;
    for(let i=0;i<pixels.data.length;i+=4) {
      if(pixels.data[i+3]<128)continue;
      const lum=Math.round(.299*pixels.data[i]+.587*pixels.data[i+1]+.114*pixels.data[i+2]);
      if(lum>45){histogram[lum]++;count++;}
    }
    let reference=1,sum=0;
    for(;reference<255;reference++){sum+=histogram[reference];if(sum>=count*.65)break;}
    for(let i=0;i<pixels.data.length;i+=4) {
      if(!pixels.data[i+3])continue;
      const [r,g,b]=pixels.data.slice(i,i+3),lum=.299*r+.587*g+.114*b;
      // Preserve eyes, outlines, buttons and belt hardware instead of tinting them as cloth.
      const keep=(part==='head'&&(lum<75||Math.max(r,g,b)-Math.min(r,g,b)<14&&lum>180))
        || part==='pelvis'&&i/(canvas.width*4)<canvas.height*.29;
      if(keep)continue;
      const shade=Math.max(.12,Math.min(1.5,lum/reference));
      const highlight=Math.max(0,shade-1)*42;
      for(let c=0;c<3;c++)pixels.data[i+c]=Math.min(255,rgb[c]*shade+highlight);
    }
    ctx.putImageData(pixels,0,0);
  }
  return cacheTexture(key,canvas);
}

function cacheTexture(key,canvas) {
  const bytes=canvas.width*canvas.height*4;
  while(textureBytes+bytes>TEXTURE_BUDGET&&tinted.size) {
    const oldest=tinted.keys().next().value,entry=tinted.get(oldest);
    textureBytes-=entry.width*entry.height*4;tinted.delete(oldest);
  }
  textureBytes+=bytes;
  tinted.set(key,canvas);return canvas;
}

// Close-fitting hair has no baked ear hole. Fit its nape to the original head's
// alpha and draw the original ear/face in front, independently of hair placement.
function freeHairPath(style,p) {
  const points=style==='tresses'?[[0,0],[.42,0],[.42,.4],[.35,.65],[.35,1],[0,1]]
    :style==='undercut'?[[0,0],[1,0],[1,.42],[.35,.42],[.30,.75],[0,.75]]:null;
  if(!points)return null;
  // These regions belong to the sprite, so they follow both translation and
  // independent width/height changes. They must never inherit the skull mask.
  const path=new Path2D();points.forEach(([x,y],i)=>path[i?'lineTo':'moveTo'](p.x+x*p.width,p.y+y*p.height));path.closePath();return path;
}

function fittedHair(look,style,placement,resolution) {
  const key=`fitted:${look.silhouette}:${style}:${look.hair}:${JSON.stringify(placement)}:${resolution}`;
  const bounds={x:Math.min(-6,placement.x),y:Math.min(0,placement.y),right:Math.max(7.8,placement.x+placement.width),bottom:Math.max(16.6,placement.y+placement.height)};
  if(tinted.has(key)){const result=tinted.get(key);tinted.delete(key);tinted.set(key,result);return {image:result,bounds};}
  const width=bounds.right-bounds.x,height=bounds.bottom-bounds.y,factor=resolution/Math.max(width,height);
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*factor);canvas.height=Math.ceil(height*factor);
  const ctx=canvas.getContext('2d'),mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;
  ctx.scale(factor,factor);ctx.translate(-bounds.x,-bounds.y);
  ctx.drawImage(texture(look.silhouette,`hair:${style}`,look.hair,resolution),placement.x,placement.y,placement.width,placement.height);
  // Preserve the user's original fringe and temple. Only the posterior cap is
  // replaced, with a feathered join above/behind the independently anchored ear.
  const patch=document.createElement('canvas');patch.width=canvas.width;patch.height=canvas.height;
  const blend=patch.getContext('2d');blend.scale(factor,factor);blend.translate(-bounds.x,-bounds.y);
  const vertical=blend.createLinearGradient(0,4.8,0,6.2);vertical.addColorStop(0,'transparent');vertical.addColorStop(1,'white');
  blend.fillStyle=vertical;blend.fillRect(bounds.x,bounds.y,width,height);
  blend.globalCompositeOperation='destination-in';const horizontal=blend.createLinearGradient(0,0,1.1,0);horizontal.addColorStop(0,'white');horizontal.addColorStop(1,'transparent');blend.fillStyle=horizontal;blend.fillRect(bounds.x,bounds.y,width,height);
  const free=freeHairPath(style,placement);
  if(free){blend.globalCompositeOperation='destination-out';blend.fillStyle='#fff';blend.fill(free);}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='destination-out';ctx.drawImage(patch,0,0);ctx.restore();
  blend.globalCompositeOperation='source-in';blend.drawImage(texture(look.silhouette,`fittedHair:${style}`,look.hair,resolution),placement.x,placement.y,placement.width,placement.height);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='lighter';ctx.drawImage(patch,0,0);ctx.restore();
  const clip=mask.getContext('2d');clip.scale(factor,factor);clip.translate(-bounds.x,-bounds.y);
  clip.drawImage(texture(look.silhouette,'head',null,resolution),-6,0,13.8,16.6);
  clip.fillStyle='#fff';clip.fillRect(bounds.x,bounds.y,width,Math.max(0,4.8-bounds.y));
  const crown=clip.createLinearGradient(0,4.8,0,6.5);crown.addColorStop(0,'white');crown.addColorStop(1,'transparent');clip.fillStyle=crown;clip.fillRect(bounds.x,4.8,width,1.7);
  if(free){clip.fillStyle='#fff';clip.fill(free);}
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);
  return {image:cacheTexture(key,canvas),bounds};
}

export const DEFAULT_LOOKS={
  garcon:{silhouette:'garcon',skin:'#dfa16e',hair:'#724327',shirt:'#60784d',pants:'#535b59',outfit:'chemise'},
  fille:{silhouette:'fille',skin:'#d79968',hair:'#653c29',shirt:'#5a7190',pants:'#70604c',outfit:'tablier'},
};

export function puppetPose(mode,time,phase=0) {
  const step=TAU*time*1.05+phase,work=TAU*time*.65+phase;
  const walking=mode==='walk'||mode==='cart';
  const resting=mode==='rest';
  const bob=walking?Math.abs(Math.sin(step))*.6:Math.sin(time*TAU*.28+phase)*.18;
  const hip=[0,resting?-12:-18];
  const feet=[0,Math.PI].map((offset,i)=>{
    if(resting)return [10-i*2,-2];
    const p=step+offset;
    return walking?[Math.sin(p)*6.3,-2-Math.max(0,Math.cos(p))*3.4]:[i?2:-2,-2];
  });
  let target=[3,-18];
  if(walking)target=mode==='cart'?[-7.5,-19.8]:[3+Math.sin(step+Math.PI)*4.8,-20];
  if(mode==='saw')target=[15+Math.sin(work)*3,-25];
  if(mode==='axe')target=[9+Math.sin(work)*5,-34-Math.cos(work)*9];
  if(mode==='paint')target=[13+Math.cos(work)*2,-29+Math.sin(work)*4];
  if(resting)target=[10,-13.7];
  const breathe=mode==='idle'?Math.sin(time*TAU*.28+phase):0;
  return {walking,resting,bob,hip,feet,target,step,work,breathe};
}

export function createPuppetRenderer(pen) {
  function part(look,name,x,y,width,height,color,alpha=1) {
    const transform=pen.getTransform();
    const pixels=Math.max(Math.abs(width)*Math.hypot(transform.a,transform.b),Math.abs(height)*Math.hypot(transform.c,transform.d));
    // Stable size buckets avoid rebuilding a texture during breathing or gait.
    const resolution=Math.min(512,Math.max(32,2**Math.ceil(Math.log2(Math.max(1,pixels)))));
    const image=texture(look.silhouette,name,color,resolution);
    if(!image)return;
    pen.save();pen.globalAlpha*=alpha;pen.drawImage(image,x,y,width,height);pen.restore();
  }
  function limb(look,name,start,end,width,color,alpha=1,overlap=.8,endOverlap=overlap) {
    const length=Math.hypot(end[0]-start[0],end[1]-start[1]);
    pen.save();pen.translate(...start);pen.rotate(Math.atan2(end[1]-start[1],end[0]-start[0])-Math.PI/2);
    part(look,name,-width/2,-overlap,width,length+overlap+endOverlap,color,alpha);pen.restore();
  }
  function leg(look,hip,foot,far,debug) {
    const solution=solveJoint(hip,foot,8.05,8.05,1);
    const alpha=far?.78:1;
    // The domed thigh top rotates about the hip inside the rounded pelvis cap.
    limb(look,'thigh',hip,solution.joint,5.7,look.pants,alpha,2.6);
    limb(look,'shin',solution.joint,solution.end,5.1,look.pants,alpha,1.2);
    part(look,'boot',solution.end[0]-2.7,solution.end[1]-3.5,9,5.5,null,alpha);
    debug.push(hip,solution.joint,solution.end);
    return solution;
  }
  function arm(look,shoulder,target,far,debug) {
    const solution=solveJoint(shoulder,target,8.8,8.4,-1);
    const alpha=far?.78:1;
    limb(look,'sleeve',shoulder,solution.joint,6.0,look.shirt,alpha,1.0);
    // The rounded elbow cap is in front of the sleeve, centered on its pivot.
    limb(look,'forearm',solution.joint,solution.end,3.5,look.skin,alpha,1.75,.6);
    pen.save();pen.translate(...solution.end);
    const angle=Math.atan2(solution.end[1]-solution.joint[1],solution.end[0]-solution.joint[0])-Math.PI/2;
    pen.rotate(angle);part(look,'hand',-1.9,-.9,3.8,5.2,look.skin,alpha);pen.restore();
    debug.push(shoulder,solution.joint,solution.end);
    const vector=[solution.end[0]-solution.joint[0],solution.end[1]-solution.joint[1]];
    const length=Math.hypot(...vector);
    return [solution.end[0]+vector[0]/length*1.8,solution.end[1]+vector[1]/length*1.8];
  }
  return {
    draw(look,mode,time,{x=0,y=0,scale=1,direction=1,phase=0,joints=false,handTarget=null,hairPlacement=null,hairOpacity=1,facePlacements=null,selectedFacePart=null,faceOpacity=1}={}) {
      if(!assets.has(look.silhouette))return null;
      const pose=puppetPose(mode,time,phase),debug=[];
      if(handTarget)pose.target=handTarget;
      const slim=look.silhouette==='fille'?.94:1;
      pen.save();pen.translate(x,y);pen.scale(scale*direction,scale);pen.translate(0,pose.bob);
      // In a side view both hips project to the same axis; depth is layer order.
      const farHip=[pose.hip[0]-.25,pose.hip[1]],nearHip=[pose.hip[0]+.25,pose.hip[1]];
      const shoulder=[-1.0,pose.hip[1]-14.0-pose.breathe*.12];
      const farTarget=mode==='cart'?[-6,-20.4]:pose.walking?[3+Math.sin(pose.step)*4.5,-20]:[2,-20];
      if(pose.resting){pen.fillStyle='#79573f';pen.fillRect(-7,-11,15,2.5);pen.fillRect(-7,-9,2,9);pen.fillRect(6,-9,2,9);}
      leg(look,farHip,pose.feet[1],true,debug);
      arm(look,[shoulder[0]-1.7,shoulder[1]+.2],farTarget,true,debug);
      leg(look,nearHip,pose.feet[0],false,debug);
      part(look,'pelvis',-5.2*slim,pose.hip[1]-5.0,10.4*slim,9.0,look.pants);
      // Head and hair move together; the shirt collar covers the lowered neck.
      const headDrop=1.7;
      part(look,'head',-6.0,pose.hip[1]-33.8+headDrop,13.8,16.6,look.skin);
      const headTop=pose.hip[1]-33.8+headDrop;
      const hairstyle=look.hairstyle||(look.silhouette==='fille'?'chignon':'ondules');
      const fitted=hairPlacement||placements?.hair[hairstyle];
      const fittedStyle=Boolean(manifest.cosmetics?.fittedHair?.parts[hairstyle]);
      if(fitted&&fittedStyle) {
        const transform=pen.getTransform(),resolution=Math.min(512,Math.max(32,2**Math.ceil(Math.log2(Math.max(fitted.width,fitted.height,16.6)*Math.hypot(transform.a,transform.b)))));
        const {image,bounds}=fittedHair(look,hairstyle,fitted,resolution);
        pen.save();pen.globalAlpha*=Math.max(0,Math.min(1,hairOpacity));pen.drawImage(image,bounds.x,headTop+bounds.y,bounds.right-bounds.x,bounds.bottom-bounds.y);pen.restore();
        // Coordinates belong to the head, never to the movable hairstyle.
        pen.save();pen.translate(-6,headTop);pen.scale(13.8,16.6);pen.beginPath();
        pen.moveTo(1,.46);pen.lineTo(.49,.46);pen.lineTo(.43,.40);
        pen.bezierCurveTo(.36,.35,.27,.38,.255,.46);
        pen.bezierCurveTo(.23,.56,.29,.65,.39,.65);
        pen.bezierCurveTo(.43,.65,.45,.63,.47,.61);
        pen.lineTo(.47,1);pen.lineTo(1,1);pen.closePath();pen.clip();
        part(look,'head',0,0,1,1,look.skin);pen.restore();
      } else if(fitted&&hairstyle!=='chauve') {
        const hairLook=hairstyle==='chignon'?{...look,silhouette:'fille'}:hairstyle==='ondules'?{...look,silhouette:'garcon'}:look;
        const name=['chignon','ondules'].includes(hairstyle)?'hair':`hair:${hairstyle}`;
        part(hairLook,name,fitted.x,headTop+fitted.y,fitted.width,fitted.height,look.hair,Math.max(0,Math.min(1,hairOpacity)));
      }
      const face=facePlacements||{beard:placements?.beard?.[look.silhouette],makeup:placements?.makeup?.[look.silhouette]};
      const alphaFor=part=>selectedFacePart===part?Math.max(0,Math.min(1,faceOpacity)):1;
      const makeupPart=(name,alpha,draw)=>{
        const base=MAKEUP_DEFAULTS[name],p=face.makeup?.[look.makeup]?.[name]||base;
        pen.save();pen.globalAlpha*=alpha*alphaFor(name);pen.translate(p.x,headTop+p.y);pen.scale(p.width/base.width,p.height/base.height);pen.translate(-base.x,-base.y);draw();pen.restore();
      };
      if(look.makeup&&look.makeup!=='aucun') {
        makeupPart('joues',look.makeup==='rose'?.25:.16,()=>{pen.fillStyle=look.makeup==='rose'?'#b65f74':'#b37964';pen.beginPath();pen.ellipse(3,8.9,1.8,1,0,0,TAU);pen.fill();});
        makeupPart('levres',look.makeup==='rose'?.5:.3,()=>{pen.strokeStyle=look.makeup==='rose'?'#9e4e61':'#965a51';pen.lineWidth=.45;pen.beginPath();pen.moveTo(5,11);pen.lineTo(6.8,10.6);pen.stroke();});
        if(look.makeup==='regard')makeupPart('yeux',.7,()=>{pen.strokeStyle='#4d3838';pen.lineWidth=.4;pen.beginPath();pen.moveTo(3.2,6.2);pen.quadraticCurveTo(4.3,5.6,5,6);pen.stroke();});
      }
      if(BEARD_DEFAULTS[look.beard]) {
        const p=face.beard?.[look.beard]||BEARD_DEFAULTS[look.beard];part(look,`beard:${look.beard}`,p.x,headTop+p.y,p.width,p.height,look.hair,alphaFor('beard'));
      }
      part(look,'shirt',-5.8*slim,pose.hip[1]-18.1-pose.breathe*.12,11.6*slim+pose.breathe*.10,17.6+pose.breathe*.12,look.shirt);
      if(look.outfit==='tablier') {
        part(look,'apronTop',-3.1*slim,pose.hip[1]-17.8,9.1*slim,17.6);
        pen.save();pen.translate(0,pose.hip[1]-1.1);pen.rotate(pose.walking?Math.sin(pose.step)*.07:pose.resting?-.3:0);
        part(look,'apronBottom',-4.2*slim,0,10.5*slim,10.5);pen.restore();
      }
      const hand=arm(look,shoulder,pose.target,false,debug);
      if(joints) {
        pen.lineWidth=.35;pen.strokeStyle='#307f87';pen.fillStyle='#e8b744';
        for(const point of debug){pen.beginPath();pen.arc(...point,.8,0,TAU);pen.fill();pen.stroke();}
      }
      pen.restore();
      return {pose,hand:[x+hand[0]*scale*direction,y+(hand[1]+pose.bob)*scale],joints:debug};
    },
    get ready(){return assets.has('garcon')&&assets.has('fille')&&Object.keys(manifest?.sharedParts||{}).every(part=>assets.has(`shared:${part}`))&&Object.keys(manifest?.cosmetics||{}).every(kind=>assets.has(`cosmetic:${kind}`));},
    get cacheSize(){return tinted.size;},
    get cacheBytes(){return textureBytes;},
  };
}
