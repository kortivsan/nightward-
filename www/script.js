/* ===== 1. DÉCOUPER LE LOGO EN LETTRES (pour l'animation d'entrée) ===== */
document.querySelectorAll('[data-split]').forEach(el => {
  el.setAttribute('aria-label', el.textContent);
  el.innerHTML = [...el.textContent]
    .map((c, i) => `<span aria-hidden="true" style="--i:${i}">${c}</span>`)
    .join('');
});

/* ===== 2. MUSIQUE D'AMBIANCE (générée par le navigateur, aucun fichier requis) ===== */
// Fichier audio à lire. Pour revenir à la musique générée par le navigateur, écris : const MUSIC_FILE = '';
const MUSIC_FILE = 'musique/ambiance.mp3';
let track = MUSIC_FILE ? new Audio(MUSIC_FILE) : null;
if (track) { track.loop = true; track.volume = 0; }
let fadeTimer;
function fadeTrack(to, ms, done) {
  clearInterval(fadeTimer);
  const from = track.volume, steps = 30;
  let i = 0;
  fadeTimer = setInterval(() => {
    i++;
    track.volume = Math.min(1, Math.max(0, from + (to - from) * (i / steps)));
    if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
  }, ms / steps);
}

const music = {
  ctx: null, master: null, on: false,
  build() {
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 500; filter.Q.value = 4;
    // Un accord grave et sombre
    [55, 82.4, 110, 164.8].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i < 2 ? 'sawtooth' : 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 6;
      const g = ctx.createGain();
      g.gain.value = i < 2 ? .18 : .12;
      osc.connect(g).connect(filter);
      osc.start();
    });
    // Un lent balayage du filtre, comme une respiration
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = .07; lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    filter.connect(this.master).connect(ctx.destination);
  },
  start() {
    if (track) {
      return track.play().then(() => {
        fadeTrack(.5, 2500);
        this.on = true; this.refresh();
      }).catch(err => {
        if (err && err.name === 'NotAllowedError') throw err;   // navigateur : attend un clic
        track = null; this.startSynth();                         // fichier introuvable : musique générée
      });
    }
    this.startSynth();
    return Promise.resolve();
  },
  stop() {
    if (track) {
      fadeTrack(0, 800, () => track.pause());
      this.on = false; this.refresh();
      return;
    }
    this.stopSynth();
  },
  startSynth() {
    if (!this.ctx) this.build();
    this.ctx.resume();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(.35, this.ctx.currentTime + 3);
    this.on = true; this.refresh();
  },
  stopSynth() {
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    this.on = false; this.refresh();
  },
  refresh() {
    const btn = document.querySelector('.sound-btn');
    btn.classList.toggle('on', this.on);
    btn.setAttribute('aria-pressed', this.on);
    btn.setAttribute('aria-label', this.on ? 'Couper la musique' : "Activer la musique d'ambiance");
  }
};
let userChose = false;
document.querySelector('.sound-btn').addEventListener('click', () => {
  userChose = true;
  if (music.on) music.stop(); else music.start().catch(() => {});
});

/* ===== 3. ÉCRAN D'ENTRÉE : le nom apparaît, puis le bouton BIENVENUE ===== */
const intro = document.getElementById('intro');
const welcome = document.getElementById('welcome');
const LETTERS_DONE = 4300;       // sécurité : le bouton apparaît au plus tard à ce moment (ms)
let introDone = false;
function showWelcome() {
  welcome.classList.add('show');
}
const lastLetter = intro.querySelector('.intro-logo span:last-child');
if (lastLetter) lastLetter.addEventListener('animationend', showWelcome);   // dès que la dernière lettre est complète
setTimeout(showWelcome, LETTERS_DONE);
function enter() {
  if (introDone) return;
  introDone = true;
  music.start().catch(() => {});                  // la musique démarre au clic
  intro.classList.add('is-done');                 // fondu de l'écran d'entrée
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');        // le site se dévoile
  setTimeout(() => intro.remove(), 2400);
}
welcome.addEventListener('click', enter);

/* ===== 4. MENU ===== */
const menuBtn = document.querySelector('.menu-btn');
function toggleMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.textContent = open ? 'Fermer' : 'Menu';
}
menuBtn.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

/* ===== 5. LUMIÈRE QUI RÉVÈLE LE NOM (suit la souris, dérive seule sur mobile) ===== */
const hero = document.querySelector('.hero');
const title = document.querySelector('.hero-title');
let target = { x: .5, y: .5 }, pos = { x: .5, y: .5 }, lastMove = 0;
hero.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const r = hero.getBoundingClientRect();
  target = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  lastMove = performance.now();
});
function animateLight(t) {
  if (t - lastMove > 2500) {                      // pas de souris : la lumière se promène
    target = { x: .5 + Math.sin(t / 2200) * .32, y: .5 + Math.sin(t / 1700) * .08 };
  }
  pos.x += (target.x - pos.x) * .06;
  pos.y += (target.y - pos.y) * .06;
  const h = hero.getBoundingClientRect(), tt = title.getBoundingClientRect();
  hero.style.setProperty('--gx', pos.x * h.width + 'px');
  hero.style.setProperty('--gy', pos.y * h.height + 'px');
  title.style.setProperty('--mx', pos.x * h.width - (tt.left - h.left) + 'px');
  title.style.setProperty('--my', pos.y * h.height - (tt.top - h.top) + 'px');
  requestAnimationFrame(animateLight);
}
requestAnimationFrame(animateLight);

/* ===== 6. MANIFESTE : les mots s'allument en défilant ===== */
const manifesto = document.querySelector('[data-words]');
manifesto.innerHTML = manifesto.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
const words = manifesto.querySelectorAll('.w');

/* ===== 7. DÉFILEMENT : en-tête + mots ===== */
function onScroll() {
  document.body.classList.toggle('scrolled', window.scrollY > window.innerHeight * .6);
  const r = manifesto.getBoundingClientRect(), vh = window.innerHeight;
  const progress = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .35)));
  words.forEach((w, i) => w.classList.toggle('lit', i / words.length < progress));
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ===== 8. APPARITION DES COLLECTIONS ===== */
// On observe le conteneur (et non les panneaux eux-mêmes, qui sont masqués par leur effet de rideau)
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('[data-reveal]').forEach(p => p.classList.add('in'));
      io.unobserve(e.target);
    }
  });
}, { threshold: .05 });
document.querySelectorAll('.collections').forEach(el => io.observe(el));

/* ===== 9. CATALOGUE =====
   Pour ajouter une vraie photo : mets l'image dans un dossier "images" et écris img: 'images/mon-fichier.jpg' */
const BASE = [
  { id: 1,  cat: 'GYM',    name: 'Débardeur Nocturne',        price: 39,  img: '', desc: 'Maille respirante, coupe près du corps.' },
  { id: 2,  cat: 'GYM',    name: 'Legging Compression Noir',  price: 59,  img: '', desc: 'Maintien ferme, matière opaque.' },
  { id: 3,  cat: 'GYM',    name: 'Hoodie Entraînement',       price: 89,  img: '', desc: 'Molleton léger pour avant et après la séance.' },
  { id: 4,  cat: 'GYM',    name: 'Short Mesh Anthracite',     price: 45,  img: '', desc: 'Ultra léger, poche zippée.' },
  { id: 5,  cat: 'STREET', name: 'Hoodie Oversize Éclipse',   price: 95,  img: '', desc: 'Coton épais, épaules tombantes.' },
  { id: 6,  cat: 'STREET', name: 'Cargo Noir Utility',        price: 110, img: '', desc: 'Poches latérales, bas ajustable.' },
  { id: 7,  cat: 'STREET', name: 'T-shirt Heavy Ombre',       price: 49,  img: '', desc: 'Coton lourd 240 g, col renforcé.' },
  { id: 8,  cat: 'STREET', name: 'Veste Coach Minuit',        price: 140, img: '', desc: 'Nylon mat, doublure légère.' },
  { id: 9,  cat: 'MODE',   name: 'Manteau Long Obsidienne',   price: 260, img: '', desc: 'Laine épaisse, coupe droite.' },
  { id: 10, cat: 'MODE',   name: 'Chemise Satinée Noire',     price: 120, img: '', desc: 'Satin fluide, boutons nacrés noirs.' },
  { id: 11, cat: 'MODE',   name: 'Pantalon Tailleur Graphite', price: 150, img: '', desc: 'Taille haute, pli net.' },
  { id: 12, cat: 'MODE',   name: 'Pull Maille Fine',          price: 135, img: '', desc: 'Maille douce, col rond.' }
];
// Produits de test : chaque modèle existe en 5 coloris (60 produits). Remplace-les plus tard par tes vrais produits.
const COLOURS = ['', 'Anthracite', 'Graphite', 'Cendre', 'Ivoire'];
const PRODUCTS = COLOURS.flatMap((c, v) => BASE.map(p => ({ ...p, id: v * 12 + p.id, name: c ? `${p.name} ${c}` : p.name })));
const SIZES = ['S', 'M', 'L', 'XL'];
const eur = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const visual = p => p.img ? `<img src="${p.img}" alt="${p.name}">` : `<span class="ph ph${p.id % 4}"></span>`;

const grid = document.getElementById('grid');
const scrim = document.getElementById('scrim');
const modal = document.getElementById('modal');
const drawer = document.getElementById('drawer');
let filter = 'all', query = '';

/* ===== FAVORIS (enregistrés dans le navigateur, ils restent après fermeture du site) ===== */
const heartSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
let favs = new Set();
try { favs = new Set(JSON.parse(localStorage.getItem('nightward-favs')) || []); } catch (e) {}
const heartBtn = id => `<button class="fav" data-fav="${id}" aria-pressed="${favs.has(id)}" aria-label="${favs.has(id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${heartSVG}</button>`;
function updateFavUI() {
  const badge = document.getElementById('fav-count');
  badge.textContent = favs.size; badge.hidden = favs.size === 0;
  document.querySelectorAll('[data-fav]').forEach(b => {
    const on = favs.has(+b.dataset.fav);
    b.setAttribute('aria-pressed', on);
    if (b.classList.contains('fav')) b.setAttribute('aria-label', on ? 'Retirer des favoris' : 'Ajouter aux favoris');
    const label = b.querySelector('span');
    if (label) label.textContent = on ? 'Dans mes favoris' : 'Ajouter aux favoris';
  });
}
function toggleFav(id) {
  favs.has(id) ? favs.delete(id) : favs.add(id);
  try { localStorage.setItem('nightward-favs', JSON.stringify([...favs])); } catch (e) {}
  updateFavUI();
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
  if (filter === 'FAV') setTimeout(render, 380);     // la carte retirée disparaît après le petit effet
}

const PAGE_SIZE = 12;          // nombre de produits par page (entre 9 et 12)
const pager = document.getElementById('pager');
let page = 1, totalPages = 1, turning = false;
const pad = n => String(n).padStart(2, '0');

function pageItems(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = [...new Set([1, total, cur - 1, cur, cur + 1])].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  keep.forEach((n, i) => { if (i && n - keep[i - 1] > 1) out.push('…'); out.push(n); });
  return out;
}
function renderPager(count, start, shown) {
  pager.hidden = totalPages <= 1;
  document.getElementById('pager-info').textContent = count ? `Pièces ${pad(start + 1)} à ${pad(start + shown)} sur ${count}` : '';
  pager.innerHTML = `
    <button class="pg-arrow" data-go="prev" ${page === 1 ? 'disabled' : ''} aria-label="Page précédente"><span aria-hidden="true">←</span><span class="pg-label">Précédent</span></button>
    <div class="pg-nums">${pageItems(page, totalPages).map(n => n === '…'
      ? '<span class="pg-gap" aria-hidden="true">…</span>'
      : `<button class="pg-num${n === page ? ' on' : ''}" data-go="${n}" ${n === page ? 'aria-current="page"' : ''} aria-label="Page ${n}">${pad(n)}</button>`).join('')}</div>
    <button class="pg-arrow" data-go="next" ${page === totalPages ? 'disabled' : ''} aria-label="Page suivante"><span class="pg-label">Suivant</span><span aria-hidden="true">→</span></button>`;
}
function render() {
  const inFilter = p => filter === 'all' ? true : filter === 'FAV' ? favs.has(p.id) : p.cat === filter;
  const list = PRODUCTS.filter(p => inFilter(p) && p.name.toLowerCase().includes(query));
  totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  page = Math.min(page, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const shown = list.slice(start, start + PAGE_SIZE);
  grid.classList.remove('leaving');
  const emptyMsg = filter === 'FAV'
    ? "Aucun favori pour l'instant. Touche le cœur d'un vêtement pour le retrouver ici."
    : 'Aucun vêtement ne correspond à cette recherche. Essaie un autre mot ou une autre catégorie.';
  grid.innerHTML = shown.length
    ? shown.map((p, i) => `<div class="card" data-id="${p.id}" style="animation-delay:${i * .05}s">
        <button class="card-open">
          <span class="frame">${visual(p)}</span>
          <span class="card-cat">${p.cat}</span><span class="card-name">${p.name}</span><span class="card-price">${eur(p.price)}</span>
        </button>
        ${heartBtn(p.id)}
      </div>`).join('')
    : `<p class="empty">${emptyMsg}</p>`;
  renderPager(list.length, start, shown.length);
  document.querySelectorAll('.filters button').forEach(b => b.classList.toggle('on', b.dataset.filter === filter));
  document.getElementById('cat-title').textContent = filter === 'FAV' ? 'Mes favoris' : 'Catalogue';
}
function goTo(n) {
  if (turning || n < 1 || n > totalPages || n === page) return;
  turning = true;
  document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
  grid.classList.add('leaving');                       // les produits sortent en douceur…
  setTimeout(() => { page = n; render(); turning = false; }, 300);   // …puis les nouveaux entrent
}
pager.addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (!b || b.disabled) return;
  const g = b.dataset.go;
  goTo(g === 'prev' ? page - 1 : g === 'next' ? page + 1 : +g);
});
function setFilter(f) { filter = f; page = 1; render(); }
document.querySelector('.filters').addEventListener('click', e => {
  const b = e.target.closest('button'); if (b) setFilter(b.dataset.filter);
});
// Les liens Gym / Street / Mode (menu, panneaux) filtrent le catalogue
document.querySelectorAll('a[href="#gym"], a[href="#street"], a[href="#mode"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const go = () => {
      setFilter(a.getAttribute('href').slice(1).toUpperCase());
      document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
    };
    if (a.classList.contains('panel')) { burst(a, e); setTimeout(go, 520); }   // l'effet se voit avant le défilement
    else go();
  });
});

/* --- Fenêtres (fiche produit, panier) --- */
function openLayer(el) { el.classList.add('open'); scrim.classList.add('open'); document.body.classList.add('lock'); }
function closeLayers() {
  [modal, drawer, scrim].forEach(el => el.classList.remove('open'));
  document.body.classList.remove('lock');
}
scrim.addEventListener('click', closeLayers);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLayers(); });
[modal, drawer].forEach(el => el.addEventListener('click', e => { if (e.target.closest('.close')) closeLayers(); }));

/* --- Fiche produit --- */
grid.addEventListener('click', e => {
  const heart = e.target.closest('[data-fav]');
  if (heart) { toggleFav(+heart.dataset.fav); return; }
  const card = e.target.closest('.card'); if (!card) return;
  const p = PRODUCTS.find(x => x.id == card.dataset.id);
  modal.dataset.id = p.id; modal.dataset.size = '';
  modal.innerHTML = `<button class="close" aria-label="Fermer">×</button>
    <div class="m-visual">${visual(p)}</div>
    <div class="m-info">
      <p class="m-cat">${p.cat}</p><h3>${p.name}</h3><p class="m-price">${eur(p.price)}</p>
      <button class="m-fav" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}">${heartSVG}<span>${favs.has(p.id) ? 'Dans mes favoris' : 'Ajouter aux favoris'}</span></button>
      <p class="m-desc">${p.desc}</p>
      <p class="m-label">Taille</p>
      <div class="sizes">${SIZES.map(s => `<button data-size="${s}">${s}</button>`).join('')}</div>
      <p class="m-error" aria-live="polite"></p>
      <button class="btn add">Ajouter au panier</button>
    </div>`;
  openLayer(modal);
});
modal.addEventListener('click', e => {
  const heart = e.target.closest('[data-fav]');
  if (heart) { toggleFav(+heart.dataset.fav); return; }
  const s = e.target.closest('[data-size]');
  if (s) {
    modal.dataset.size = s.dataset.size;
    modal.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', b === s));
    modal.querySelector('.m-error').textContent = '';
  }
  if (e.target.closest('.add')) {
    if (!modal.dataset.size) { modal.querySelector('.m-error').textContent = 'Choisis une taille avant d\'ajouter.'; return; }
    addToCart(+modal.dataset.id, modal.dataset.size);
    modal.classList.remove('open');
    openLayer(drawer);
  }
});

/* --- Panier --- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('nightward-cart')) || []; } catch (e) {}
function addToCart(id, size) {
  const line = cart.find(l => l.id === id && l.size === size);
  line ? line.qty++ : cart.push({ id, size, qty: 1 });
  renderCart();
}
function renderCart() {
  try { localStorage.setItem('nightward-cart', JSON.stringify(cart)); } catch (e) {}
  document.getElementById('cart-count').textContent = cart.reduce((n, l) => n + l.qty, 0);
  document.getElementById('cart-total').textContent = eur(cart.reduce((n, l) => n + l.qty * PRODUCTS.find(p => p.id === l.id).price, 0));
  document.getElementById('cart-note').textContent = '';
  document.getElementById('cart-items').innerHTML = cart.length ? cart.map(l => {
    const p = PRODUCTS.find(x => x.id === l.id);
    return `<div class="line">${visual(p)}<div>
      <p class="line-name">${p.name}</p><p class="line-meta">Taille ${l.size} · ${eur(p.price)}</p>
      <div class="qty" data-id="${l.id}" data-size="${l.size}">
        <button data-act="minus" aria-label="Retirer un">−</button><span>${l.qty}</span><button data-act="plus" aria-label="Ajouter un">+</button>
        <button class="rm" data-act="remove">Supprimer</button>
      </div></div></div>`;
  }).join('') : `<p class="cart-empty">Ton panier est vide. Choisis une pièce dans le catalogue.</p>`;
}
document.getElementById('cart-items').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const q = b.closest('.qty');
  const line = cart.find(l => l.id == q.dataset.id && l.size === q.dataset.size);
  if (b.dataset.act === 'plus') line.qty++;
  if (b.dataset.act === 'minus') line.qty--;
  if (b.dataset.act === 'remove' || line.qty < 1) cart = cart.filter(l => l !== line);
  renderCart();
});
document.querySelector('.cart-link').addEventListener('click', e => { e.preventDefault(); openLayer(drawer); });
document.querySelector('.checkout').addEventListener('click', () => {
  document.getElementById('cart-note').textContent = cart.length
    ? 'Le paiement sécurisé sera ajouté à la prochaine étape.'
    : 'Ajoute d\'abord une pièce à ton panier.';
});

/* --- Recherche --- */
const searchForm = document.querySelector('.search');
searchForm.querySelector('input').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); page = 1; render(); });
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
});

render();
renderCart();

/* ===== 10. SON AU CLIC SUR "VOIR LES COLLECTIONS" =====
   Mets ton fichier audio dans le dossier "musique" et nomme-le jackpot.mp3 */
const clickSound = new Audio('musique/jackpot.mp3');
clickSound.volume = .8;
document.querySelector('.hero .btn').addEventListener('click', () => {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});   // si le fichier est absent, rien ne se passe
});

/* ===== 11. EFFET AU CLIC SUR UNE CATÉGORIE (propre à GYM, STREET, MODE) ===== */
function burst(panel, e) {
  const r = panel.getBoundingClientRect();
  const b = document.createElement('span');
  b.className = 'burst';
  b.style.left = (e && e.clientX ? e.clientX - r.left : r.width / 2) + 'px';
  b.style.top = (e && e.clientY ? e.clientY - r.top : r.height / 2) + 'px';
  panel.appendChild(b);
  setTimeout(() => b.remove(), 1100);
}

/* ===== 12. FAVORIS : bouton cœur de l'en-tête = section « Mes favoris » ===== */
document.querySelector('.fav-link').addEventListener('click', () => {
  setFilter('FAV');
  document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
});
updateFavUI();

/* ===== 13. LOGOS DISCORD / INSTAGRAM : deviennent visibles à l'approche ===== */
(function socials() {
  const icons = [...document.querySelectorAll('.social')];
  if (!icons.length) return;
  const set = (el, v) => el.style.setProperty('--near', Math.max(0, Math.min(1, v)).toFixed(3));
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // Ordinateur : plus la souris s'approche, plus l'icône se révèle
    const RANGE = 240;
    let raf = 0, mx = -9999, my = -9999;
    const update = () => {
      raf = 0;
      icons.forEach(el => {
        const r = el.getBoundingClientRect();
        set(el, 1 - Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2)) / RANGE);
      });
    };
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    document.addEventListener('mouseleave', () => { mx = my = -9999; update(); });
  } else {
    // Téléphone : pas de souris, les icônes se révèlent quand le bas de page approche
    const footer = document.querySelector('.footer');
    const onScroll = () => {
      const r = footer.getBoundingClientRect();
      icons.forEach(el => set(el, ((innerHeight - r.top) / (r.height + 40)) * .6));
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

/* ===== 14. APPLICATION MOBILE (installation + mode hors-ligne) ===== */
const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
if (!isNative && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
(function installApp() {
  const btn = document.getElementById('install');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (!btn || standalone || isNative) return;                       // déjà installée : on ne montre rien
  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btn.hidden = false; });
  addEventListener('appinstalled', () => { btn.hidden = true; deferred = null; });
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) btn.hidden = false;   // Safari iPhone : pas d'installation automatique
  btn.addEventListener('click', async () => {
    if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; btn.hidden = true; }
    else alert("Sur iPhone : touche le bouton Partager de Safari, puis « Sur l'écran d'accueil ».");
  });
})();

/* ===== 15. APPLICATION ANDROID NATIVE ===== */
if (isNative) {
  document.documentElement.classList.add('native');
  // Bouton « Retour » d'Android : ferme d'abord ce qui est ouvert, ne quitte l'app qu'en dernier
  const AppPlugin = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (AppPlugin) AppPlugin.addListener('backButton', () => {
    if (document.body.classList.contains('menu-open')) toggleMenu(false);
    else if (modal.classList.contains('open') || drawer.classList.contains('open')) closeLayers();
    else if (filter !== 'all' || query) {
      query = ''; document.querySelector('.search input').value = '';
      setFilter('all');
    }
    else if (window.scrollY > 80) window.scrollTo({ top: 0, behavior: 'smooth' });
    else AppPlugin.exitApp();
  });
}
