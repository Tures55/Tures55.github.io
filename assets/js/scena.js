// Tures 55 Dock — scena 3D del sito: una dock vera all'inizio, poi un volo tra le immagini delle funzioni.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const PAVIMENTO = -3.4;
const FONDO = 0x07080a;
const ACCENTO = '#20c8cf';
const SU = new THREE.Vector3(0, 1, 0);

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const morbido = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

// Grandezza vera delle immagini (larghezza, altezza)
const DIM = {
  vassoio_widget: [559, 336], timer: [409, 310], note: [505, 565], servizi_google: [749, 325],
  vassoio: [559, 336], vassoio_strumenti: [559, 336],
  volume_altoparlanti: [505, 565], volume_microfono: [505, 565], volume_mixer: [505, 565], volume_driver: [505, 565],
  pannello_aspetto: [710, 755], pannello_comportamento: [710, 755], demo: [1560, 640],
};

// Le tappe del volo: posizione, rotazione verso chi arriva, ingombro del contenuto (larghezza, altezza, profondità)
const TAPPE = [
  { pos: [0, 0, 0], ang: 0, box: [21.5, 1.9, 0.4], centro: [0, 0.3, 0] },
  { pos: [-16, 1.6, -28], ang: 0.42, box: [8.4, 3.6, 0.8] },
  { pos: [16, 1.6, -56], ang: -0.42, box: [10.6, 6.3, 1.4] },
  { pos: [-15, 1.0, -84], ang: 0.4, box: [8.8, 5.0, 1] },
  { pos: [14, 1.4, -112], ang: -0.4, box: [11.6, 3.4, 1.2] },
  { pos: [-13, 1.2, -140], ang: 0.38, box: [8.8, 4.4, 0.8] },
  { pos: [0, 1.8, -170], ang: 0, box: [8.8, 6, 1.2] },
];

// Le immagini di ogni tappa: nome, larghezza nella scena, posizione e rotazione dentro la tappa
const PANNELLI = {
  1: [{ video: true, w: 8.2, curva: 11 }],
  2: [
    { img: 'vassoio_widget', w: 5.4 },
    { img: 'timer', w: 2.3, p: [3.95, 1.95, 0.9], ry: -0.32 },
    { img: 'note', w: 2.0, p: [-3.95, 0.85, 0.7], ry: 0.32 },
    { img: 'servizi_google', w: 3.7, p: [2.9, -2.35, 1.1], ry: -0.2 },
  ],
  3: [
    { img: 'vassoio', w: 4.8, p: [-1.8, 1.05, -0.3], ry: 0.14 },
    { img: 'vassoio_strumenti', w: 4.8, p: [1.8, -1.05, 0.5], ry: -0.14 },
  ],
  4: [
    { img: 'volume_altoparlanti', w: 2.7, p: [-4.4, 0, -0.9], ry: 0.4 },
    { img: 'volume_microfono', w: 2.7, p: [-1.47, 0, 0], ry: 0.13 },
    { img: 'volume_mixer', w: 2.7, p: [1.47, 0, 0], ry: -0.13 },
    { img: 'volume_driver', w: 2.7, p: [4.4, 0, -0.9], ry: -0.4 },
  ],
  5: [
    { img: 'pannello_aspetto', w: 3.9, p: [-2.15, 0, 0], ry: 0.2 },
    { img: 'pannello_comportamento', w: 3.9, p: [2.15, 0, -0.5], ry: -0.2 },
  ],
};

// Mattonelle della dock iniziale: sezione (0 sinistra, 1 centro, 2 destra) e tappa a cui portano
const MATTONELLE = [
  { id: 'start', sez: 0, vai: 6 }, { id: 'cartelle', sez: 0, vai: 3 }, { id: 'vassoio', sez: 0, vai: 3 },
  { id: 'browser', sez: 1, vai: 1, aperto: true }, { id: 'posta', sez: 1, vai: 1 }, { id: 'musica', sez: 1, vai: 1, aperto: true },
  { id: 'foto', sez: 1, vai: 1 }, { id: 'codice', sez: 1, vai: 1, aperto: true }, { id: 'terminale', sez: 1, vai: 1 }, { id: 'chat', sez: 1, vai: 1 },
  { id: 'orologio', sez: 2, vai: 2 }, { id: 'calendario', sez: 2, vai: 2 }, { id: 'meteo', sez: 2, vai: 2 }, { id: 'volume', sez: 2, vai: 4 },
  { id: 'cpu', sez: 2, vai: 2 }, { id: 'ram', sez: 2, vai: 2 }, { id: 'timer', sez: 2, vai: 2 }, { id: 'note', sez: 2, vai: 2 }, { id: 'pannello', sez: 2, vai: 5 },
];

const ICONE = {
  browser: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  posta: 'M3.5 6h17v12h-17zM3.5 7l8.5 6 8.5-6',
  musica: 'M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  foto: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M16.5 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
  codice: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  terminale: 'M4 6l6 6-6 6M12 18h8',
  chat: 'M4 5h16v11H9l-5 4z',
  volume: 'M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M10 2h4M12 2v3',
  vassoio: 'M6 15l6-6 6 6',
  cartelle: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  note: 'M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h4',
};
const COLORI = { browser: '#4cc3ff', posta: '#f0a35e', musica: '#ff6b86', foto: '#7ee081', codice: '#a493ff', terminale: '#e3e6ea', chat: '#3fd6a0' };

// ---------- Disegno delle mattonelle (come quelle vere della dock) ----------
const T = 256;
function nuovaTela(w = T, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function fondoTessera(x, d = T) {
  const g = x.createLinearGradient(0, 0, d, d);
  g.addColorStop(0, '#7a7a7a');
  g.addColorStop(1, '#161616');
  x.fillStyle = g;
  x.beginPath(); x.roundRect(0, 0, d, d, d * 0.14); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.16)';
  x.lineWidth = d * 0.012;
  x.beginPath(); x.roundRect(d * 0.006, d * 0.006, d * 0.988, d * 0.988, d * 0.14); x.stroke();
}
function glifo(x, d, colore = '#f4f6f8', scala = 0.5, spessore = 1.8, riempi = null) {
  x.save();
  const k = (T * scala) / 24;
  x.translate(T / 2, T / 2); x.scale(k, k); x.translate(-12, -12);
  const p = new Path2D(d);
  if (riempi) { x.fillStyle = riempi; x.fill(p); }
  x.strokeStyle = colore; x.lineWidth = spessore; x.lineCap = 'round'; x.lineJoin = 'round';
  x.stroke(p);
  x.restore();
}
function scritta(x, s, y, px, colore = '#f4f6f8', peso = 700) {
  x.fillStyle = colore;
  x.font = `${peso} ${px}px "Segoe UI", system-ui, -apple-system, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(s, T / 2, y);
}

function disegnaMattonella(x, id, stato, testi) {
  x.clearRect(0, 0, T, T);
  fondoTessera(x);
  const ora = new Date();
  switch (id) {
    case 'start': scritta(x, '55', 134, 132, '#ffffff', 700); break;
    case 'cartelle': glifo(x, ICONE.cartelle, '#ffd36b', 0.58, 1.3, '#e8a92a'); break;
    case 'vassoio': glifo(x, ICONE.vassoio, '#f4f6f8', 0.6, 2.4); break;
    case 'orologio': {
      x.fillStyle = '#04100e'; x.beginPath(); x.roundRect(26, 26, 204, 204, 24); x.fill();
      x.strokeStyle = 'rgba(63,224,192,0.35)'; x.lineWidth = 3; x.stroke();
      const hh = String(ora.getHours()).padStart(2, '0'), mm = String(ora.getMinutes()).padStart(2, '0');
      scritta(x, testi.giorni[ora.getDay()], 70, 34, '#3fe0c0');
      scritta(x, `${hh}:${mm}`, 130, 70, '#3fe0c0');
      scritta(x, `${String(ora.getDate()).padStart(2, '0')}/${String(ora.getMonth() + 1).padStart(2, '0')}`, 188, 32, '#3fe0c0', 600);
      break;
    }
    case 'calendario': {
      x.save();
      x.beginPath(); x.roundRect(50, 44, 156, 170, 18); x.clip();
      x.fillStyle = '#f4f4f4'; x.fillRect(50, 44, 156, 170);
      x.fillStyle = '#e5484d'; x.fillRect(50, 44, 156, 50);
      x.restore();
      scritta(x, testi.mesi[ora.getMonth()], 70, 32, '#ffffff');
      scritta(x, String(ora.getDate()), 158, 84, '#1b1b1b');
      break;
    }
    case 'meteo': {
      const notte = ora.getHours() >= 19 || ora.getHours() < 7;
      const t = nuovaTela(), y = t.getContext('2d');
      if (notte) {
        y.fillStyle = '#f3e3a6'; y.beginPath(); y.arc(116, 98, 46, 0, Math.PI * 2); y.fill();
        y.globalCompositeOperation = 'destination-out'; y.beginPath(); y.arc(142, 80, 42, 0, Math.PI * 2); y.fill();
      } else {
        y.fillStyle = '#ffd24a'; y.beginPath(); y.arc(128, 96, 30, 0, Math.PI * 2); y.fill();
        y.strokeStyle = '#ffd24a'; y.lineWidth = 9; y.lineCap = 'round';
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          y.beginPath(); y.moveTo(128 + Math.cos(a) * 44, 96 + Math.sin(a) * 44); y.lineTo(128 + Math.cos(a) * 58, 96 + Math.sin(a) * 58); y.stroke();
        }
      }
      x.drawImage(t, 0, 0);
      scritta(x, '19°', 192, 48);
      break;
    }
    case 'cpu': case 'ram': {
      const v = Math.round(stato[id]);
      scritta(x, id.toUpperCase(), 62, 34, '#cfd3d8');
      scritta(x, `${v}%`, 124, 74);
      x.fillStyle = '#2a2d31'; x.beginPath(); x.roundRect(46, 182, 164, 14, 7); x.fill();
      x.fillStyle = ACCENTO; x.beginPath(); x.roundRect(46, 182, Math.max(14, (164 * v) / 100), 14, 7); x.fill();
      break;
    }
    case 'note': glifo(x, ICONE.note, '#4a3b00', 0.58, 1.5, '#f5c84c'); break;
    case 'pannello': {
      x.save(); x.translate(128, 128);
      x.strokeStyle = '#f4f6f8'; x.lineWidth = 13; x.lineCap = 'round';
      x.beginPath(); x.arc(0, 0, 40, 0, Math.PI * 2); x.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        x.beginPath(); x.moveTo(Math.cos(a) * 58, Math.sin(a) * 58); x.lineTo(Math.cos(a) * 72, Math.sin(a) * 72); x.stroke();
      }
      x.beginPath(); x.arc(0, 0, 13, 0, Math.PI * 2); x.stroke();
      x.restore();
      break;
    }
    default: glifo(x, ICONE[id], COLORI[id] || '#f4f6f8', 0.5, 1.8);
  }
}

// ---------- Maschere: angoli arrotondati e riflesso che sfuma ----------
const cacheMaschere = new Map();
function maschera(w, h, riflesso = false) {
  const chiave = `${w.toFixed(2)}x${h.toFixed(2)}${riflesso ? 'r' : ''}`;
  if (cacheMaschere.has(chiave)) return cacheMaschere.get(chiave);
  const W = 512, H = Math.max(32, Math.round((512 * h) / w));
  const c = nuovaTela(W, H), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  if (riflesso) {
    const g = x.createLinearGradient(0, H, 0, H * 0.45);
    g.addColorStop(0, '#888'); g.addColorStop(1, '#000');
    x.fillStyle = g;
  } else x.fillStyle = '#fff';
  x.beginPath(); x.roundRect(0, 0, W, H, (0.12 / w) * W); x.fill();
  const t = new THREE.CanvasTexture(c);
  cacheMaschere.set(chiave, t);
  return t;
}
function texRadiale(colore, forza = 1) {
  const c = nuovaTela(128), x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, colore.replace('A', forza)); g.addColorStop(1, colore.replace('A', 0));
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function avviaScena({ canvas, base, testi, progresso, vaiA, lati, etichetta, fuoco, pronta }) {
  const radice = document.documentElement;
  const tattile = matchMedia('(pointer: coarse)').matches;
  const stretto = matchMedia('(max-width: 860px), (max-aspect-ratio: 1/1)');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, tattile ? 1.6 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scena = new THREE.Scene();
  scena.background = new THREE.Color(FONDO);
  scena.fog = new THREE.Fog(FONDO, 24, 70);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scena.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 320);
  TAPPE.forEach((t, i) => {
    t.lato = lati[i] || 'centro';
    t.vCentro = new THREE.Vector3(...(t.centro || t.pos));
  });

  // ---------- Pavimento, luci soffuse e polvere ----------
  const griglia = new THREE.GridHelper(700, 350, 0x1d232a, 0x13171c);
  griglia.position.set(0, PAVIMENTO, -90);
  griglia.material.transparent = true;
  griglia.material.opacity = 0.6;
  griglia.material.depthWrite = false;
  scena.add(griglia);

  const alone = texRadiale('rgba(32,200,207,A)', 1);
  function pozza(x, z, sx, sz, opacita) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
      map: alone, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: opacita, toneMapped: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, PAVIMENTO + 0.02, z);
    m.scale.set(sx, sz, 1);
    scena.add(m);
  }
  TAPPE.forEach((t, i) => pozza(t.pos[0], t.pos[2], i === 0 ? 34 : 20, i === 0 ? 12 : 12, i === 0 ? 0.32 : 0.2));

  const punto = texRadiale('rgba(255,255,255,A)', 1);
  const N = tattile ? 450 : 900;
  const posizioni = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    posizioni[i * 3] = (Math.random() - 0.5) * 90;
    posizioni[i * 3 + 1] = PAVIMENTO + Math.random() * 20;
    posizioni[i * 3 + 2] = 30 - Math.random() * 240;
  }
  const geoPolvere = new THREE.BufferGeometry();
  geoPolvere.setAttribute('position', new THREE.BufferAttribute(posizioni, 3));
  const polvere = new THREE.Points(geoPolvere, new THREE.PointsMaterial({
    size: 0.08, map: punto, color: 0xbff4f7, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scena.add(polvere);

  // ---------- Materiali condivisi ----------
  const matCorpo = new THREE.MeshStandardMaterial({ color: 0x24262a, metalness: 0.65, roughness: 0.3 });
  const geoCorpo = new RoundedBoxGeometry(1, 1, 0.3, 4, 0.13);
  const geoFaccia = new THREE.PlaneGeometry(0.92, 0.92);
  const geoSpia = new THREE.PlaneGeometry(0.26, 0.05);
  const matSpia = new THREE.MeshBasicMaterial({ color: ACCENTO, toneMapped: false });

  // ---------- La dock iniziale ----------
  const stato = { cpu: 18, ram: 38 };
  const tele = {};
  function texMattonella(id) {
    if (tele[id]) return tele[id].tex;
    const c = nuovaTela(), x = c.getContext('2d');
    disegnaMattonella(x, id, stato, testi);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    tele[id] = { x, tex };
    return tex;
  }
  function ridisegna(id) { if (!tele[id]) return; disegnaMattonella(tele[id].x, id, stato, testi); tele[id].tex.needsUpdate = true; }
  function creaMattonella(id, dati) {
    const g = new THREE.Group();
    const corpo = new THREE.Mesh(geoCorpo, matCorpo);
    const faccia = new THREE.Mesh(geoFaccia, new THREE.MeshBasicMaterial({ map: texMattonella(id), transparent: true, toneMapped: false }));
    faccia.position.z = 0.152;
    corpo.userData = faccia.userData = dati;
    g.add(corpo, faccia);
    return g;
  }

  const dock = new THREE.Group();
  dock.position.set(...TAPPE[0].pos);
  dock.rotation.x = -0.06;
  scena.add(dock);
  const PASSO = 0.07, STACCO = 0.38;
  const tessere = MATTONELLE.map((m) => {
    const g = creaMattonella(m.id, { mattonella: m });
    if (m.aperto) {
      const s = new THREE.Mesh(geoSpia, matSpia);
      s.position.set(0, -0.6, 0.1);
      g.add(s);
    }
    dock.add(g);
    return { m, g, s: 1 };
  });
  // posizioni a riposo, per calcolare l'ingrandimento senza farlo tremare
  let cursore = 0;
  tessere.forEach((t, i) => {
    if (i > 0) cursore += PASSO + (t.m.sez !== tessere[i - 1].m.sez ? STACCO : 0);
    t.x0 = cursore + 0.5;
    cursore += 1;
  });
  const larghezzaDock = cursore;
  tessere.forEach((t) => { t.x0 -= larghezzaDock / 2; });

  // ---------- Pannelli con le immagini ----------
  const loader = new THREE.TextureLoader();
  const cliccabili = [];
  const gruppiTappa = [];
  const matRetro = new THREE.MeshBasicMaterial({ color: 0x15171b, toneMapped: false });
  let video = null, schermoVideo = null;

  function creaPannello(conf, gruppo, yTappa) {
    const [iw, ih] = DIM[conf.video ? 'demo' : conf.img];
    const w = conf.w, h = (w * ih) / iw;
    const geo = new THREE.PlaneGeometry(w, h, conf.curva ? 48 : 1, 1);
    if (conf.curva) {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, (p.getX(i) * p.getX(i)) / (2 * conf.curva));
      p.needsUpdate = true;
      geo.computeBoundingSphere();
    }
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a1c20, alphaMap: maschera(w, h), transparent: true, toneMapped: false });
    const matRifl = new THREE.MeshBasicMaterial({ color: 0x1a1c20, alphaMap: maschera(w, h, true), transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const metti = (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      for (const m of [mat, matRifl]) { m.map = tex; m.color.set(0xffffff); m.needsUpdate = true; }
    };
    loader.load(base + (conf.video ? 'assets/video/demo.jpg' : `assets/img/${conf.img}.webp`), metti);

    const pg = new THREE.Group();
    const [px, py, pz] = conf.p || [0, 0, 0];
    pg.position.set(px, py, pz);
    pg.rotation.y = conf.ry || 0;
    const fronte = new THREE.Mesh(geo, mat);
    const retro = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x15171b, alphaMap: mat.alphaMap, transparent: true, toneMapped: false }));
    retro.rotation.y = Math.PI;
    retro.position.z = conf.curva ? -0.02 : -0.015;
    pg.add(fronte, retro);
    gruppo.add(pg);

    const rifl = new THREE.Mesh(geo, matRifl);
    const yPav = PAVIMENTO - yTappa;
    rifl.position.set(px, 2 * yPav - py, pz);
    rifl.rotation.y = conf.ry || 0;
    rifl.scale.y = -1;
    gruppo.add(rifl);

    fronte.userData = { pannello: { pg, w, h } };
    cliccabili.push(fronte);

    if (conf.video) {
      video = document.createElement('video');
      Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'none', crossOrigin: 'anonymous' });
      video.setAttribute('muted', '');
      video.src = base + 'assets/video/demo.mp4';
      const vtex = new THREE.VideoTexture(video);
      video.addEventListener('playing', () => metti(vtex), { once: true });
      schermoVideo = fronte;
    }
    return pg;
  }

  for (let i = 1; i < TAPPE.length; i++) {
    const t = TAPPE[i];
    const g = new THREE.Group();
    g.position.set(...t.pos);
    g.rotation.y = t.ang;
    scena.add(g);
    gruppiTappa[i] = g;
    // un alone dietro ogni tappa, per dare profondità
    const dietro = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), new THREE.MeshBasicMaterial({
      map: alone, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.09, toneMapped: false,
    }));
    dietro.position.z = -3;
    g.add(dietro);
    (PANNELLI[i] || []).forEach((conf) => creaPannello(conf, g, t.pos[1]));
  }

  // ---------- Ultima tappa: il 55 che galleggia, con le mattonelle in orbita ----------
  const logo = new THREE.Group();
  gruppiTappa[6].add(logo);
  const telaLogo = nuovaTela(512), xl = telaLogo.getContext('2d');
  fondoTessera(xl, 512);
  xl.fillStyle = '#fff';
  xl.font = '700 290px "Segoe UI", system-ui, -apple-system, sans-serif';
  xl.textAlign = 'center'; xl.textBaseline = 'middle';
  xl.fillText('55', 256, 268);
  const texLogo = new THREE.CanvasTexture(telaLogo);
  texLogo.colorSpace = THREE.SRGBColorSpace;
  texLogo.anisotropy = aniso;
  const corpoLogo = new THREE.Mesh(new RoundedBoxGeometry(3.4, 3.4, 0.6, 6, 0.3), matCorpo);
  const facciaLogo = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 3.12), new THREE.MeshBasicMaterial({ map: texLogo, transparent: true, toneMapped: false }));
  facciaLogo.position.z = 0.302;
  const retroLogo = facciaLogo.clone();
  retroLogo.rotation.y = Math.PI;
  retroLogo.position.z = -0.302;
  corpoLogo.userData = facciaLogo.userData = retroLogo.userData = { logo: true };
  logo.add(corpoLogo, facciaLogo, retroLogo);
  cliccabili.push(corpoLogo, facciaLogo, retroLogo);

  const anello = new THREE.Group();
  anello.rotation.x = 0.42;
  anello.rotation.z = -0.12;
  gruppiTappa[6].add(anello);
  const inOrbita = ['orologio', 'calendario', 'meteo', 'volume', 'cpu', 'ram', 'timer', 'note', 'pannello', 'cartelle', 'vassoio', 'musica'].map((id, i, tutti) => {
    const g = creaMattonella(id, {});
    g.scale.setScalar(0.62);
    const a = (i / tutti.length) * Math.PI * 2;
    g.position.set(Math.cos(a) * 3.9, 0, Math.sin(a) * 3.9);
    anello.add(g);
    return g;
  });
  let giro = 0;

  // ---------- Inquadrature ----------
  const fuori = { pos: new THREE.Vector3(), target: new THREE.Vector3(), ox: 0, oy: 0, roll: 0 };
  const A = { pos: new THREE.Vector3(), target: new THREE.Vector3(), ox: 0, oy: 0 };
  const B = { pos: new THREE.Vector3(), target: new THREE.Vector3(), ox: 0, oy: 0 };
  const F = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  const direzione = new THREE.Vector3();

  function inquadra(i, out) {
    const t = TAPPE[i];
    const st = stretto.matches;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    let fw, fh, ox = 0, oy = 0, ang = t.ang, alto = 0.16;
    if (i === 0) {
      // la dock va nello spazio libero sotto i testi dell'inizio
      fh = Math.max(0.08, eroe.libero * 0.8);
      oy = eroe.oy;
      if (st) { fw = 1.5; ang = 0.5; alto = 0.3; } else { fw = 0.86; alto = 0.22; }
    } else if (st) { fw = 0.92; fh = t.mob?.fh ?? 0.4; oy = t.mob?.oy ?? 0.42; }
    else { fw = 0.5; fh = 0.7; ox = (t.lato === 'sinistra' ? -1 : 1) * 0.44; oy = 0.02; }
    const [w, h, p] = t.box;
    const d = Math.max(h / (2 * tanV * fh), w / (2 * tanV * camera.aspect * fw)) + p / 2;
    direzione.set(Math.sin(ang), alto, Math.cos(ang)).normalize();
    out.target.copy(t.vCentro);
    out.pos.copy(t.vCentro).addScaledVector(direzione, d);
    out.ox = ox; out.oy = oy;
  }

  function statoDaProgresso(f) {
    const n = TAPPE.length - 1;
    f = Math.min(Math.max(f, 0), n);
    const i = Math.min(Math.floor(f), n - 1), t = f - i;
    const e = morbido(clamp01((t - 0.1) / 0.8));
    inquadra(i, A); inquadra(i + 1, B);
    fuori.pos.lerpVectors(A.pos, B.pos, e);
    fuori.pos.y += Math.sin(Math.PI * e) * (1.5 + A.pos.distanceTo(B.pos) * 0.04);
    fuori.target.lerpVectors(A.target, B.target, morbido(clamp01((t - 0.06) / 0.8)));
    fuori.ox = lerp(A.ox, B.ox, e);
    fuori.oy = lerp(A.oy, B.oy, e);
    fuori.roll = Math.sin(Math.PI * e) * 0.07 * Math.sign(B.pos.x - A.pos.x);
  }

  // ---------- Mouse, tocco e modalità «da vicino» ----------
  const raggio = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let mosso = false, sopraConsentito = false;
  let premuto = null, trascina = false;
  let yaw = 0, pitch = 0, parX = 0, parY = 0;
  let sopraTessera = null, sopraPannello = null;
  let inFuoco = null, kFuoco = 0, yFuoco = 0;
  let rotazioneLogo = 0;

  const ESCLUSI = 'a, button, summary, details, input, .testo, .dock-nav, .testata, .blocco, .piede';
  const consentito = (e) => !(e.target instanceof Element && e.target.closest(ESCLUSI));
  function aNdc(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  function colpito() {
    raggio.setFromCamera(ndc, camera);
    const bersagli = cliccabili.concat(progressoAttuale < 0.6 ? tessere.flatMap((t) => t.g.children) : []);
    return raggio.intersectObjects(bersagli, false)[0]?.object || null;
  }

  function entraFuoco(mesh) {
    inFuoco = mesh;
    yFuoco = scrollY;
    const { w, h, pg } = mesh.userData.pannello;
    const st = stretto.matches;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const s = pg.scale.x;
    const d = Math.max((h * s) / (2 * tanV * (st ? 0.6 : 0.82)), (w * s) / (2 * tanV * camera.aspect * (st ? 0.94 : 0.86)));
    mesh.getWorldPosition(F.target);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
    F.pos.copy(F.target).addScaledVector(n, d + 0.2);
    radice.classList.add('in-fuoco');
    fuoco.hidden = false;
  }
  function esciFuoco() {
    if (!inFuoco) return;
    inFuoco = null;
    radice.classList.remove('in-fuoco');
    fuoco.hidden = true;
  }
  fuoco.querySelector('.fuoco-chiudi').addEventListener('click', esciFuoco);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') esciFuoco(); });
  addEventListener('wheel', () => { if (inFuoco && kFuoco > 0.6) esciFuoco(); }, { passive: true });

  function clic(e) {
    if (inFuoco) { esciFuoco(); return; }
    aNdc(e);
    const o = colpito();
    if (!o) return;
    if (o.userData.mattonella) vaiA(o.userData.mattonella.vai);
    else if (o.userData.pannello) entraFuoco(o);
    else if (o.userData.logo) rotazioneLogo += Math.PI * 2;
  }

  addEventListener('pointermove', (e) => {
    sopraConsentito = consentito(e);
    if (e.pointerType === 'mouse') {
      aNdc(e);
      mosso = true;
      if (premuto && !inFuoco) {
        const dx = e.clientX - premuto.x, dy = e.clientY - premuto.y;
        if (!trascina && Math.hypot(dx, dy) > 6) { trascina = true; radice.classList.add('trascina'); }
        if (trascina) {
          yaw = Math.max(-0.9, Math.min(0.9, premuto.yaw + dx * 0.004));
          pitch = Math.max(-0.35, Math.min(0.35, premuto.pitch + dy * 0.003));
        }
      }
    }
  }, { passive: true });
  addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !consentito(e)) return;
    premuto = { x: e.clientX, y: e.clientY, t: performance.now(), yaw, pitch, tipo: e.pointerType };
    if (e.pointerType === 'mouse') e.preventDefault();
  });
  addEventListener('pointerup', (e) => {
    if (!premuto) return;
    const lontano = Math.hypot(e.clientX - premuto.x, e.clientY - premuto.y);
    const breve = performance.now() - premuto.t < 500;
    if (!trascina && lontano < 10 && (premuto.tipo === 'mouse' || breve)) clic(e);
    premuto = null;
    trascina = false;
    radice.classList.remove('trascina');
  });
  addEventListener('pointercancel', () => { premuto = null; trascina = false; radice.classList.remove('trascina'); });
  document.addEventListener('pointerleave', () => { ndc.set(9, 9); mosso = true; });

  // ---------- Dimensioni ----------
  const eroe = { oy: -0.42, libero: 0.4 };
  function misuraEroe() {
    const vh = canvas.clientHeight || innerHeight;
    const testo = document.querySelector('.eroe .testo').getBoundingClientRect();
    const sugg = document.querySelector('.eroe .suggerimento').getBoundingClientRect();
    const sopra = testo.bottom + scrollY + 12;
    const sotto = (sugg.height ? Math.min(sugg.top + scrollY, vh) : vh) - 12;
    const centro = sotto > sopra ? (sopra + sotto) / 2 : vh * 0.72;
    eroe.oy = 1 - (2 * centro) / vh;
    eroe.libero = Math.max(0, sotto - sopra) / vh;
  }
  // su telefono il testo sta in basso: le immagini vanno nello spazio libero sopra la sua scheda
  function misuraTappe() {
    const vh = canvas.clientHeight || innerHeight;
    for (let i = 1; i < TAPPE.length; i++) {
      const s = document.querySelector(`[data-tappa="${i}"]`);
      const scheda = s?.querySelector('.testo');
      if (!scheda) continue;
      const altoScheda = (vh - s.offsetHeight) / 2 + scheda.offsetTop;
      const sopra = 64, sotto = altoScheda - 14;
      const libero = Math.max(0.16 * vh, sotto - sopra);
      TAPPE[i].mob = { oy: 1 - (2 * (sopra + libero / 2)) / vh, fh: (libero / vh) * 0.86 };
    }
  }
  function ridimensiona() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = stretto.matches ? 52 : 40;
    camera.updateProjectionMatrix();
    misuraEroe();
    misuraTappe();
  }
  new ResizeObserver(ridimensiona).observe(canvas);
  new ResizeObserver(misuraEroe).observe(document.querySelector('.eroe .testo'));
  new ResizeObserver(misuraTappe).observe(document.querySelector('main'));
  ridimensiona();

  // ---------- Animazione ----------
  const orologio = new THREE.Clock();
  const pianoDock = new THREE.Plane();
  const punto3 = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const vec = new THREE.Vector3();
  const destra = new THREE.Vector3();
  let progressoAttuale = 0;
  let dockX = null, fermo = 0, ondaT = 0;
  let ultimoMinuto = -1, ultimoCarico = 0;
  let primo = true;

  function aggiornaDock(dt) {
    // dove punta il mouse sulla dock?
    dockX = null;
    if (!inFuoco && progressoAttuale < 0.5 && sopraConsentito && ndc.x < 2) {
      raggio.setFromCamera(ndc, camera);
      pianoDock.setFromNormalAndCoplanarPoint(vec.set(0, 0, 1).applyQuaternion(dock.quaternion), dock.position);
      if (raggio.ray.intersectPlane(pianoDock, punto3)) {
        dock.worldToLocal(punto3);
        if (punto3.y > -0.9 && punto3.y < 2.3 && Math.abs(punto3.x) < larghezzaDock / 2 + 1.2) dockX = punto3.x;
      }
    }
    let px = dockX, forza = 1;
    if (px === null) {
      // nessuno la tocca: ogni tanto passa un'onda da sola, per far capire che è viva
      fermo += dt;
      if (fermo > 2.5) {
        ondaT = (ondaT + dt) % 8;
        if (ondaT < 3.4) { px = lerp(-larghezzaDock / 2 - 2, larghezzaDock / 2 + 2, ondaT / 3.4); forza = 0.5; }
      }
    } else { fermo = 0; ondaT = 0; }

    const k = 1 - Math.exp(-dt * 12);
    for (const t of tessere) {
      let obiettivo = 1;
      if (px !== null) { const d = t.x0 - px; obiettivo = 1 + 0.85 * forza * Math.exp(-(d * d) / (2 * 1.25 * 1.25)); }
      t.s += (obiettivo - t.s) * k;
    }
    let c = 0;
    tessere.forEach((t, i) => {
      if (i > 0) c += PASSO + (t.m.sez !== tessere[i - 1].m.sez ? STACCO : 0);
      t.x = c + t.s / 2;
      c += t.s;
    });
    for (const t of tessere) {
      t.g.position.set(t.x - c / 2, (t.s - 1) * 0.5, (t.s - 1) * 0.25);
      t.g.scale.setScalar(t.s);
    }
  }

  function vivi(tempo) {
    const ora = new Date();
    if (ora.getMinutes() !== ultimoMinuto) {
      ultimoMinuto = ora.getMinutes();
      ['orologio', 'calendario', 'meteo'].forEach(ridisegna);
    }
    if (tempo - ultimoCarico > 2.4) {
      ultimoCarico = tempo;
      stato.cpu = Math.max(4, Math.min(80, stato.cpu + (Math.random() - 0.5) * 14));
      stato.ram = Math.max(30, Math.min(62, stato.ram + (Math.random() - 0.5) * 4));
      ridisegna('cpu'); ridisegna('ram');
    }
  }

  function fotogramma() {
    const dt = Math.min(orologio.getDelta(), 0.05);
    const tempo = orologio.elapsedTime;
    progressoAttuale = progresso();

    // dove sta la telecamera
    statoDaProgresso(progressoAttuale);
    if (!trascina) { const r = Math.exp(-dt * 1.6); yaw *= r; pitch *= r; }
    const mx = tattile || ndc.x > 2 ? 0 : ndc.x, my = tattile || ndc.x > 2 ? 0 : ndc.y;
    const kp = 1 - Math.exp(-dt * 2.5);
    parX += (mx - parX) * kp; parY += (my - parY) * kp;
    const finale = progressoAttuale > TAPPE.length - 1.05 ? Math.sin(tempo * 0.18) * 0.1 : 0;
    vec.subVectors(fuori.pos, fuori.target);
    vec.applyAxisAngle(SU, -(yaw + parX * 0.08 + finale));
    destra.crossVectors(vec, SU).normalize();
    vec.applyAxisAngle(destra, pitch + parY * 0.05);
    fuori.pos.copy(fuori.target).add(vec);

    // da vicino su un'immagine
    if (inFuoco && Math.abs(scrollY - yFuoco) > 60) esciFuoco();
    kFuoco += ((inFuoco ? 1 : 0) - kFuoco) * (1 - Math.exp(-dt * 4));
    const kf = morbido(clamp01(kFuoco));
    camera.position.lerpVectors(fuori.pos, F.pos, kf);
    vec.lerpVectors(fuori.target, F.target, kf);
    camera.up.copy(SU);
    camera.lookAt(vec);
    // la nebbia comincia subito dopo ciò che si sta guardando: quello è nitido, il resto sfuma nel buio
    const vista = camera.position.distanceTo(vec);
    scena.fog.near = vista + 4;
    scena.fog.far = vista + 32;
    camera.rotateZ(fuori.roll * (1 - kf));
    const W = canvas.clientWidth, H = canvas.clientHeight;
    camera.setViewOffset(W, H, -fuori.ox * (1 - kf) * W / 2, fuori.oy * (1 - kf) * H / 2, W, H);

    // cosa c'è sotto il mouse
    if (mosso && !tattile) {
      mosso = false;
      const o = sopraConsentito && !trascina ? colpito() : null;
      sopraTessera = o?.userData.mattonella ? tessere.find((t) => t.m === o.userData.mattonella) : null;
      sopraPannello = o?.userData.pannello ? o.userData.pannello.pg : null;
      radice.classList.toggle('puntatore', !!o || !!inFuoco);
    }
    for (const g of gruppiTappa) {
      if (!g) continue;
      for (const pg of g.children) {
        if (!pg.isGroup) continue;
        const obiettivo = pg === sopraPannello && !inFuoco ? 1.035 : 1;
        pg.scale.setScalar(pg.scale.x + (obiettivo - pg.scale.x) * (1 - Math.exp(-dt * 10)));
      }
    }

    aggiornaDock(dt);
    vivi(tempo);

    // etichetta della mattonella
    if (sopraTessera && !inFuoco && progressoAttuale < 0.5) {
      sopraTessera.g.getWorldPosition(vec);
      vec.y += sopraTessera.s * 0.5 + 0.28;
      vec.project(camera);
      const r = canvas.getBoundingClientRect();
      etichetta.textContent = testi.mattonelle[sopraTessera.m.id] || '';
      etichetta.style.left = `${((vec.x + 1) / 2) * r.width + r.left}px`;
      etichetta.style.top = `${((1 - vec.y) / 2) * r.height + r.top}px`;
      etichetta.hidden = false;
    } else etichetta.hidden = true;

    // il 55 e le mattonelle in orbita
    giro += (rotazioneLogo - giro) * (1 - Math.exp(-dt * 2.2));
    logo.rotation.y = Math.sin(tempo * 0.4) * 0.35 + giro;
    logo.position.y = Math.sin(tempo * 0.8) * 0.15;
    anello.rotation.y += dt * 0.16;
    anello.getWorldQuaternion(tmpQ).invert().multiply(camera.quaternion);
    for (const g of inOrbita) g.quaternion.copy(tmpQ);

    polvere.rotation.y = Math.sin(tempo * 0.03) * 0.04;
    polvere.position.y = Math.sin(tempo * 0.12) * 0.4;

    // il filmato gira solo quando è vicino
    if (video) {
      const vicino = Math.abs(progressoAttuale - 1) < 0.8 || inFuoco === schermoVideo;
      if (vicino && video.paused) { video.preload = 'auto'; video.play().catch(() => {}); }
      else if (!vicino && !video.paused) video.pause();
    }

    renderer.render(scena, camera);
    if (primo) { primo = false; pronta(); }
    requestAnimationFrame(fotogramma);
  }
  requestAnimationFrame(fotogramma);
}
