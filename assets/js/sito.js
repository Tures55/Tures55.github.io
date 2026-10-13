// Tures 55 Dock — sito: navigazione, dock in basso, versione dal rilascio GitHub, avvio della scena 3D.
const radice = document.documentElement;
const testi = JSON.parse(document.getElementById('testi-js').textContent);
const base = new URL('../../', import.meta.url).href;
const tappe = [...document.querySelectorAll('[data-tappa]')].sort((a, b) => a.dataset.tappa - b.dataset.tappa);
const vociNav = [...document.querySelectorAll('.dock-nav a')];
const movimentoRidotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Avanzamento: 0 = inizio, 1 = programmi, ... 6 = scarica ----------
let centri = [];
function misura() {
  centri = tappe.map((s) => {
    const alto = s.getBoundingClientRect().top + scrollY;
    return Math.max(0, alto + s.offsetHeight / 2 - innerHeight / 2);
  });
  centri[0] = 0;
  const massimo = document.documentElement.scrollHeight - innerHeight;
  centri = centri.map((c) => Math.min(c, massimo));
}
function progresso() {
  const y = scrollY;
  if (!centri.length || y <= centri[0]) return 0;
  for (let i = 0; i < centri.length - 1; i++) {
    if (y < centri[i + 1]) return i + (y - centri[i]) / Math.max(1, centri[i + 1] - centri[i]);
  }
  return centri.length - 1;
}

// ---------- Scorrimento morbido verso una tappa ----------
// Durante un salto la scena vola dritta alla meta, senza passare da tutte le tappe in mezzo
let animazione = null, salto = null;
const facile = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function ferma() {
  if (animazione) cancelAnimationFrame(animazione);
  animazione = null;
  salto = null;
  radice.classList.remove('in-salto');
}
function statoSalto() {
  if (!salto) return null;
  return { ...salto, e: facile(Math.min(1, (performance.now() - salto.t0) / salto.durata)) };
}
function vaiA(i) {
  ferma();
  const meta = centri[i] ?? 0;
  if (radice.classList.contains('no3d') || movimentoRidotto) {
    tappe[i]?.scrollIntoView({ behavior: movimentoRidotto ? 'auto' : 'smooth' });
    return;
  }
  const da = scrollY;
  const fDa = progresso();
  const durata = 950 + Math.min(3, Math.abs(i - fDa)) * 200;
  const t0 = performance.now();
  salto = { da: fDa, a: i, t0, durata };
  radice.classList.add('in-salto');
  tappe.forEach((s) => s.classList.toggle('meta-salto', Number(s.dataset.tappa) === i));
  const passo = (t) => {
    const k = Math.min(1, (t - t0) / durata);
    scrollTo(0, da + (meta - da) * facile(k));
    if (k < 1) animazione = requestAnimationFrame(passo);
    else { animazione = null; salto = null; radice.classList.remove('in-salto'); }
  };
  animazione = requestAnimationFrame(passo);
}
for (const tipo of ['wheel', 'touchstart', 'keydown']) addEventListener(tipo, ferma, { passive: true });

document.querySelectorAll('[data-vai]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    vaiA(Number(a.dataset.vai));
    history.replaceState(null, '', a.getAttribute('href'));
  });
});

// ---------- Dock di navigazione: ingrandimento come su macOS ----------
const nav = document.querySelector('.dock-nav');
nav.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  for (const a of vociNav) {
    const r = a.getBoundingClientRect();
    const d = e.clientX - (r.left + r.width / 2);
    a.style.setProperty('--s', (1 + 0.5 * Math.exp(-(d * d) / (2 * 60 * 60))).toFixed(3));
  }
});
nav.addEventListener('pointerleave', () => vociNav.forEach((a) => a.style.setProperty('--s', '1')));

// ---------- Testi che appaiono e spariscono, stato della pagina ----------
let inAttesa = false;
function aggiorna() {
  inAttesa = false;
  const vh = innerHeight;
  radice.classList.toggle('oltre-eroe', scrollY > vh * 0.55);
  const attiva = Math.min(tappe.length - 1, Math.round(progresso()));
  vociNav.forEach((a) => a.classList.toggle('attiva', Number(a.dataset.vai) === attiva));
  if (!radice.classList.contains('js3d')) return;
  for (const s of tappe) {
    const r = s.getBoundingClientRect();
    const extra = Math.max(0, (r.height - vh) / 2);
    const dist = Math.max(0, Math.abs(r.top + r.height / 2 - vh / 2) - extra);
    const vis = Math.max(0, Math.min(1, 1 - (dist - vh * 0.12) / (vh * 0.36)));
    s.style.setProperty('--vis', vis.toFixed(3));
  }
}
const pianifica = () => { if (!inAttesa) { inAttesa = true; requestAnimationFrame(aggiorna); } };
addEventListener('scroll', pianifica, { passive: true });
addEventListener('resize', () => { misura(); pianifica(); });
new ResizeObserver(() => { misura(); pianifica(); }).observe(document.querySelector('main'));
misura();
aggiorna();

// ---------- Versione e peso dall'ultimo rilascio su GitHub ----------
(async () => {
  try {
    let dati = null;
    try { dati = JSON.parse(sessionStorage.getItem('t55-rilascio') || 'null'); } catch {}
    if (!dati) {
      const r = await fetch('https://api.github.com/repos/Tures55/tures55-dock/releases/latest', { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) return;
      const j = await r.json();
      const file = (j.assets || []).find((a) => a.name === 'Tures55-Dock-Setup.exe');
      dati = { v: String(j.tag_name || '').replace(/^v/, ''), mb: file ? Math.round(file.size / 1e6) : null };
      try { sessionStorage.setItem('t55-rilascio', JSON.stringify(dati)); } catch {}
    }
    if (dati.v) document.querySelectorAll('[data-versione]').forEach((e) => { e.textContent = dati.v; });
    if (dati.mb) document.querySelectorAll('[data-peso]').forEach((e) => { e.textContent = dati.mb; });
  } catch {}
})();

// ---------- Scena 3D (se il computer la regge) ----------
function puo3D() {
  if (movimentoRidotto) return false;
  if (radice.classList.contains('js3d')) return true; // già deciso nella testata della pagina
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}
function senza3D() {
  radice.classList.remove('js3d', 'pronta');
  radice.classList.add('no3d');
  misura();
  aggiorna();
}

if (puo3D()) {
  radice.classList.remove('no3d');
  radice.classList.add('js3d');
  misura();
  aggiorna();
  const scorta = setTimeout(() => radice.classList.add('pronta'), 9000);
  try {
    const { avviaScena } = await import(new URL('./scena.js' + new URL(import.meta.url).search, import.meta.url).href);
    await avviaScena({
      canvas: document.getElementById('scena'),
      base,
      testi,
      progresso,
      vaiA,
      salto: statoSalto,
      lati: tappe.map((s) => s.dataset.lato || 'centro'),
      etichetta: document.getElementById('etichetta'),
      fuoco: document.getElementById('fuoco'),
      pronta: () => { clearTimeout(scorta); radice.classList.add('pronta'); },
    });
  } catch (errore) {
    console.error('Scena 3D non disponibile:', errore);
    clearTimeout(scorta);
    senza3D();
  }
}
