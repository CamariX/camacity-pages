import {createArtworkFrames} from './cadres-art.js';
// Images stay separate from moving players, changing collections and game state.
const observers = new Set();
const images = new Map();
let manifest;

function changed() {
  for (const observer of observers) observer();
}

export const buildingCatalog = fetch(new URL("building-art.json", import.meta.url))
  .then(response => { if (!response.ok) throw new Error("Décors indisponibles"); return response.json(); })
  .then(data => { if (data.version === 1) { manifest = data.buildings; changed(); return manifest; } return {}; })
  .catch(() => ({})); // The existing Canvas buildings remain usable.

function picture(path) {
  if (!images.has(path)) {
    const image = new Image();
    const entry = {image, state:"loading"};
    images.set(path, entry);
    image.decoding = "async";
    const ready = () => { entry.state = "ready"; changed(); };
    const failed = () => { entry.state = "failed"; changed(); };
    if (typeof image.decode === "function") {
      image.src = new URL(path, import.meta.url).href;
      image.decode().then(ready, failed);
    } else {
      image.onload = ready;
      image.onerror = failed;
      image.src = new URL(path, import.meta.url).href;
    }
  }
  const entry = images.get(path);
  return entry.state === "ready" ? entry.image : null;
}

export const QUARRY_WIDTH = 370;
export const HALL_WIDTH = QUARRY_WIDTH * 2;

export function buildingArtKey(place) {
  return place.art === "shop" ? (place.id === "galerie" ? "artShop" : "generalShop") : place.art;
}

const marketGoods = {
  bois:{cell:0,label:"Bois",side:-1,shelf:1},
  planches:{cell:1,label:"Planches",side:-1,shelf:2},
  pierre:{cell:2,label:"Pierre",side:-1,shelf:0},
  fibres:{cell:3,label:"Fibres",side:1,shelf:2},
  minerai:{cell:4,label:"Minerai",side:1,shelf:0},
  lingot:{cell:5,label:"Lingots",side:1,shelf:1},
};

export function marketEntries(place) {
  return Object.entries(marketGoods).flatMap(([item,good])=>{
    const quantity=place.marketStock?.[item];
    return Number.isFinite(quantity) && quantity>0 ? [{item,quantity,...good}] : [];
  });
}

export function marketStockLayout(place, width, ground) {
  return marketEntries(place).map(good=>({...good,width:width*.17,
    x:place.x+good.side*width*.595-width*.085,
    base:ground-6-good.shelf*width*.14}));
}

export function drawMarketRacks(pen, place, width, ground) {
  pen.save();
  for(const side of new Set(marketEntries(place).map(good=>good.side))) {
    const left=place.x+side*width*.595-width*.095;
    const rackWidth=width*.19,bottom=ground-6,top=bottom-width*.42;
    pen.fillStyle="#775039";
    pen.fillRect(left+1,top,2,bottom-top);
    pen.fillRect(left+rackWidth-3,top,2,bottom-top);
    for(let shelf=0;shelf<3;shelf++) {
      const y=bottom-shelf*width*.14;
      pen.fillStyle="#98633f";pen.fillRect(left,y,rackWidth,2.5);
      pen.fillStyle="#d5a46b";pen.fillRect(left,y,rackWidth,1);
    }
  }
  pen.restore();
}

export function hallIsOpen(place) {
  return Boolean(place.interior || place.event && ["open", "running", "paused"].includes(place.event.state));
}

export function hallEventFrame(place, width, height, ground) {
  const span=HALL_WIDTH*.98;
  const interiorHeight=185;
  const scale=Math.min(width/span,height/interiorHeight);
  return {scale,left:place.x-width/(2*scale),
    top:ground-interiorHeight-(height/scale-interiorHeight)/2};
}

// Only draw people already disclosed in the public event projection.
export function drawHallPeople(pen,paintActor,appearance,place,ground,time) {
  if(!hallIsOpen(place)) return;
  const stage={mayor:185,worker:240,collector:295};
  let guest=0;
  for(const [index,person] of (place.event?.people || []).slice(0,36).entries()) {
    const id=Number.isSafeInteger(person.id) && person.id>0 ? person.id : index+1;
    const onStage=Object.prototype.hasOwnProperty.call(stage,person.role);
    const column=guest%9,row=Math.floor(guest/9);
    const x=place.x+(onStage?stage[person.role]:-98+column*25);
    const lane=onStage?-44:-13-row*16;
    if(!onStage) guest++;
    const colour=/^#[0-9a-f]{6}$/i.test(person.color || '')?person.color:undefined;
    const auctioneer=place.event?.kind==='land-auction' && person.role==='mayor';
    paintActor({id,...appearance(id,colour)},{x,lane,pose:auctioneer?'auction':'idle',dir:auctioneer?-1:1},time,false);
    if(onStage && person.name) {
      pen.save();
      pen.fillStyle='#344b39';
      pen.fillRect(x-25,ground+lane-70,50,15);
      pen.fillStyle='#fff3d7';
      pen.font='700 7.5px system-ui';
      pen.textAlign='center';
      pen.fillText(person.name,x,ground+lane-59,46);
      pen.restore();
    }
  }
}

export function createBuildingImages(pen, onReady = () => {}) {
  observers.add(onReady);
  const drawFrame=createArtworkFrames(pen,onReady);
  let enabled = true;

  function marketStock(place, asset, ground) {
    const goods=marketEntries(place);
    if(!asset.stock || !goods.length) return;
    const image=picture(`assets/buildings/${asset.stock.file}`);
    if(!image) return;
    drawMarketRacks(pen,place,asset.width,ground);
    for(const good of marketStockLayout(place,asset.width,ground)) {
      const [sx,sy,sw,sh]=asset.stock.sources[good.cell];
      const height=good.width*sh/sw;
      pen.drawImage(image,sx,sy,sw,sh,good.x,good.base-height,good.width,height);
    }
  }

  function collection(place, ground, height) {
    if (!hallIsOpen(place)) return;
    const entries = (place.event?.collection || []).slice(0, 6);
    const width = HALL_WIDTH;
    const left = place.x-width/2;
    const top = ground-height;
    for (const [index, piece] of entries.entries()) {
      const x = left+width*.085+(index%3)*64;
      const y = top+height*.48+Math.floor(index/3)*54;
      const image = /^art-[a-z0-9-]+\.webp$/.test(piece.image || "") ? picture(piece.image) : null;
      drawFrame({x:x-5,y:y-5,width:61,height:43},piece.quality,image,piece.icon);
      pen.font="700 7.5px system-ui";
      pen.textAlign="center";
      pen.fillStyle="#342c23";
      pen.fillText(piece.name || "Œuvre",x+25.5,y+45,60);
    }
  }

  function draw(place, ground) {
    const asset=enabled && manifest?.[buildingArtKey(place)];
    if (!asset) return false;
    const variant=place.art === "hall" && !hallIsOpen(place) ? "exterior" : "interior";
    const name=asset.variants[variant];
    if (!name) return false;
    const image=picture(`assets/buildings/${name}`);
    if (!image) return false;
    const [sx,sy,sw,sh]=asset.source;
    const width=asset.width,height=width*sh/sw;
    const left=place.x-width/2,top=ground-height*(asset.baseline ?? 1);
    pen.save();
    pen.imageSmoothingEnabled=true;
    pen.imageSmoothingQuality="high";
    pen.drawImage(image,sx,sy,sw,sh,left,top,width,height);
    if (!place.construction && asset.sign) {
      pen.textAlign="center";
      const title=place.name || asset.label;
      const size=place.art === "hall" ? 12 : 10;
      pen.font=`700 ${size}px system-ui`;
      const fit=Math.min(1,width*.30/Math.max(1,pen.measureText(title).width));
      pen.font=`700 ${size*fit}px system-ui`;
      pen.fillStyle="#4b3020";
      pen.fillText(title,left+width*asset.sign[0],top+height*asset.sign[1]);
    }
    if (place.art === "hall") collection(place,ground,height);
    if (place.art === "market") marketStock(place,asset,ground);
    pen.restore();
    return true;
  }

  return {draw, drawContents(place,ground) {
    pen.save();
    collection(place,ground,HALL_WIDTH/3);
    pen.restore();
  }, setEnabled(value) { enabled=Boolean(value); onReady(); },
    ready() { return Boolean(manifest); }};
}
