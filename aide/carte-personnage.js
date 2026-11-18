import {ground} from "./carte-decor.js";

const TAU = Math.PI * 2;
const shadow = "#41483e";
const pants = "#56624c";
const sole = "#463831";

export function createCharacters(pen, art) {
  const {oval, rect, polygon, line, crate, cart} = art;

  function face(person, front) {
    if (front) {
      oval(0,-38,9,9,person.hair);
      oval(-7,-36,2.5,3,person.skin);
      oval(7,-36,2.5,3,person.skin);
      oval(0,-36,7.4,7.5,person.skin);
      rect(-7,-45,14,4,person.hair);
      oval(-2.9,-36,1,1,"#473b35");
      oval(2.9,-36,1,1,"#473b35");
      return;
    }
    oval(-1,-38,8.4,8.9,person.hair);
    oval(1,-36,6.8,7.7,person.skin);
    rect(-7,-46,13.5,4.2,person.hair);
    oval(-3.5,-36,2,2.5,person.skin);
    polygon([[6,-38],[9,-35],[6,-34]],person.skin);
    oval(4.8,-37,1.1,1.1,"#473b35");
  }

  function profileLeg(phase, far) {
    const swing = Math.sin(phase) * 8.2;
    const lift = Math.max(0, Math.cos(phase)) * 4.8;
    const knee = [swing * .54 + 2, -8 - lift * .48];
    const foot = [swing - 1, -2 - lift];
    line([[-1,-17], knee, foot], far ? shadow : pants, 4.8);
    line([foot, [foot[0] + 5.8, foot[1] + .6]],sole,3.8);
  }

  function workSurface(actor, progress) {
    const output = actor.output;
    if (actor.pose === "build") {
      for (let i=0; i<3+Math.floor(progress*5); i++) {
        const layer = Math.floor(i/2), x = 23 + (i%2)*12;
        rect(x,-3-layer*6,11,5,layer%2?"#be9d77":"#d5b994");
      }
      return;
    }
    if (actor.pose === "cook") {
      oval(32,-28,12,3,"#dbb377");
      oval(32,-29,9,3,"#9a583d");
      oval(33,-30,6,2,"#e9a258");
      return;
    }
    if (actor.pose === "forge") {
      polygon([[21,-27],[44,-27],[39,-21],[34,-21],[34,-17],[26,-17],[28,-22]],"#4c514e");
      rect(30,-30,9,3,"#e89051");
      return;
    }
    if (output === "planches") {
      for (let i=0; i<2+Math.floor(progress*4); i++) rect(21+i,-23-i*2.2,36-i*2,2,"#e8be81");
    } else if (output === "charrette") {
      polygon([[20,-35],[55,-35],[50,-25],[25,-25]],"#a8794f");
      rect(20,-36,35,3,"#e6b77d");
      line([[49,-28],[64,-34]],"#7c563e",2.5);
      if (progress>.25) oval(30,-24,4.5,4.5,"#634a38");
      if (progress>.65) oval(47,-24,4.5,4.5,"#634a38");
    } else if (["coffre","lit","banc","etabli","enseigne"].includes(output)) {
      rect(24,-32,32,7,"#d4a271");
      if (output === "coffre") { crate(25,-41,29,16); rect(37,-36,5,5,"#e4bd79"); }
      else {
        rect(26,-25,4,6,"#83563c"); rect(50,-25,4,6,"#83563c");
        if (output === "lit") { rect(27,-36,27,5,"#c0bb92"); rect(27,-38,8,4,"#ece4c8"); }
      }
    }
  }

  function tool(actor, hand, phase) {
    const [x,y] = hand;
    if (actor.pose === "saw") {
      line([[x,y],[x+18,y+1.7]],"#e5ddd0",3.2);
      for(let i=1;i<5;i++) polygon([[x+i*3,y+1],[x+i*3+3,y+1],[x+i*3+2,y+3.4]],"#a9a99b");
    } else if (actor.pose === "load") {
      crate(x-3,y-8,14,12);
    } else if (actor.pose === "cook") {
      line([[x,y],[x+12,y+4]],"#8a5c3e",2); oval(x+13,y+4,3,2,"#a77149");
    } else if (["axe","pickaxe","farm","hammer","forge","build"].includes(actor.pose)) {
      const length = ["axe","pickaxe","farm"].includes(actor.pose) ? 16 : 10;
      const angle = -.5 - Math.sin(phase) * .65;
      pen.save();
      pen.translate(x,y);
      pen.rotate(angle);
      line([[0,0],[length,0]],"#865a3d",2.7);
      if (actor.pose==="axe") polygon([[length-4,-4],[length+4,-6],[length+4,5],[length-3,4]],"#bac2b6");
      else if (actor.pose==="pickaxe") line([[length-5,-6],[length+1,-2],[length+2,3],[length-1,7]],"#b1b9ad",2.7);
      else if (actor.pose==="farm") line([[length,0],[length+3,5],[length-3,5]],"#aab5a6",2.6);
      else rect(length-3,-4,8,8,"#818d82");
      pen.restore();
    }
  }

  function draw(person, actor, time, focused) {
    const x=actor.x, y=ground+actor.lane;
    const front=actor.pose==="idle", walking=actor.pose==="walk";
    const step=TAU*(actor.stride ?? time)*1.28 + person.id;
    const work=TAU*time*.7+person.id;
    const hand = walking ? (actor.cart ? [-10,-18] : [7+Math.sin(step)*5,-17])
      : actor.pose==="saw" ? [21+Math.sin(work)*6,-23]
      : actor.pose==="load" ? [11+Math.sin(work)*4,-21+Math.cos(work)*6]
      : [16+Math.cos(work)*3,-23+Math.sin(work)*9];
    oval(x,y+2,15,3.6,"#4953425e");
    pen.save();
    pen.translate(x, y + (walking ? (actor.limp ? Math.max(0, Math.sin(step)) * 4 : Math.abs(Math.sin(step)) * .85) : 0));
    pen.scale(actor.dir||1,1);
    if(actor.cart) cart(actor.cart,time,walking);
    if(front) {
      line([[-4,-16],[-4,-2]],pants,5); line([[4,-16],[4,-2]],pants,5);
      line([[-7,-2],[-3,-2]],sole,4); line([[3,-2],[7,-2]],sole,4);
      line([[-7,-29],[-11,-17]],person.color,4.5);
      line([[7,-29],[11,-17]],person.color,4.5);
      polygon([[-7,-31],[7,-31],[9,-16],[-9,-16]],person.color);
    } else {
      profileLeg(walking ? step + Math.PI : Math.PI + .18,true);
      polygon([[-6,-31],[4,-31],[6,-16],[-6,-16]],person.color);
      rect(-5,-18,10,2,"#cba76d");
      profileLeg(walking ? step : .18,false);
      line([[1,-28],[2,-22],hand],person.color,4.8);
      oval(...hand,2.7,2.7,person.skin);
      if (!walking) {
        workSurface(actor,actor.progress || 0);
        tool(actor,hand,work);
      }
    }
    face(person,front);
    if (["axe","pickaxe","build"].includes(actor.pose)) {
      rect(-9,-44,19,2.8,person.color);
      polygon([[-7,-44],[-4,-49],[5,-49],[8,-44]],person.color);
    }
    if (["saw","axe","pickaxe","forge"].includes(actor.pose)) {
      for(let i=0;i<4;i++){
        const p=(time*.65+i*.21)%1;
        oval(20+p*17,-23-Math.sin(p*Math.PI)*9+i,1.2,1.1,actor.pose==="forge"?"#f0a953":"#f2cb92");
      }
    }
    pen.restore();
    if (focused) polygon([[x-5,y-63],[x+5,y-63],[x,y-57]],"#394e37");
  }

  return draw;
}
