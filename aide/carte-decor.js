export const ground = 357;
const sunY = 86;
const sunHalo = 46;
export const skyTop = sunY - sunHalo - 8;
const apartmentCenter = 2215;
const materialIcons = {bois: "🪵", planches: "▤", pierre: "◆", lingots: "▰", repas: "🥣"};

export function apartmentWindow(unit, center) {
  const index = unit - 1;
  return {x: center - 86 + (index % 4) * 55, y: 182 + Math.floor(index / 4) * 60};
}

export function createDecor(pen) {
  function rect(x,y,w,h,fill) {
    pen.fillStyle = fill;
    pen.fillRect(x,y,w,h);
  }
  function polygon(points, fill) {
    pen.beginPath();
    pen.moveTo(...points[0]);
    for (const point of points.slice(1)) pen.lineTo(...point);
    pen.closePath();
    pen.fillStyle = fill;
    pen.fill();
  }
  function line(points, color, width = 2) {
    pen.beginPath();
    pen.moveTo(...points[0]);
    for (const point of points.slice(1)) pen.lineTo(...point);
    pen.lineCap = "round";
    pen.lineJoin = "round";
    pen.lineWidth = width;
    pen.strokeStyle = color;
    pen.stroke();
  }
  function oval(x,y,rx,ry,fill) {
    pen.beginPath();
    pen.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    pen.fillStyle = fill;
    pen.fill();
  }
  function text(text,x,y,fill,size = 13, font = "system-ui", align = "center") {
    pen.fillStyle = fill;
    pen.font = `650 ${size}px ${font}`;
    pen.textAlign = align;
    pen.fillText(text,x,y);
  }
  function sign(title,x,y,w,detail) {
    rect(x-w/2+2,y+2,w,21,"#4a594d");
    rect(x-w/2,y,w,21,"#36483b");
    rect(x-w/2+3,y+3,w-6,15,"#455745");
    text(title,x,y+15,"#fff3cd",11);
    if (detail) {
      pen.font = "650 12px system-ui";
      const width = Math.min(224, pen.measureText(detail).width + 12);
      rect(x-width/2,y+23,width,18,"#36483b");
      pen.fillStyle = "#fff3cd";
      pen.fillText(detail,x,y+36,width-12);
    }
  }
  function windowPane(x,y,w=24,h=34) {
    rect(x-3,y-3,w+6,h+7,"#705946");
    rect(x,y,w,h,"#8caaa0");
    polygon([[x,y],[x+w,y],[x,y+h]],"#bfd1b3");
    rect(x+w/2-1,y,2,h,"#f1dcb1");
    rect(x,y+h*.45,w,2,"#f1dcb1");
    rect(x-5,y+h+1,w+10,4,"#d3ae71");
  }
  function bush(x,y,size, tone="#8b9b61") {
    oval(x,y,size, size*.38,tone);
    oval(x-size*.43,y-4,size*.49,size*.50,tone);
    oval(x+size*.36,y-6,size*.55,size*.50,tone);
  }
  function tree(x,y,scale, palette=["#637961","#80935f","#a0a76a"]) {
    pen.save();
    pen.translate(x,y);
    pen.scale(scale,scale);
    rect(-4,-74,8,74,"#745941");
    line([[0,-48],[-14,-67]],"#745941",4);
    line([[1,-57],[14,-76]],"#745941",4);
    for (const [tx,ty,rx,ry,col] of [[-16,-75,20,28,0],[15,-83,22,28,0],[-2,-103,26,33,1],[-14,-91,21,23,1],[-4,-116,18,18,2],[14,-99,16,21,1]]) {
      oval(tx,ty,rx,ry,palette[col]);
    }
    oval(-9,3,21,4,"#626f4940");
    pen.restore();
  }
  function conifer(x,y,s,shade="#527761") {
    rect(x-2*s,y-57*s,4*s,57*s,"#745441");
    for (const [height,spread] of [[52,24],[69,20],[89,14]]) {
      polygon([[x,y-(height+23)*s],[x+spread*s,y-(height-17)*s],[x-spread*s,y-(height-17)*s]],shade);
    }
  }
  function crate(x,y,w=24,h=20) {
    rect(x,y,w,h,"#bc8659");
    rect(x+3,y+3,w-6,h-6,"#d7a06b");
    line([[x+3,y+3],[x+w-3,y+h-3]],"#865e43",2);
    rect(x,y+h-3,w,3,"#986646");
    rect(x,y,w,2,"#e6b487");
  }
  function stackLogs(x,y,count=4) {
    for(let i=0;i<count;i++) {
      const row = i > 2 ? 1 : 0;
      const sx = x + (i%3)*13 + row*6, sy = y - row*10;
      rect(sx-16,sy-5,20,9,"#8b613e");
      oval(sx+4,sy,5,5,"#e0b578");
      oval(sx+4,sy,2.5,2.5,"#b98a53");
    }
  }
  function bench(x,y,width=68) {
    rect(x+5,y+4,6,28,"#6f4b37");
    rect(x+width-12,y+4,6,28,"#6f4b37");
    rect(x,y,width,7,"#8b583c");
    rect(x,y,width,2,"#e3b383");
  }
  function gable(x,y,w,h,wall,roof, title, cutaway) {
    const bottom = y+h;
    rect(x+5,y+5,w,h+2,"#536b5745");
    rect(x,y,w,h,wall);
    rect(x,bottom-8,w,8,"#82785c");
    polygon([[x-10,y+7],[x+w*.43,y-50],[x+w+12,y+7]],"#59483b");
    polygon([[x-8,y+1],[x+w*.43,y-50],[x+w+10,y+1]],roof);
    line([[x-5,y-1],[x+w*.43,y-48],[x+w+5,y-1]],"#eed0a270",3);
    for (let i=0;i<4;i++) {
      const offset=(i+1)*10;
      line([[x+offset,y+1-offset*.64],[x+w+2-offset,y+1-offset*.64]],"#534a3933",2);
    }
    if (cutaway) {
      rect(x+12,y+21,w-24,h-32,"#554436");
      rect(x+18,y+27,w-36,h-42,"#bc9867");
      const glow=pen.createLinearGradient(x,y+22,x,bottom);
      glow.addColorStop(0,"#e7bf83"); glow.addColorStop(1,"#987352");
      rect(x+18,y+27,w-36,h-42,glow);
      for(let pl=x+24;pl<x+w-20;pl+=22) rect(pl,y+31,1,h-48,"#805c414d");
      rect(x+15,bottom-19,w-30,5,"#d3a677");
      rect(x+15,bottom-14,w-30,5,"#654737");
      rect(x+13,y+20,w-26,7,"#a07452");
    }
    if (title) sign(title,x+w/2,y-8,Math.max(78,title.length*7.5));
    return bottom;
  }
  function house(x,w,roof,wall,name) {
    const y=267;
    gable(x,y,w,ground-y,wall,roof);
    rect(x+w*.74,y-24,11,29,"#aa7857");
    rect(x+w*.74-2,y-27,15,4,"#7b5345");
    windowPane(x+13,y+24,22,24);
    const doorX=x+w*.58;
    rect(doorX,y+43,23,ground-y-46,"#6e533e");
    rect(doorX+3,y+46,17,ground-y-50,"#94724e");
    rect(doorX+16,y+66,2,2,"#e6ca7e");
    sign(name,x+w*.5,y+6,63);
    bush(x+w+5,ground-4,14);
  }
  function townHall() {
    const x=68,y=201,w=235;
    gable(x,y,w,ground-y,"#d7c497","#8a6b57");
    rect(x+20,y+17,w-40,4,"#ad9470");
    for (const wX of [x+23,x+63,x+151,x+191]) windowPane(wX,y+49,21,38);
    rect(165,y+64,42,86,"#725b48"); rect(172,y+73,28,77,"#95825e");
    rect(163,ground-9,47,5,"#a18e68");
    rect(155,ground-4,64,4,"#b7a584");
    rect(156,y-57,55,57,"#d4bb8a");
    polygon([[149,y-56],[183,y-86],[218,y-56]],"#695b4b");
    oval(183,y-34,15,15,"#fbebc1");
    oval(183,y-34,12,12,"#e8d1a4");
    line([[183,y-42],[183,y-34],[190,y-32]],"#5e4c40",2);
    sign("MAIRIE",186,y+22,78);
    line([[183,y-82],[183,y-111]],"#64533d",3);
    polygon([[184,y-110],[216,y-107],[207,y-98],[184,y-99]],"#c87453");
    for(let i=0;i<5;i++) rect(80+i*9,ground-17,8,14,"#b98a5b");
    crate(114,ground-24,32,24);
    rect(306,ground-34,11,34,"#9a8b71");
    rect(307,ground-50,11,14,"#b2a183");
    rect(319,ground-28,20,25,"#bcaa86");
  }
  function depot() {
    const x=401,y=237,w=231;
    gable(x,y,w,ground-y,"#b99d72","#727754","FORESTIERS",true);
    stackLogs(462,ground-20,5);
    stackLogs(525,ground-20,4);
    bench(546,ground-48,62);
    for(let j=0;j<3;j++) crate(584+j*11,ground-36,19,17);
    rect(626,ground-11,28,11,"#9a7950");
  }
  function workshop() {
    const x=980,y=226,w=325;
    gable(x,y,w,ground-y,"#c6a072","#98644b","MENUISERIE",true);
    windowPane(1007,265,28,34);
    windowPane(1245,265,28,34);
    rect(1045,269,54,7,"#806148");
    for(let i=0;i<4;i++) {rect(1051+i*12,278,3,17,"#664f3b"); rect(1049+i*12,281,7,4,"#ac8d69");}
    line([[1163,253],[1163,268]],"#6c573e",2);
    polygon([[1155,268],[1171,268],[1176,278],[1150,278]],"#6b674a");
    oval(1163,279,9,2,"#f3d890");
    bench(1154,ground-39,66);
    for(let i=0;i<4;i++) rect(1160+i*3,ground-43-i*2,52-i*4,3,i%2?"#e0b87d":"#b78152");
    for(let i=0;i<4;i++) rect(1223+i*7,ground-18-i*3,47,4,"#dbab72");
    crate(994,ground-29,35,23);
    rect(1293,ground-118,7,112,"#785640");
  }
  function streetLamp(x) {
    rect(x-2,ground-67,4,67,"#5b6653");
    rect(x-5,ground-7,10,7,"#64705a");
    rect(x-6,ground-80,12,14,"#5b6653");
    rect(x-4,ground-78,8,10,"#f8d49a");
    polygon([[x-8,ground-80],[x,ground-85],[x+8,ground-80]],"#5b6653");
  }
  function market() {
    const x=1404,y=279,w=160;
    rect(x+4,y,w-8,ground-y-4,"#ae8b68");
    rect(x+13,y+6,w-26,ground-y-18,"#765c45");
    rect(x+15,ground-35,w-29,25,"#a7734e");
    rect(x+10,ground-38,w-20,5,"#dbaa6e");
    for(let j=0;j<7;j++){
      const k=x+j*w/7;
      polygon([[k+6,y-18],[k+w/7+5,y-18],[k+w/7,y],[k,y]],j%2?"#d7b58c":"#a65645");
      oval(k+w/14,y,w/14+1,4,j%2?"#ead5a6":"#aa6550");
      oval(k+w/14,ground-43,6,5,["#ab7250","#a7aa52","#d6a854"][j%3]);
    }
    sign("MARCHÉ",x+w/2,y-42,83);
    crate(1390,ground-20,27,20); crate(1562,ground-23,32,23);
  }
  function apartments(building) {
    const x=2081,y=145,w=265;
    rect(x+8,y+6,w,ground-y,"#53684c4d");
    rect(x,y,w,ground-y,"#d0af81");
    rect(x+3,y-10,w-6,12,"#737b65");
    rect(x-5,y-14,w+10,7,"#525d4e");
    rect(x+13,y+3,12,ground-y-3,"#e6c69b");
    rect(x+w-25,y+3,12,ground-y-3,"#e6c69b");
    for (let row=0;row<3;row++){
      const floor=y+24+row*60;
      rect(x,floor+33,w,4,"#b89972");
      for(let col=0;col<4;col++){
        const wx=apartmentWindow(row*4+col+1,apartmentCenter).x-12;
        windowPane(wx,floor,24,27);
        if(row<2 && col%2===0) {
          rect(wx-5,floor+21,34,11,"#506957");
          for(let i=0;i<4;i++) rect(wx-2+i*8,floor+20,1,11,"#caad79");
          bush(wx+3,floor+20,7,"#77874e");
        }
      }
    }
    rect(x+107,ground-46,55,46,"#675641");
    rect(x+111,ground-41,47,39,"#84948a");
    rect(x+133,ground-41,3,38,"#ccb695");
    sign(`IMMEUBLE ${building}`,x+132,ground-70,105);
  }
  function background(left, span, top, height, time) {
    const sky = pen.createLinearGradient(0,top,0,ground);
    sky.addColorStop(0,"#9cb7b2");
    sky.addColorStop(.7,"#eee3bd");
    sky.addColorStop(1,"#f6dfa9");
    rect(left,top,span,height,sky);
    const sun=left+span*.75;
    oval(sun,sunY,sunHalo,sunHalo,"#f8e8be88");
    oval(sun,sunY,30,30,"#fff0c2");
    const spacing = 335;
    const drift = 90 + time * 3 - left * .18;
    const first = Math.floor((left - 100 - drift) / spacing);
    const last = Math.ceil((left + span + 100 - drift) / spacing);
    for (let i = first; i <= last; i++) {
      const x = i * spacing + drift;
      const shape = (i % 3 + 3) % 3;
      oval(x,69+shape*25,60+shape*16,10,"#fff2d27f");
      oval(x-18,64+shape*25,27,12,"#fff2d28a");
    }
    for(let layer=0;layer<3;layer++) {
      const y=206+layer*49;
      const ridge=[[left-150,ground+13]];
      for(let x=left-150;x<=left+span+150;x+=18) ridge.push([x,y+34*Math.sin((x-left*.42)/(145-layer*22)+layer)+17*Math.sin((x-left*.28)/61+layer)]);
      ridge.push([left+span+150,ground+13]);
      polygon(ridge,["#8faa9b","#a4b38c","#b5bd88"][layer]);
    }
    rect(left,ground-16,span,18,"#8b9c69");
    rect(left,ground,span,height,"#a48b64");
    rect(left,ground+4,span,45,"#baa87d");
    rect(left,ground+13,span,27,"#ceba8e");
    rect(left,ground+48,span,height,"#84945e");
    rect(left,ground+55,span,height,"#768a57");
    for(let x=Math.floor(left/17)*17;x<left+span+20;x+=17) {
      const v=Math.sin(x*.33);
      rect(x,ground+22+v*10,3+Math.abs(v)*6,1.4,"#9b825f80");
      line([[x,ground+57+v*9],[x+2,ground+50+v*9],[x+5,ground+54+v*9]],"#9cab70",1.6);
      if(x%3===0) oval(x,ground+80+v*14,2.6,1.6,x%5===0?"#f1d6a0":"#bfad78");
    }
  }
  function cart(load, t, moving) {
    pen.save();
    pen.translate(-50,0);
    if(load==="logs") stackLogs(0,-20,4);
    if(load && load!=="logs" && load!=="empty") {
      crate(-19,-32,23,20); crate(3,-28,22,17);
      rect(-16,-34,40,4,"#e3b784");
    }
    polygon([[-25,-16],[29,-16],[24,-7],[-19,-7]],"#8d5e42");
    rect(-24,-17,52,4,"#c6935e");
    line([[23,-10],[45,-17]],"#8b613f",3);
    for(const x of [-14,16]){
      oval(x,-5,8,8,"#553f34"); oval(x,-5,5,5,"#ceb389");
      const angle=moving?t*5:0;
      line([[x+4*Math.cos(angle),-5+4*Math.sin(angle)],[x-4*Math.cos(angle),-5-4*Math.sin(angle)]],"#6c503b",1.3);
      oval(x,-5,1.4,1.4,"#503b31");
    }
    pen.restore();
  }
  function forest(x, width, wood) {
    for (let i = 0; i <= width * 2 / 31; i++) {
      const treeX = x - width + i * 31;
      conifer(treeX, ground - 13 - (i % 3) * 5, .74 + (i % 5) * .155,
        i % 2 ? "#5d795d" : "#6e8968");
    }
    for (const [offset, size] of [[-324,.9],[-247,1.17],[-142,1.03],[5,1.35],[152,1.18],[235,1.37],[301,1.08]]) {
      tree(x + offset, ground - 2, size, ["#527056","#738c5b","#94a26a"]);
    }
    if (wood > 0) {
      stackLogs(x + 64, ground - 3, Math.min(6, Math.ceil(wood / 6)));
      sign(`${wood} BOIS`, x + 64, ground - 43, 64);
    }
    sign("FORÊT", x - 77, ground - 66, 66);
  }

  function quarry(x, title) {
    polygon([[x-190,ground],[x-145,ground-67],[x-97,ground-84],[x-42,ground-133],[x+12,ground-112],[x+55,ground-171],[x+110,ground-104],[x+180,ground]],"#8f8e7c");
    polygon([[x-170,ground],[x-125,ground-58],[x-67,ground-58],[x-43,ground-130],[x-13,ground-80],[x+18,ground-64],[x+72,ground-60],[x+96,ground]],"#b7ae91");
    polygon([[x-105,ground],[x-78,ground-42],[x-24,ground-56],[x+21,ground-52],[x+64,ground-25],[x+104,ground]],"#726f61");
    for (let i = 0; i < 14; i++) {
      const a=x-116+i*17, b=ground-5-(i%3)*7;
      polygon([[a-9,b],[a-5,b-9],[a+4,b-12],[a+11,b-3],[a+7,b+4]],i%2?"#a9a085":"#bbb392");
    }
    crate(x+119,ground-24,31,24);
    if (title) sign(title,x,ground-104,85);
  }

  function farm(x, title) {
    gable(x-157,244,145,ground-244,"#d2a473","#8d604a",title);
    windowPane(x-133,273,19,25);
    rect(x-96,289,38,ground-292,"#785440");
    rect(x-15,ground-7,172,10,"#846a48");
    for (let i = 0; i < 18; i++) {
      const row = x - 3 + i * 9;
      line([[row,ground],[row+2,ground-18-(i%4)*3]],"#7c8543",2);
      oval(row+2,ground-20-(i%4)*3,3,6,"#dbb568");
    }
  }

  function extraction({x, name, harvest}) {
    polygon([[x-76,ground],[x-50,ground-40],[x-22,ground-54],[x+12,ground-68],
      [x+48,ground-44],[x+72,ground]],"#888570");
    for (let i = 0; i < 8; i++) {
      const a=x-51+i*15, b=ground-4-(i%3)*5;
      polygon([[a-8,b],[a-5,b-10],[a+5,b-13],[a+10,b-2]],i%2?"#9d957a":"#b7ae91");
    }
    sign(name.toUpperCase(),x,ground-78,78,harvest);
  }

  function fields({x, name, harvest}) {
    rect(x-72,ground-8,144,11,"#846a48");
    for (let i = 0; i < 15; i++) {
      const row = x - 65 + i * 9;
      line([[row,ground],[row+2,ground-16-(i%4)*3]],"#7c8543",2);
      oval(row+2,ground-18-(i%4)*3,3,6,"#dbb568");
    }
    sign(name.toUpperCase(),x,ground-56,70,harvest);
  }

  function annex(x, title, hot) {
    gable(x-140,224,272,ground-224,"#c6a072",hot?"#645750":"#9a634b",title,true);
    bench(x+15,ground-39,81);
    if (hot) {
      rect(x+74,ground-73,40,52,"#715a4a");
      rect(x+79,ground-63,29,26,"#6b493e");
      oval(x+93,ground-49,10,8,"#dd8b53");
    } else {
      for (let i = 0; i < 3; i++) crate(x-98+i*22,ground-35,18,15);
      oval(x+56,ground-44,11,8,"#6c6c54");
    }
  }

  const buildingName = (place) => place.construction ? "" : place.name.toUpperCase();
  const painters = {
    townHall, depot, workshop, market,
    forest: (place) => forest(place.x, place.width, place.wood),
    quarry: (place) => quarry(place.x,buildingName(place)),
    farm: (place) => farm(place.x,buildingName(place)),
    extraction, fields,
    kitchen: (place) => annex(place.x,buildingName(place),false),
    forge: (place) => annex(place.x,buildingName(place),true),
    auction: (place) => gable(place.x - 93, 195, 186, ground - 195, "#cfb1a9", "#6c5368", buildingName(place), true),
    house: (place) => {
      house(place.x - 48,104,["#9b6753","#758275","#a67951"][place.owner % 3],"#e0c39a",place.name.slice(0,10));
      if (place.level > 0) gable(place.x+45,300,34,ground-300,"#c8a879","#866143");
    },
    apartments: (place) => {
      pen.save();
      pen.translate(place.x-apartmentCenter,0);
      apartments(place.building);
      pen.restore();
    },
  };

  function paintPlace(place) {
    pen.save();
    if (place.anchor !== undefined) pen.translate(place.x-place.anchor,0);
    painters[place.art]?.(place);
    pen.restore();
  }

  function paintConstruction(place, time) {
    const {cells, height, batch, completed, total} = place.construction;
    const plaqueY = ground - height - 46;
    const title = place.name.toUpperCase();
    if (completed === total) {
      paintPlace(place);
      sign(title, place.x, plaqueY, 85, "À inaugurer");
      return;
    }
    const topOf = (cell) => ground - cell.bottom - cell.height;
    for (const cell of cells) {
      const top = topOf(cell);
      rect(cell.x, top, cell.width, cell.height, cell.ready ? "#acd49b68" : "#34473d59");
      if (cell.done) continue;
      line([[cell.x + 3, top + 3], [cell.x + cell.width - 3, top + cell.height - 3]], "#f9f3dc48", 1);
      if (cell.active) {
        const fraction = Math.max(0, Math.min(1, (time - cell.active.start) / (cell.active.end - cell.active.start || 1)));
        rect(cell.x + 2, top + cell.height * (1 - fraction), cell.width - 4, cell.height * fraction, "#e2ae64b8");
      }
    }
    const revealed = cells.filter((cell) => cell.done);
    if (revealed.length) {
      pen.save();
      pen.beginPath();
      for (const cell of revealed) pen.rect(cell.x, topOf(cell), cell.width, cell.height);
      pen.clip();
      paintPlace(place);
      pen.restore();
    }
    for (const cell of cells) {
      if (cell.done) continue;
      pen.strokeStyle = cell.active ? "#ffe6a6" : "#fffaf0";
      pen.lineWidth = cell.active ? 3 : 2;
      pen.strokeRect(cell.x + 1, topOf(cell) + 1, cell.width - 2, cell.height - 2);
    }
    const missing = Object.entries(batch?.materials ?? {}).flatMap(([item, resource]) =>
      resource.missing ? [`${materialIcons[item] || ""} ${resource.missing} ${item}`.trim()] : []);
    const detail = missing.length ? missing.join(" · ") : batch?.slots.length ? "Matériaux réunis" : "Travaux en cours";
    sign(title, place.x, plaqueY, 85, detail);
  }

  function draw(left, right, places, time) {
    for (let x = Math.max(25, Math.floor((left-120)/97)*97+25); x < right+120; x += 97) {
      if (x < 675 || x > 1405) tree(x,ground-12,.45+(x%7)*.07,["#748c68","#8fa06e","#a7b373"]);
    }
    for (let x = Math.max(27, Math.floor((left-75)/157)*157+27); x < right+75; x += 157) {
      bush(x,ground-9,19+x%17);
      if (x%3===0) bush(x,ground+63,22,"#587952");
    }
    for (const place of places) {
      const width = place.width || 210;
      if (place.x + width < left || place.x - width > right) continue;
      if (place.construction) paintConstruction(place, time);
      else paintPlace(place);
      if (place.marketSigns?.length) {
        const icons = {...materialIcons, fibres:"🧶", cereales:"🌾", semence:"🌱", minerai:"⛏", lingot:"▰"};
        for (const [index, kind] of ["A", "V"].entries()) {
          const offers = place.marketSigns.filter((row) => row.kind === kind);
          if (!offers.length) continue;
          const line = offers.slice(0, 3).map(({item, qty}) => `${icons[item] || item} ${qty}`);
          if (offers.length > 3) line.push(`+${offers.length - 3}`);
          sign(kind === "A" ? "↓ Recherché" : "↑ En vente", place.x, ground - 189 - index * 50, 135, line.join(" · "));
        }
      }
      if (place.deliverySign) sign(`🛒 ${place.deliverySign} à livrer`, place.x, ground - 218, 124);
    }
    for (const x of [34,330,657,1415,1810,2140,2685,3085]) {
      if (x>left-20 && x<right+20) streetLamp(x);
    }
  }

  function celebration(x, elapsed, animate) {
    sign("INAUGURATION", x, ground - 216, 148);
    if (!animate) return;
    const colors = ["#fad786", "#d58173", "#76b79a", "#a9cbe5", "#f5eccb"];
    for (let index = 0; index < 66; index++) {
      const age = (elapsed + index * .091) % 3.5;
      const start = (index * 79 % 225) - 112;
      const fall = index % 4 * 6 + 31;
      const y = ground - 196 + age * fall - (index * 39 % 69);
      const sway = Math.sin(index + age * 3) * 15;
      pen.save();
      pen.translate(x + start + sway, y);
      pen.rotate(index + age * 4);
      rect(-3, -2, 6, 4, colors[index % colors.length]);
      pen.restore();
    }
  }

  return {rect, polygon, line, oval, crate, cart, background, draw, celebration};
}
