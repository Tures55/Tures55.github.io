// Tures55 Translator — sito: navigazione, ascolto dei messaggi, versione dal rilascio GitHub, scena 3D.
const radice = document.documentElement;
const testi = JSON.parse(document.getElementById('testi-js').textContent);
const base = new URL('../../', import.meta.url).href;
const tappe = [...document.querySelectorAll('[data-tappa]')].sort((a, b) => a.dataset.tappa - b.dataset.tappa);
const vociNav = [...document.querySelectorAll('.dock-nav a')];
const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Avanzamento tra le tappe ----------
let centri = [];
function misura() {
  const massimo = document.documentElement.scrollHeight - innerHeight;
  centri = tappe.map((s, i) => i ? Math.min(massimo, Math.max(0, s.getBoundingClientRect().top + scrollY + Math.min(0, s.offsetHeight / 2 - innerHeight / 2))) : 0);
}
function progresso() {
  const y = scrollY;
  for (let i = 0; i < centri.length - 1; i++) if (y < centri[i + 1]) return i + Math.max(0, y - centri[i]) / Math.max(1, centri[i + 1] - centri[i]);
  return centri.length - 1;
}
document.querySelectorAll('[data-vai]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  scrollTo({ top: centri[Number(a.dataset.vai)] ?? 0, behavior: ridotto ? 'auto' : 'smooth' });
  history.replaceState(null, '', a.getAttribute('href'));
}));

const nav = document.querySelector('.dock-nav');
nav.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  for (const a of vociNav) {
    const r = a.getBoundingClientRect(), d = e.clientX - (r.left + r.width / 2);
    a.style.setProperty('--s', (1 + 0.5 * Math.exp(-(d * d) / 7200)).toFixed(3));
  }
});
nav.addEventListener('pointerleave', () => vociNav.forEach((a) => a.style.setProperty('--s', '1')));

let inAttesa = false;
function aggiorna() {
  inAttesa = false;
  radice.classList.toggle('oltre-eroe', scrollY > innerHeight * 0.45);
  const attiva = Math.round(progresso());
  vociNav.forEach((a) => a.classList.toggle('attiva', Number(a.dataset.vai) === attiva));
  for (const s of tappe) { // ogni tappa sfuma solo quando è quasi fuori dallo schermo: si legge sempre bene
    const r = s.getBoundingClientRect(), visibile = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    s.style.setProperty('--vis', Math.max(0, Math.min(1, visibile / (Math.min(innerHeight, r.height) * 0.45))).toFixed(3));
  }
}
const pianifica = () => { if (!inAttesa) { inAttesa = true; requestAnimationFrame(aggiorna); } };
addEventListener('scroll', pianifica, { passive: true });
addEventListener('resize', () => { misura(); pianifica(); });
new ResizeObserver(() => { misura(); pianifica(); }).observe(document.querySelector('main'));
misura(); aggiorna();

// ---------- Ascolto: un solo audio alla volta, l'onda si riempie, la scena 3D segue la voce ----------
const audio = new Audio();
audio.preload = 'none';
let bollaAttiva = null, contesto = null, analizzatore = null, dati = null;
function collega() {
  if (analizzatore || !window.AudioContext) return;
  try {
    contesto = new AudioContext();
    const sorgente = contesto.createMediaElementSource(audio);
    analizzatore = contesto.createAnalyser(); analizzatore.fftSize = 256; analizzatore.smoothingTimeConstant = 0.75;
    dati = new Uint8Array(analizzatore.frequencyBinCount);
    sorgente.connect(analizzatore); analizzatore.connect(contesto.destination);
  } catch {}
}
const spettro = () => { if (!analizzatore || audio.paused) return null; analizzatore.getByteFrequencyData(dati); return dati; };
function etichetta(b, inCorso) {
  b.classList.toggle('in-corso', inCorso);
  // la tessera della lingua che sta suonando mostra il segno di pausa: un altro clic la ferma
  if (b.closest('#tradotta')) document.querySelectorAll('.tessera').forEach((t) => t.classList.toggle('suona-ora', inCorso && t.getAttribute('aria-pressed') === 'true'));
  b.querySelector('.suona-testo').textContent = `${inCorso ? testi.ferma : testi.ascolta}: ${b.querySelector('.bolla-nome').textContent}`;
}
function pulisci(b) { etichetta(b, false); b.querySelectorAll('.onda i').forEach((i) => i.classList.remove('gia')); }
function ferma() { audio.pause(); if (bollaAttiva) pulisci(bollaAttiva); bollaAttiva = null; }
function suona(b) {
  if (bollaAttiva === b) return ferma();
  ferma(); collega(); contesto?.resume();
  bollaAttiva = b; etichetta(b, true);
  audio.src = new URL(b.dataset.audio, location.href).href;
  audio.play().catch((e) => { if (e.name !== 'AbortError') ferma(); }); // AbortError = intanto è partito un altro audio
}
document.querySelectorAll('.bolla').forEach((b) => { etichetta(b, false); b.querySelector('.suona').addEventListener('click', () => suona(b)); });
audio.addEventListener('ended', ferma);
(function giro() {
  if (bollaAttiva && audio.duration) {
    const b = bollaAttiva.querySelectorAll('.onda i'), n = (audio.currentTime / audio.duration) * b.length;
    b.forEach((i, k) => i.classList.toggle('gia', k < n));
  }
  requestAnimationFrame(giro);
})();

// ---------- Le tessere delle lingue ----------
const tradotta = document.querySelector('#tradotta .bolla');
document.querySelectorAll('.tessera').forEach((t) => t.addEventListener('click', () => {
  const l = t.dataset.lingua, e = testi.esempi[l];
  if (bollaAttiva === tradotta && t.getAttribute('aria-pressed') === 'true') return ferma(); // secondo clic: basta così
  ferma();
  document.querySelectorAll('.tessera').forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
  tradotta.dataset.audio = `${base}assets/audio/${e.f}`;
  tradotta.querySelector('[data-nome-lingua]').textContent = testi.nomi[l];
  const p = tradotta.querySelector('.bolla-testo'); p.lang = l; p.textContent = e.t;
  tradotta.querySelector('.durata').textContent = `0:${String(Math.round(e.s)).padStart(2, '0')}`;
  tradotta.querySelectorAll('.onda i').forEach((i, k) => i.style.setProperty('--h', Math.max(8, e.o[k])));
  suona(tradotta);
}));

// ---------- Versione e peso dall'ultimo rilascio ----------
(async () => {
  try {
    let d = null;
    try { d = JSON.parse(sessionStorage.getItem('t55-translator') || 'null'); } catch {}
    if (!d) {
      const r = await fetch('https://api.github.com/repos/Tures55/voice-message-translator-windows/releases/latest', { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) return;
      const j = await r.json(), f = (j.assets || []).find((a) => a.name === 'Tures55-Translator-Setup.exe');
      d = { v: String(j.tag_name || '').replace(/^v/, ''), mb: f ? Math.round(f.size / 1e6) : null };
      try { sessionStorage.setItem('t55-translator', JSON.stringify(d)); } catch {}
    }
    if (d.v) document.querySelectorAll('[data-versione]').forEach((e) => { e.textContent = d.v; });
    if (d.mb) document.querySelectorAll('[data-peso]').forEach((e) => { e.textContent = d.mb; });
  } catch {}
})();

// ---------- Scena 3D ----------
if (radice.classList.contains('js3d')) {
  try {
    const { avviaMare } = await import(new URL('./mare.js' + new URL(import.meta.url).search, import.meta.url).href);
    avviaMare({ canvas: document.getElementById('scena'), progresso, spettro, tipo: () => (bollaAttiva ? (bollaAttiva.classList.contains('gialla') ? 'gialla' : 'ciano') : null) });
    radice.classList.add('pronta');
  } catch (e) { console.error('Scena 3D non disponibile:', e); radice.classList.remove('js3d'); radice.classList.add('no3d'); }
}
