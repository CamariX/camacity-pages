export const sites = {
  village: {x: 190, name: "Mairie", art: "townHall", anchor: 186},
  "siege-forestier": {x: 520, name: "Forestiers", art: "depot", anchor: 516},
  foret: {x: 1040, name: "Forêt", art: "forest", width: 350},
  atelier: {x: 1580, name: "Menuiserie", art: "workshop", anchor: 1143},
  marche: {x: 1950, name: "Marché", art: "market", anchor: 1484},
  boutique: {x: 2490, name: "Boutique", art: "workshop"},
  carriere: {x: 3300, name: "Carrière", art: "quarry"},
  gisement: {x: 3560, name: "Gisement", art: "extraction", width: 105},
  ferme: {x: 3820, name: "Ferme", art: "farm"},
  champs: {x: 4050, name: "Champs", art: "fields", width: 90},
  cuisine: {x: 4280, name: "Cuisine", art: "kitchen"},
  forge: {x: 4740, name: "Forge", art: "forge"},
  encheres: {x: 4980, name: "Salle des enchères", art: "auction"},
};

const colors = ["#c67450", "#558b64", "#5e849f", "#c19c4a", "#97648b", "#bb674f"];
const skins = ["#d79b72", "#edbb91", "#b77a57", "#f0bc8e", "#c38a62"];

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const coord = (x, y) => `${x},${y}`;
export const constructionPause = 2.5;
export const isWorking = ({task, art}) => Boolean(task || art);

export function nextActivePlayer(players, after) {
  const active = players.filter(isWorking).sort((a, b) => a.id - b.id);
  return active.find(({id}) => id > after) ?? active[0];
}

export function panoramaPosition(start, end, elapsed, duration, worksite) {
  const movingFor = duration - 2.2;
  const traveling = elapsed - 1.35;
  const move = (from, to, time, seconds) => {
    const t = seconds > 0 ? clamp(time / seconds, 0, 1) : 1;
    return lerp(from, to, t * t * (3 - 2 * t));
  };
  if (worksite == null) return {x: move(start, end, traveling, movingFor), paused: false};
  const stop = clamp(worksite, Math.min(start, end), Math.max(start, end));
  const arrival = start === end ? 0 : movingFor * (stop - start) / (end - start);
  if (traveling < arrival) return {x: move(start, stop, traveling, arrival), paused: false};
  if (traveling < arrival + constructionPause) return {x: stop, paused: true};
  return {x: move(stop, end, traveling - arrival - constructionPause, movingFor - arrival), paused: false};
}

function constructionPlaces(scene) {
  const project = scene.construction;
  if (!project?.total) return [];
  const futureSites = project.sites.filter(({id}) => sites[id]);
  const completed = new Set(project.completed);
  const active = new Map(project.active.map((task) => [task.slot, task]));
  const ready = new Set(project.batch && !Object.values(project.batch.materials).some(({missing}) => missing)
    ? project.batch.slots : []);
  return futureSites.map(({id, x: tileX, y: tileY}, index) => {
    const view = sites[id];
    const x = scene.street?.places[id] ?? view.x;
    const width = id === "carriere" ? 400 : 330;
    const height = 196;
    const slots = [];
    for (let slot = index; slot < project.total; slot += futureSites.length) slots.push(slot);
    if (!slots.length) slots.push(index % project.total);
    const rows = Math.max(1, Math.round(Math.sqrt(slots.length * height / width)));
    const cells = [];
    for (let row = 0; row < rows; row++) {
      const count = Math.floor(slots.length / rows) + Number(row < slots.length % rows);
      for (let column = 0; column < count; column++) {
        const slot = slots[cells.length];
        const cellWidth = width / count;
        cells.push({slot, x: x - width / 2 + column * cellWidth, width: cellWidth,
          bottom: row * height / rows, height: height / rows,
          done: completed.has(slot), active: active.get(slot), ready: ready.has(slot)});
      }
    }
    return {...view, name: "Chantier", x, id, tileX, tileY,
      construction: {cells, height, batch: project.batch, completed: completed.size, total: project.total}};
  });
}

export function layout(scene) {
  const places = [];
  const positions = new Map();
  const placeById = new Map();
  for (const site of scene.sites) {
    const view = sites[site.id];
    if (!view) continue;
    const place = {...view, x: scene.street?.places[site.id] ?? view.x, id: site.id};
    if (site.id === "foret") place.wood = scene.forestWood ?? 0;
    if (scene.harvestStocks?.[site.id]) {
      place.harvest = scene.harvestStocks[site.id].map(({item, qty}) => `${qty} ${label(item).toLowerCase()}`).join(" · ");
    }
    if (site.id === "marche") place.marketSigns = scene.marketSigns;
    place.deliverySign = scene.deliverySigns?.[site.id];
    places.push(place);
    positions.set(coord(site.x, site.y), place.x);
    placeById.set(place.id, place);
  }
  const homes = new Map();
  const blocks = new Map();
  for (const player of scene.homes ?? scene.players) {
    const home = player.home;
    homes.set(player.id, home);
    positions.set(coord(player.home_x, player.home_y), home.x);
    if (home.kind === "house") {
      places.push({...home, name: player.home_name === "Abri" ? "Maison" : player.home_name,
        art: "house", owner: player.id, level: player.home_level});
    } else if (!blocks.has(home.building)) {
      const building = {...home, name: `Immeuble ${home.building}`, art: "apartments"};
      blocks.set(home.building, building);
      places.push(building);
    }
  }
  const construction = constructionPlaces(scene);
  for (const place of construction) {
    places.push(place);
    positions.set(coord(place.tileX, place.tileY), place.x);
    placeById.set(`chantier-${place.id}`, place);
  }
  places.sort((a, b) => a.x - b.x);
  return {
    places, positions, placeById, homes, construction, projected: new Map(),
    width: Math.max(880, (places.at(-1)?.x ?? 190) + 340),
  };
}

export function appearance(id, color) {
  return {
    color: color || colors[(id - 1) % colors.length],
    skin: skins[(id - 1) % skins.length],
    hair: id % 2 ? "#4e3025" : "#382f37",
  };
}

export function residence(player, map) {
  const {task} = player;
  const atHome = player.x === player.home_x && player.y === player.home_y && !(task?.path.length > 1);
  const headingHome = task?.kind === "aller" && task.site === "maison";
  return atHome || headingHome ? map.homes.get(player.id) : null;
}

const itemNames = {
  bois: "Bois", planches: "Planches", charrette: "Charrette", charrettes: "Charrettes", pierre: "Pierre",
  minerai: "Minerai", culture: "Cultures", repas: "Repas", festin: "Festin", outil: "Outil",
  lingot: "Lingot", lingots: "Lingots", coffre: "Coffre", lit: "Lit", banc: "Banc",
  enseigne: "Enseigne", etabli: "Établi", fibre: "Fibre", fibres: "Fibres",
  semence: "Semence", cereale: "Céréales", cereales: "Céréales",
};

function label(item) {
  return itemNames[item] || item;
}

function project(position, player, map) {
  const key = coord(...position);
  const exact = map.positions.get(key);
  if (exact !== undefined) return exact;
  if (map.projected.has(key)) return map.projected.get(key);
  let nearest = map.homes.get(player.id).x;
  let distance = Infinity;
  for (const [cell, x] of map.positions) {
    const [mapX, mapY] = cell.split(",").map(Number);
    const delta = Math.abs(mapX - position[0]) + Math.abs(mapY - position[1]);
    if (delta < distance) { distance = delta; nearest = x; }
  }
  map.projected.set(key, nearest);
  return nearest;
}

export function motion(player, map, time, facing) {
  const task = player.task;
  const home = map.homes.get(player.id);
  const current = project([player.x, player.y], player, map);
  const deliveryHome = task?.site?.startsWith("p:") ? map.homes.get(Number(task.site.slice(2))) : null;
  const destination = task?.site === "maison" ? home.x : deliveryHome?.x ?? map.placeById.get(task?.site)?.x;
  const workX = (destination ?? current) + (task?.site === "atelier" ? -7 + player.id % 3 * 19 : player.id % 4 * 11);
  const address = home.kind === "house" ? "Maison individuelle" : `Appartement ${home.unit}`;
  const place = task?.site === "maison" ? address : deliveryHome ? "Domicile du client" : map.placeById.get(task?.site)?.name;
  if (!task) {
    if (player.art && residence(player, map)) {
      return {x: home.x, lane: 0, pose: "idle", title: `${player.art.icon} Crée · ${player.art.title}`};
    }
    if (["recolte", "ramassage"].includes(player.recent?.kind) && player.recent.cargo && time - player.recent.end < 4) {
      return {x: current + 24, lane: -13, pose:"load", dir:facing, cart:player.recent.item === "bois" ? "logs" : "crate",
        title:`Dépose la récolte · ${label(player.recent.item) || "Dépôt"}`};
    }
    return {x: current + (player.id % 5 - 2) * 15, lane: 18 + player.id % 3 * 6, pose: "idle", cart: player.personal_cart ? "empty" : null,
      title: residence(player, map) ? `Chez lui · ${address}` : "Au repos"};
  }
  const movement = task.path.length > 1;
  if (movement) {
    const start = task.street_start ?? project(task.path[0], player, map);
    const end = project(task.path.at(-1), player, map);
    const cart = task.travel?.cart || ["livraison", "recolte", "ramassage"].includes(task.kind);
    const cargo = task.cargo ? (task.item === "bois" ? "logs" : task.item || "crate") : "empty";
    const title = task.phase === "retour"
      ? (task.kind === "ramassage" && task.cargo ? "Ramène la récolte au dépôt"
        : task.kind === "recolte" ? "Rapporte la récolte" : "Ramène la charrette")
      : task.kind === "livraison" ? `Livre ${label(task.item) ?? "du matériel"}`
      : place ? `En route · ${place}` : "En déplacement";
    const moveStart = !task.travel && task.kind === "livraison" && task.delivered_at != null
      ? Math.min(task.delivered_at + 2, task.end - 1) : task.start;
    if (time < moveStart && moveStart > task.start) {
      return {x:start, lane:23 + player.id % 3 * 7, pose:"load", dir:Math.sign(start-end) || facing,
        cart:"empty", title:`Décharge · ${label(task.item) || "Livraison"}`};
    }
    const duration = Math.max(1, task.end - moveStart);
    const traveledFor = clamp(time - moveStart, 0, duration);
    const travel = task.travel;
    const limping = Boolean(travel && traveledFor >= travel.threshold && travel.normal < travel.distance);
    const distance = travel ? travel.speed * (Math.min(traveledFor, travel.threshold)
      + .6 * Math.max(0, traveledFor - travel.threshold)) : 0;
    const progress = travel?.distance ? clamp(distance / travel.distance, 0, 1) : traveledFor / duration;
    return {x: lerp(start, end, progress), lane: 23 + player.id % 3 * 7, pose: start === end ? "idle" : "walk", limp: limping,
      dir: Math.sign(end - start) || facing, cart: cart ? cargo : null, title,
      remaining: Math.max(0, Math.ceil(task.end - time)),
      stride: Math.abs(end - start) * progress / 38};
  }
  const progress = clamp((time - task.start) / Math.max(1, task.end - task.start), 0, 1);
  if (task.kind === "production") {
    const output = Object.keys(task.outputs)[0] || task.recipe;
    const pose = task.site === "cuisine" ? "cook" : task.site === "forge" ? "forge" : output === "planches" ? "saw" : "hammer";
    return {x: workX, lane: -13, pose, dir: 1, output, progress, title: `Fabrique · ${label(output) || "Atelier"}`};
  }
  if (task.kind === "coupe") {
    return {x: workX, lane: 9 + player.id % 3 * 9, pose: "axe", dir: 1, title: "Coupe du bois"};
  }
  if (task.kind === "recolte" || task.kind === "recolte-locale") {
    const pose = task.item === "bois" ? "axe" : task.item === "culture" ? "farm" : "pickaxe";
    const cart = task.kind === "recolte" ? (task.cargo ? (task.item === "bois" ? "logs" : "crate") : "empty") : null;
    return {x: workX, lane: 9, pose, dir: 1, cart,
      title: `Récolte · ${label(task.item) || place}`};
  }
  if (task.kind === "module") {
    for (const site of map.construction) {
      const cell = site.construction.cells.find(({slot}) => slot === task.slot);
      if (cell) return {x: cell.x + cell.width / 2, lane: 10 + player.id % 3 * 5,
        pose: "build", dir: 1, progress, title: `Chantier · Module ${task.slot + 1}`};
    }
    return {x: map.placeById.get("village").x + 112, lane: 10, pose: "build", dir: 1, progress, title: "Construit un module · Mairie"};
  }
  return {x: current, lane: 18, pose: "idle", title: "Au repos"};
}
