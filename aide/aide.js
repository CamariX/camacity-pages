import { createDecor, ground, skyTop } from "./carte-decor.js";
import { createCharacters } from "./carte-personnage.js";
import { appearance, layout, lerp, sites } from "./carte-monde.js";
import { chapters } from "./aide-scenes.js";

const byId = (id) => document.getElementById(id);
const canvas = document.querySelector("canvas");
const pen = canvas.getContext("2d");
const decor = createDecor(pen);
const character = createCharacters(pen, decor);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const player = {id: 1, ...appearance(1)};
const chapterList = byId("chapters");
const panel = byId("panel");
const timeline = byId("position");
const play = byId("play");
const previous = byId("previous");
const next = byId("next");
const clock = byId("clock");
const audio = byId("voice");
const index = chapters.map((chapter) => ({...chapter}));
let total = 0;
for (const chapter of index) {
  chapter.start = total;
  chapter.seconds = chapter.audioDuration ?? chapter.duration;
  total += chapter.seconds;
}
timeline.max = total;

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = className;
  return node;
}

const chapterButtons = index.map((chapter, number) => {
  const button = element("button", chapter.title, "");
  button.type = "button";
  button.addEventListener("click", () => seek(chapter.start, false));
  chapterList.append(button);
  byId("transcript").append(element("li", chapter.narration, ""));
  return button;
});

const baseSites = ["village", "siege-forestier", "foret", "atelier", "marche"];
const world = (built, ready, cutting, market) => {
  const construction = built === "open" ? null : {
    sites: [{id:"carriere", x:5, y:4}], total:3, completed: built === "last" ? [0, 1] : [0],
    active: [],
    batch:{slots: [2], materials:{bois:{missing:ready ? 0 : 4}, planches:{missing:ready ? 0 : 6}}},
  };
  return layout({
    sites: [...baseSites, ...(built === "open" ? ["carriere","gisement"] : [])].map((id, x) => ({id,x,y:0})),
    players: [], construction, marketSigns: market ? [{item:"bois",kind:"A",qty:4}] : [], harvestStocks: cutting ? {foret:[{item:"bois",qty:5}]} : {},
  });
};

let time = 0;
let running = false;
let frame = 0;
let lastTick = 0;
let shownChapter = -1;
let shownShot = -1;
let audioFile = "";
let voiceActive = false;
let voiceAttempt = 0;

function clockText(seconds) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function current() {
  const number = Math.max(0, index.findLastIndex(({start}) => start <= time));
  const chapter = index[number];
  const local = (time - chapter.start) * chapter.duration / chapter.seconds;
  const shot = chapter.shots.findLastIndex(({at}) => at <= local);
  return {number, chapter, shot, local};
}

function syncVoice(chapter) {
  const attempt = ++voiceAttempt;
  if (chapter.audio !== audioFile) {
    audio.pause();
    audioFile = chapter.audio;
    if (audioFile) audio.src = audioFile;
  }
  voiceActive = Boolean(running && audioFile);
  if (!voiceActive) {
    audio.pause();
    return;
  }
  const offset = time - chapter.start;
  if (Math.abs(audio.currentTime - offset) > .05) audio.currentTime = offset;
  audio.play().catch(() => {
    if (attempt === voiceAttempt) voiceActive = false;
  });
}

function paint(shot, fraction) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const pixels = [Math.round(width * dpr), Math.round(height * dpr)];
  if (canvas.width !== pixels[0] || canvas.height !== pixels[1]) {
    [canvas.width, canvas.height] = pixels;
  }
  const map = world(shot.built, shot.ready, shot.cutting, shot.site === "marche");
  const from = sites[shot.from || shot.site].x;
  const destination = sites[shot.site].x;
  const eased = fraction * fraction * (3 - 2 * fraction);
  const tour = reduced.matches ? 1 : eased;
  const actorX = lerp(from, destination, tour);
  const center = from === destination ? destination : lerp(from, destination, tour);
  const scale = Math.max(height / 410, width / (shot.zoom || 840));
  const span = width / scale;
  const top = Math.max(skyTop, ground - height / scale * .78);
  const left = Math.max(-50, Math.min(center - span / 2, map.width - span + 50));
  const viewTime = reduced.matches ? 0 : time;
  pen.setTransform(scale*dpr, 0, 0, scale*dpr, -left*scale*dpr, -top*scale*dpr);
  decor.background(left, span, top, height/scale, viewTime);
  decor.draw(left, left + span, map.places, viewTime);
  if (shot.built === "open") decor.celebration(destination, viewTime, !reduced.matches && running);
  character(player, {
    x: actorX, lane: 20, dir: Math.sign(destination - from) || 1,
    pose: shot.pose || (tour < 1 && from !== destination ? "walk" : "idle"),
    cart: shot.cart, stride: Math.abs(actorX - from) / 38,
  }, viewTime, true);
}

function update() {
  const {number, chapter, shot, local} = current();
  const active = chapter.shots[shot];
  if (number !== shownChapter || shot !== shownShot) {
    const chapterChanged = shownChapter !== number;
    shownChapter = number;
    shownShot = shot;
    byId("chapter-title").textContent = chapter.title;
    byId("caption").textContent = active.caption;
    byId("place").textContent = active.place || sites[active.site].name;
    panel.replaceChildren(element("div", active.tab, "panel-tab"), ...active.rows.map(
      (row, line) => element("div", row, line === 0 ? "panel-action focus" : "panel-action"),
    ));
    chapterButtons.forEach((button, index) => {
      if (index === number) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    previous.disabled = number === 0;
    next.disabled = number === index.length - 1;
    if (chapterChanged) syncVoice(chapter);
  }
  clock.textContent = `${clockText(time)} / ${clockText(total)}`;
  timeline.value = time;
  const until = chapter.shots[shot + 1]?.at ?? chapter.duration;
  paint(active, Math.min(1, (local - active.at) / (until - active.at)));
}

function setRunning(value) {
  running = value;
  cancelAnimationFrame(frame);
  play.textContent = running ? "Pause" : time >= total ? "Rejouer" : time ? "Reprendre" : "Lancer la démo";
  syncVoice(current().chapter);
  if (running) {
    lastTick = performance.now();
    frame = requestAnimationFrame(tick);
  }
}

function tick(timestamp) {
  if (voiceActive) {
    const {chapter} = current();
    if (audio.ended) time = chapter.start + chapter.seconds;
    else if (audio.readyState && !audio.seeking) {
      // Let the narration drive the camera, including when playback buffers.
      time = chapter.start + Math.min(audio.currentTime, chapter.seconds - .001);
    }
  } else {
    time = Math.min(total, time + Math.max(0, timestamp - lastTick) / 1000);
  }
  lastTick = timestamp;
  update();
  if (time < total && running) frame = requestAnimationFrame(tick);
  else setRunning(false);
}

function seek(value, playing = running) {
  time = Math.min(total, Math.max(0, value));
  update();
  setRunning(playing && time < total);
}

play.addEventListener("click", () => seek(time >= total ? 0 : time, !running));
previous.addEventListener("click", () => seek(index[Math.max(0, current().number - 1)].start, false));
next.addEventListener("click", () => seek(index[Math.min(index.length - 1, current().number + 1)].start, false));
timeline.addEventListener("input", () => seek(Number(timeline.value)));
new ResizeObserver(update).observe(canvas);
reduced.addEventListener("change", update);
update();
