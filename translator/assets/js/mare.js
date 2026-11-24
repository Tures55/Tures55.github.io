// Il mare di suono: un campo di barre che ondeggia, giallo (chi parla) che diventa ciano (chi ascolta). Quando suona un messaggio le barre seguono la voce.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const FONDO = 0x07080a, COL = 72, RIGHE = 22, PASSO = 0.62;
const lerp = (a, b, t) => a + (b - a) * t;
// Una posizione della telecamera per tappa: [x, y, z, guarda x, y, z, luce]
const VISTE = [
  [0, 5.4, 17.5, 0, 4.4, 0, 1], [-5, 7.5, 16, 0, 6.2, 0, .6], [9, 6, 13, 3, 6, 0, .3], [-9, 6, 13, -3, 6, 0, .3],
  [0, 11, 14, 0, 5.4, -2, .42], [6, 8, 15, 0, 7, 0, .34], [-6, 8, 15, 0, 7.4, 0, .28], [0, 5, 18, 0, 5.6, 0, .28],
];

export function avviaMare({ canvas, progresso, spettro, tipo }) {
  const tattile = matchMedia('(pointer: coarse)').matches;
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, tattile ? 1.5 : 2));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scena = new THREE.Scene();
  scena.background = new THREE.Color(FONDO);
  scena.fog = new THREE.Fog(FONDO, 13, 34);
  scena.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(r), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(42, 1, 0.5, 120);

  const geo = new RoundedBoxGeometry(0.4, 1, 0.4, 2, 0.12);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.25, envMapIntensity: 0.55 });
  const N = COL * RIGHE, mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.frustumCulled = false;
  scena.add(mesh);
  const giallo = new THREE.Color('#ffd23a'), ciano = new THREE.Color('#14c4cc'), grigio = new THREE.Color('#2c3035');
  const m = new THREE.Matrix4(), c = new THREE.Color(), tinta = new THREE.Color(), h = new Float32Array(N);

  const storia = new Array(60).fill(0); let passo = 0;
  let p = progresso(), mx = 0, my = 0, sx = 0, sy = 0, livello = 0, colore = 0.5;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  function misura() {
    const w = innerWidth, a = innerHeight;
    r.setSize(w, a, false); cam.aspect = w / a;
    cam.fov = w < a ? 58 : 42; cam.updateProjectionMatrix();
  }
  addEventListener('resize', misura); misura();

  let prima = performance.now();
  function quadro(ora) {
    requestAnimationFrame(quadro);
    if (document.hidden) { prima = ora; return; }
    const dt = Math.min(0.05, Math.max(0, (ora - prima) / 1000)), t = ora / 1000; prima = ora;
    p += (progresso() - p) * Math.min(1, dt * 4);
    sx += (mx - sx) * dt * 2; sy += (my - sy) * dt * 2;
    const i = Math.min(VISTE.length - 2, Math.floor(p)), k = Math.min(1, p - i), e = k * k * (3 - 2 * k), a = VISTE[i], b = VISTE[i + 1];
    cam.position.set(lerp(a[0], b[0], e) + sx * 2.2, lerp(a[1], b[1], e) - sy * 1.2, lerp(a[2], b[2], e));
    cam.lookAt(lerp(a[3], b[3], e), lerp(a[4], b[4], e), lerp(a[5], b[5], e));
    const luce = lerp(a[6], b[6], e) * (innerWidth < 760 ? 0.5 : 1) * (1 + livello * 0.1);
    const s = spettro();
    livello += ((s ? 1 : 0) - livello) * dt * 5;
    if (s) {
      let somma = 0; for (let q = 1; q < 48; q++) somma += s[q];
      passo += dt; const ora_v = Math.min(1, Math.pow(somma / 47 / 175, 2));
      while (passo > 0.018) { passo -= 0.018; storia.pop(); storia.unshift(ora_v); }
    } else storia.fill(0);
    const chi = tipo(); // mentre suona il mare prende il colore di chi parla
    colore += ((chi === 'gialla' ? 1 : chi === 'ciano' ? 0 : 0.5) - colore) * dt * 3;
    for (let z = 0, n = 0; z < RIGHE; z++) for (let x = 0; x < COL; x++, n++) {
      const u = x / (COL - 1), px = (x - COL / 2) * PASSO, pz = 3 - z * PASSO * 1.15;
      let alto = 0.35 + 0.55 * (1 + Math.sin(px * 0.55 + t * 0.9 + z * 0.35)) * (0.6 + 0.4 * Math.sin(px * 0.17 - t * 0.5 + z * 0.2)) + 0.25 * Math.sin(px * 1.7 - t * 1.6 - z * 0.6);
      alto = Math.max(0.12, alto);
      if (s) { // la voce parte dal centro e si allarga come un'onda: più lontano = un attimo prima
        const d = Math.hypot(px, pz * 0.8) * 1.5, j = Math.floor(d), v = lerp(storia[Math.min(59, j)], storia[Math.min(59, j + 1)], d - j);
        alto = lerp(alto, 0.14 + v * 3.1 * (0.75 + 0.25 * Math.sin(px * 2.3 + z * 1.9)), livello);
      }
      h[n] += (alto - h[n]) * Math.min(1, dt * 12);
      m.makeScale(1, h[n], 1); m.setPosition(px, 0, pz); mesh.setMatrixAt(n, m);
      const mezzo = Math.min(1, Math.max(0, (u - 0.5) * 3 + 0.5 + Math.sin(z * 0.4 + t * 0.4) * 0.12));
      const q = colore > 0.5 ? mezzo * (1 - (colore - 0.5) * 2) : lerp(mezzo, 1, (0.5 - colore) * 2);
      tinta.lerpColors(giallo, ciano, q);
      c.lerpColors(grigio, tinta, Math.min(1, 0.12 + h[n] * 0.42)).multiplyScalar(luce);
      mesh.setColorAt(n, c);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    r.render(scena, cam);
  }
  requestAnimationFrame(quadro);
}
