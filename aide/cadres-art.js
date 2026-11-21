// One reusable frame per disclosed quality. Empty supports have no rarity glow.
export const ART_FRAME_STYLES = Object.freeze({
  belle: {color:'#72be78',blur:1},
  remarquable: {color:'#67b9ed',blur:2},
  exceptionnelle: {color:'#ee5b4e',blur:3.5},
  'chef-oeuvre': {color:'#ffd15a',blur:5}
});
const images = new Map();
const observers = new Set();

export function frameFile(quality) {
  return Object.hasOwn(ART_FRAME_STYLES,quality) ? `art-frame-${quality}-v1.webp` : null;
}

function frameImage(quality) {
  const file=frameFile(quality);
  if(!file) return null;
  if(!images.has(file)) {
    const image=new Image(),entry={image,ready:false};
    images.set(file,entry);image.decoding='async';
    image.onload=()=>{entry.ready=true;for(const observer of observers)observer();};
    image.src=new URL(file,import.meta.url).href;
  }
  const entry=images.get(file);
  return entry.ready?entry.image:null;
}

export function createArtworkFrames(pen,onReady=()=>{}) {
  observers.add(onReady);
  return function drawFrame(bounds,quality,artwork=null,icon='◆') {
    const {x,y,width,height}=bounds;
    const inner={x:x+width*.20,y:y+height*.20,width:width*.60,height:height*.60};
    const style=Object.hasOwn(ART_FRAME_STYLES,quality)?ART_FRAME_STYLES[quality]:null,frame=frameImage(quality);
    pen.save();
    if(style) {
      pen.shadowColor=style.color;
      pen.shadowBlur=Math.min(40,style.blur*Math.abs(pen.getTransform().a));
    }
    if(frame) pen.drawImage(frame,x,y,width,height);
    else {
      // Solid backing makes the fallback shadow exterior too.
      pen.fillStyle='#89643f';pen.fillRect(x+width*.08,y+height*.08,width*.84,height*.84);
      if(style) {
        pen.strokeStyle=style.color;pen.lineWidth=Math.min(width,height)*.025;
        pen.strokeRect(x+width*.08,y+height*.08,width*.84,height*.84);
      }
    }
    pen.shadowBlur=0;
    // Dark opaque backing, frame first, then the independent artwork in front.
    pen.fillStyle='#000000';pen.fillRect(x+width*.185,y+height*.185,width*.63,height*.63);
    pen.save();pen.beginPath();pen.rect(inner.x,inner.y,inner.width,inner.height);pen.clip();
    if(artwork) {
      const scale=Math.min(inner.width/artwork.naturalWidth,inner.height/artwork.naturalHeight);
      const w=artwork.naturalWidth*scale,h=artwork.naturalHeight*scale;
      pen.drawImage(artwork,inner.x+(inner.width-w)/2,inner.y+(inner.height-h)/2,w,h);
    } else if(quality) {
      pen.fillStyle='#647c64';pen.textAlign='center';pen.textBaseline='middle';
      pen.font=`${inner.height*.65}px system-ui`;
      pen.fillText(icon,inner.x+inner.width/2,inner.y+inner.height/2,inner.width);
    }
    pen.restore();
    pen.restore();
  };
}
