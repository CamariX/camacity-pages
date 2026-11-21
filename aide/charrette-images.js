// Chassis, wheels and real cargo are independent layers; the actor supplies direction.
const observers=new Set(),images=new Map();
let manifest;
export const cartReady=fetch(new URL('cart-art.json',import.meta.url))
  .then(response=>{if(!response.ok)throw new Error('Charrette HD indisponible');return response.json();})
  .then(data=>{if(data.version===1)manifest=data;for(const observer of observers)observer();return data;})
  .catch(()=>null);

function picture(file) {
  if(!images.has(file)) {
    const image=new Image(),entry={image,ready:false};images.set(file,entry);
    image.decoding='async';image.onload=()=>{entry.ready=true;for(const observer of observers)observer();};
    image.src=new URL(file,import.meta.url).href;
  }
  const entry=images.get(file);return entry.ready?entry.image:null;
}

export function createCartImages(pen,onReady=()=>{}) {
  observers.add(onReady);
  return function drawCart(load,time,moving,stride) {
    if(!manifest)return false;
    const {body,wheel,crates}=manifest.parts;
    const chassis=picture(body.file),rim=picture(wheel.file);
    const source=manifest.materials.sources[load];
    const hasCargo=load && load!=='empty';
    const cargo=hasCargo?picture(source?manifest.materials.file:crates.file):null;
    if(!chassis || !rim || hasCargo && !cargo)return false;
    pen.save();pen.translate(-50,0);
    if(hasCargo) {
      const crop=source || crates.source;
      const scale=Math.min(46/crop[2],28/crop[3]);
      const width=crop[2]*scale,height=crop[3]*scale;
      pen.drawImage(cargo,...crop,-width/2,-10-height,width,height);
    }
    const ratio=body.source[3]/body.source[2],width=74,height=Math.min(27,width*ratio);
    pen.drawImage(chassis,...body.source,-27,-6-height,width,height);
    const angle=moving?(Number.isFinite(stride)?stride*38/8:time*5):0;
    for(const x of [-14,16]) {
      pen.save();pen.translate(x,-5);pen.rotate(angle);
      pen.drawImage(rim,...wheel.source,-8,-8,16,16);pen.restore();
    }
    pen.restore();return true;
  };
}
