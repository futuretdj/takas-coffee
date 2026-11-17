// Takas — shop, bag, subscription, roast curve, brew guide
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const eur = n => '€' + n.toFixed(2);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- next roast day (Thursday, Vilnius time) ---------- */
(() => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Vilnius' }));
  let d = (4 - now.getDay() + 7) % 7;
  if (d === 0 && now.getHours() >= 12) d = 7;
  const t = new Date(now); t.setDate(now.getDate() + d);
  const label = d === 0 ? 'today, Thursday' : d === 1 ? 'tomorrow, Thursday' : 'Thursday ' + t.getDate() + ' ' + t.toLocaleString('en-GB', { month: 'long' });
  $$('[data-next-roast]').forEach(e => e.textContent = label);
})();

/* ---------- products ---------- */
const P = {
  kenya:   { name: 'Kenya Gatomboya AA', img: 'photo-f155398398', p250: 15.5, p1k: 52 },
  ethiopia:{ name: 'Ethiopia Guji Hambela', img: 'photo-f84555822', p250: 14.9, p1k: 49 },
  colombia:{ name: 'Colombia Las Flores', img: 'photo-f4875443', p250: 12.9, p1k: 42 },
  paupys:  { name: 'Paupys House Espresso', img: 'photo-f86416961', p250: 11.5, p1k: 38 },
  box:     { name: 'Tasting box, 3 × 100 g', img: 'photo-f125379394', p250: 19, p1k: 19 },
};
const GR = { whole: 'Whole bean', filter: 'Ground for filter', espresso: 'Ground for espresso', moka: 'Ground for moka pot' };

$$('[data-prod]').forEach(card => {
  const id = card.dataset.prod, pr = P[id];
  const st = { size: '250', grind: 'whole' };
  const priceEl = $('[data-price]', card), addEl = $('[data-add]', card);
  const upd = () => { priceEl.textContent = eur(st.size === '1k' ? pr.p1k : pr.p250); };
  $$('.opt', card).forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', g).forEach(x => x.setAttribute('aria-pressed', x === b));
    st[g.dataset.opt] = b.dataset.v; upd();
  }));
  addEl.addEventListener('click', () => {
    addToBag(id, st.size, st.grind);
    fly($('img', card), addEl);
    addEl.classList.add('done'); const l = $('span', addEl), o = l.textContent;
    l.textContent = 'Added to the bag';
    setTimeout(() => { addEl.classList.remove('done'); l.textContent = o; }, 1500);
  });
});

/* tasting bars animate once in view */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' }) : null;
$$('.taste').forEach(t => io ? io.observe(t) : t.classList.add('in'));
setTimeout(() => $$('.taste').forEach(t => t.classList.add('in')), 6000);

/* ---------- the bag ---------- */
let bag = [];
try { bag = JSON.parse(localStorage.getItem('takas-bag') || '[]'); } catch { bag = []; }
const drawer = $('[data-drawer]');
const save = () => { try { localStorage.setItem('takas-bag', JSON.stringify(bag)); } catch {} };
function linePrice(l) { if (l.sub) return l.price; const p = P[l.id]; return (l.size === '1k' ? p.p1k : p.p250); }
function addToBag(id, size, grind, sub) {
  const key = sub ? 'sub' : id + size + grind;
  const f = bag.find(l => l.key === key);
  if (f && !sub) f.q++; else if (sub) { bag = bag.filter(l => l.key !== 'sub'); bag.push({ key, id, sub, price: sub.price, q: 1 }); }
  else bag.push({ key, id, size, grind, q: 1 });
  save(); render(); toast(sub ? 'Subscription added to the bag' : P[id].name + ' added');
}
function render() {
  const list = $('[data-bag]');
  const n = bag.reduce((a, l) => a + l.q, 0);
  const sum = bag.reduce((a, l) => a + linePrice(l) * l.q, 0);
  $$('[data-cart-count]').forEach(c => { if (c.textContent !== String(n)) { c.textContent = n; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } });
  list.innerHTML = bag.length ? bag.map((l, i) => {
    const p = P[l.id];
    const meta = l.sub ? l.sub.text : (l.id === 'box' ? 'Three origins, whole bean' : (l.size === '1k' ? '1 kg' : '250 g') + ' · ' + GR[l.grind]);
    return `<li><img src="assets/img/${p.img}-500.webp" alt=""><div><h4>${l.sub ? 'Subscription' : p.name}</h4><small>${meta}</small>
      ${l.sub ? '' : `<div class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="One less">−</button><span>${l.q}</span><button type="button" data-q="${i}" data-d="1" aria-label="One more">+</button></div>`}
      <button class="rm" type="button" data-rm="${i}">Remove</button></div><span class="lp">${eur(linePrice(l) * l.q)}</span></li>`;
  }).join('') : '<li class="empty">Your bag is empty.<br>The Kenya is very good this week.</li>';
  const freeSub = bag.some(l => l.sub);
  const left = Math.max(0, 40 - sum);
  $('[data-subtotal]').textContent = eur(sum);
  $('[data-shipping]').textContent = (left === 0 || freeSub) && sum > 0 ? 'Free' : sum ? '€3.90' : '—';
  $('[data-ship-text]').textContent = sum === 0 ? 'Free delivery in Lithuania from €40' : (left === 0 || freeSub) ? 'Your delivery is free' : 'Add ' + eur(left) + ' for free delivery in Lithuania';
  $('[data-ship-bar]').style.width = Math.min(100, sum / 40 * 100) + '%';
  $('[data-checkout]').disabled = !bag.length;
}
$('[data-bag]').addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
  if (q) { const l = bag[+q.dataset.q]; l.q += +q.dataset.d; if (l.q < 1) bag.splice(+q.dataset.q, 1); }
  if (r) bag.splice(+r.dataset.rm, 1);
  if (q || r) { save(); render(); }
});
let lastFocus;
function openBag() { lastFocus = document.activeElement; drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('open')); document.body.classList.add('lock'); setTimeout(() => $('.x', drawer).focus(), 50); }
function closeBag() { drawer.classList.remove('open'); document.body.classList.remove('lock'); setTimeout(() => { drawer.hidden = true; }, 550); lastFocus?.focus?.(); }
document.addEventListener('click', e => {
  if (e.target.closest('[data-cart-open]')) openBag();
  if (e.target.closest('[data-cart-close]')) closeBag();
});
addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeBag(); });
$('[data-checkout]').addEventListener('click', () => {
  $('[data-checkout-note]').innerHTML = '<b>This is a concept site.</b> On a live shop this button opens a Stripe or Shopify checkout.';
});
render();

/* flying bean to the bag */
function fly(img, from) {
  if (RM || !img) return;
  const target = [...$$('[data-cart-open]')].find(b => b.getBoundingClientRect().width > 0 && b.offsetParent !== null);
  if (!target) return;
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
  const f = document.createElement('img'); f.src = img.currentSrc || img.src; f.className = 'fly'; document.body.append(f);
  const x0 = a.left + a.width / 2 - 23, y0 = a.top - 10, x1 = b.left + b.width / 2 - 23, y1 = b.top + b.height / 2 - 23;
  f.animate([
    { transform: `translate(${x0}px,${y0}px) scale(1)`, opacity: 1 },
    { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 120}px) scale(.9)`, opacity: 1, offset: .5 },
    { transform: `translate(${x1}px,${y1}px) scale(.3)`, opacity: .2 }
  ], { duration: 800, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => f.remove();
}
let tt;
function toast(t) { const el = $('[data-toast]'); el.textContent = t; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2200); }

/* ---------- subscription builder ---------- */
(() => {
  const f = $('[data-sub] form'); if (!f) return;
  const base = { rotating: 15.2, espresso: 11.5, filter: 14.9 };
  const kindName = { rotating: "Roaster's choice", espresso: 'House espresso', filter: 'Filter only' };
  const sizeName = { 1: '250 g', 2: '2 × 250 g', 4: '1 kg' };
  let cur;
  const calc = () => {
    const k = f.kind.value, s = +f.size.value, ev = +f.every.value;
    const was = s === 4 ? base[k] * 3.4 : base[k] * s;
    const price = Math.round(was * 0.9 * 100) / 100;
    const month = price * (4.33 / ev);
    $('[data-sub-was]').textContent = eur(was);
    const pb = $('[data-sub-price]'); pb.textContent = eur(price); pb.classList.remove('tick'); void pb.offsetWidth; pb.classList.add('tick');
    $('[data-sub-line]').textContent = 'About ' + eur(month).replace('.00', '') + ' a month · you save ' + eur(was - price) + ' a bag';
    cur = { price, text: `${kindName[k]} · ${sizeName[s]} · every ${ev === 1 ? 'week' : ev + ' weeks'}` };
  };
  f.addEventListener('change', calc); calc();
  $('[data-sub-add]').addEventListener('click', e => { addToBag(['rotating','espresso','filter'].includes(f.kind.value) && f.kind.value === 'espresso' ? 'paupys' : 'kenya', '250', 'whole', cur); fly($('.sub__price'), e.currentTarget); setTimeout(openBag, 650); });
})();

/* ---------- roast curve ---------- */
(() => {
  const fig = $('[data-curve]'); if (!fig) return;
  const svg = $('svg', fig);
  const W = 640, H = 420, L = 44, R = 16, T = 14, B = 34;
  const tMax = 660, yMin = 60, yMax = 230;
  const X = t => L + (t / tMax) * (W - L - R), Y = v => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  // bean temperature model, seconds -> °C
  const bt = t => {
    if (t <= 80) { const k = t / 80; return 200 - (200 - 92) * (1 - Math.pow(1 - k, 2.2)); }
    const k = (t - 80) / (620 - 80);
    return 92 + (208 - 92) * (1 - Math.pow(1 - k, 1.65));
  };
  const pts = []; for (let t = 0; t <= 620; t += 2) pts.push([t, bt(t)]);
  const ror = []; for (let t = 90; t <= 620; t += 4) ror.push([t, (bt(t + 15) - bt(t - 15)) * 2]);
  const path = a => a.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
  const RY = v => T + (1 - v / 40) * (H - T - B);
  const g = $('.curve__grid', svg);
  let gh = '';
  for (let v = 80; v <= 220; v += 20) gh += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 8}" y="${Y(v) + 3}" text-anchor="end">${v}°</text>`;
  for (let m = 0; m <= 11; m++) gh += `<text x="${X(m * 60)}" y="${H - 12}" text-anchor="middle">${m}:00</text>`;
  g.innerHTML = gh;
  const btP = $('.curve__bt', svg), glow = $('.curve__bt-glow', svg), rorP = $('.curve__ror', svg), head = $('.curve__head', svg);
  btP.setAttribute('d', path(pts)); glow.setAttribute('d', path(pts));
  rorP.setAttribute('d', ror.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + RY(p[1]).toFixed(1)).join(' '));
  const marks = [[80, 'Turning point'], [270, 'Yellow'], [520, 'First crack'], [620, 'Drop']];
  $('.curve__marks', svg).innerHTML = marks.map(([t, n], i) => {
    const x = X(t), y = Y(bt(t)), up = i % 2 === 0 ? -1 : 1, ty = Math.max(28, Math.min(H - B - 8, y + up * 46));
    return `<g class="mk" data-t="${t}"><line x1="${x}" x2="${x}" y1="${y}" y2="${ty}"/><circle cx="${x}" cy="${y}" r="4"/><text x="${x + (t > 560 ? -6 : 6)}" y="${ty + (up < 0 ? -4 : 12)}" text-anchor="${t > 560 ? 'end' : 'start'}">${n} · ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</text></g>`;
  }).join('');
  const len = btP.getTotalLength(), rlen = rorP.getTotalLength();
  [btP, glow].forEach(p => { p.style.strokeDasharray = len; });
  rorP.style.strokeDasharray = `4 5`;
  const tempEl = $('[data-temp]'), timeEl = $('[data-time]');
  const phases = $$('[data-phases] li'), mk = $$('.mk', svg);
  const sec = $('#roast');
  let target = RM ? 1 : 0, shown = 0, raf = 0;
  const draw = p => {
    const t = p * 620;
    [btP, glow].forEach(e => e.style.strokeDashoffset = len * (1 - p));
    rorP.style.clipPath = `inset(0 ${100 - (X(t) / W) * 100}% 0 0)`;
    const pt = btP.getPointAtLength(len * p);
    head.setAttribute('cx', pt.x); head.setAttribute('cy', pt.y);
    tempEl.textContent = bt(t).toFixed(1) + ' °C';
    timeEl.textContent = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    mk.forEach(m => m.classList.toggle('on', t >= +m.dataset.t - 1));
    phases.forEach((li, i) => li.classList.toggle('on', p >= +li.dataset.at && (i === phases.length - 1 || p < +phases[i + 1].dataset.at)));
  };
  const loop = () => { shown += (target - shown) * 0.12; if (Math.abs(target - shown) < 0.0005) shown = target; draw(shown); raf = shown !== target ? requestAnimationFrame(loop) : 0; };
  const onScroll = () => {
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    target = RM ? 1 : Math.max(0, Math.min(1, (vh * 0.7 - r.top) / Math.max(1, r.height * 0.72)));
    if (!raf) raf = requestAnimationFrame(loop);
  };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll(); draw(shown);
})();

/* ---------- brew guide ---------- */
(() => {
  const root = $('[data-brew]'); if (!root) return;
  const M = {
    v60:  { ratio: 16.7, cup: 250, temp: 94, time: 210, grind: 38, gname: 'Medium-fine, like table salt',
            tip: 'Rinse the paper first. Pour in slow circles and keep the water level the same until the last pour.',
            steps: [[0, 'Bloom: pour twice the coffee weight in water'], [45, 'Pour to 60% in slow circles'], [90, 'Pour to the full weight'], [150, 'Swirl once, let it drain'], [210, 'Done. Taste, then adjust the grind']] },
    aero: { ratio: 15, cup: 220, temp: 88, time: 120, grind: 28, gname: 'Fine, like caster sugar',
            tip: 'One press makes one strong cup. Use the inverted method so nothing drips through early, and press slowly, about 30 seconds.',
            steps: [[0, 'Add all the water, stir 10 times'], [30, 'Cap on, wait'], [90, 'Flip and press slowly'], [120, 'Done. Dilute to taste']] },
    press:{ ratio: 15, cup: 250, temp: 95, time: 240, grind: 82, gname: 'Coarse, like sea salt',
            tip: 'Do not press hard. Break the crust at four minutes, skim the foam, then press only to the top of the coffee.',
            steps: [[0, 'Pour all the water'], [60, 'Wait, the crust forms'], [240, 'Break the crust, skim, press']] },
    moka: { ratio: 7, cup: 60, temp: 70, time: 300, grind: 22, gname: 'Fine, not as fine as espresso',
            tip: 'Fill the base with hot water from the kettle, not cold. Take it off the heat when it starts to gurgle.',
            steps: [[0, 'Hot water in, basket level, no tamping'], [120, 'Medium heat, lid open'], [240, 'Coffee rises, lower the heat'], [300, 'Gurgles: off the heat, cool the base']] },
    esp:  { ratio: 2, cup: 18, temp: 93, time: 28, grind: 8, gname: 'Very fine, like flour',
            tip: 'Weigh the shot, not the time. 18 g in, 36 g out. If it runs faster than 25 seconds, grind finer.',
            steps: [[0, 'Start the shot'], [7, 'First drops'], [28, 'Stop at 36 g']] },
  };
  let m = 'v60', cups = 2, timer = 0, t0 = 0;
  const set = (k, v) => { const e = $(`[data-b="${k}"]`, root); if (e.textContent !== v) { e.textContent = v; e.animate?.([{ opacity: .2, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' }); } };
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  const stepsEl = $('[data-steps]', root), dial = $('[data-dial]', root), clock = $('[data-clock]', root), stepTxt = $('[data-step]', root), btn = $('[data-timer]', root);
  const upd = () => {
    const r = M[m];
    const mx = m === 'esp' || m === 'aero' ? 2 : m === 'moka' ? 3 : 6;
    cups = Math.max(1, Math.min(mx, cups));
    $('[data-cups-n]', root).textContent = cups;
    const water = r.cup * cups, coffee = m === 'esp' ? 18 * cups : Math.round(water / r.ratio);
    set('coffee', coffee + ' g'); set('water', m === 'esp' ? (36 * cups) + ' g out' : water + ' ml');
    set('temp', r.temp + ' °C'); set('time', fmt(r.time)); set('grind', r.gname); set('tip', r.tip);
    $('[data-grind-mark]', root).style.left = r.grind + '%';
    stepsEl.innerHTML = r.steps.map(([s, t]) => `<li data-s="${s}"><b>${fmt(s)}</b><span>${t}</span></li>`).join('');
    stop();
  };
  const stop = () => { cancelAnimationFrame(timer); timer = 0; btn.textContent = 'Start the timer'; dial.style.strokeDashoffset = 553; clock.textContent = '0:00'; stepTxt.textContent = 'Press start'; $$('li', stepsEl).forEach(l => l.className = ''); };
  const tick = () => {
    const r = M[m], s = (performance.now() - t0) / 1000;
    clock.textContent = fmt(Math.min(s, r.time));
    dial.style.strokeDashoffset = 553 * (1 - Math.min(1, s / r.time));
    const lis = $$('li', stepsEl); let cur = 0;
    r.steps.forEach(([st], i) => { if (s >= st) cur = i; });
    lis.forEach((l, i) => l.className = i < cur ? 'past' : i === cur ? 'now' : '');
    stepTxt.textContent = r.steps[cur][1];
    if (s >= r.time) { timer = 0; btn.textContent = 'Brew again'; stepTxt.textContent = 'Enjoy it'; navigator.vibrate?.(200); return; }
    timer = requestAnimationFrame(tick);
  };
  btn.addEventListener('click', () => { if (timer) return stop(); stop(); t0 = performance.now(); btn.textContent = 'Stop'; tick(); });
  $$('[data-m]', root).forEach(b => b.addEventListener('click', () => { m = b.dataset.m; $$('[data-m]', root).forEach(x => x.setAttribute('aria-checked', x === b)); upd(); }));
  $$('[data-cups]', root).forEach(b => b.addEventListener('click', () => { cups += +b.dataset.cups; upd(); }));
  upd();
})();

/* ---------- demo wholesale form: success line without a server ---------- */
(() => {
  const f = $('[data-demo-form]'); if (!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    setTimeout(() => {
      if (f.querySelector('[aria-invalid="true"]')) return;
      const ok = [...f.querySelectorAll('[required]')].every(i => i.value.trim() && (i.type !== 'email' || /@/.test(i.value)));
      if (!ok) return;
      $('[data-form-status]', f).textContent = 'Thank you. Three samples will be roasted on Thursday, and we will write to you before then.';
      f.reset();
    }, 30);
  }, true);
})();

/* ---------- swipe gallery + lightbox ---------- */
(() => {
  const track = $('[data-gal-track]'); if (!track) return;
  const items = $$('.gal__item', track), bar = $('[data-gal-bar]'), cnt = $('[data-gal-count]');
  const prev = $('[data-gal-prev]'), next = $('[data-gal-next]'), N = items.length;
  const pad = n => String(n).padStart(2, '0');
  const cur = () => { const x = track.scrollLeft + 2; let i = 0; items.forEach((it, k) => { if (it.offsetLeft - items[0].offsetLeft <= x) i = k; }); return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 ? N - 1 : i; };
  const upd = () => {
    const max = track.scrollWidth - track.clientWidth, p = max > 0 ? track.scrollLeft / max : 0;
    const w = Math.max(.12, track.clientWidth / track.scrollWidth);
    bar.style.width = (w * 100) + '%'; bar.style.transform = `translateX(${p * (1 / w - 1) * 100}%)`;
    const i = cur(); cnt.textContent = pad(i + 1) + ' / ' + pad(N);
    prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft > max - 4;
  };
  const go = d => { const i = Math.max(0, Math.min(N - 1, cur() + d)); track.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: RM ? 'auto' : 'smooth' }); };
  prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); addEventListener('resize', upd); upd();
  // mouse drag with inertia (touch uses the native swipe)
  let down = false, sx = 0, sl = 0, moved = 0, v = 0, lx = 0, lt = 0;
  track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = lx = e.clientX; sl = track.scrollLeft; lt = performance.now(); v = 0; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4 && !track.classList.contains('drag')) track.classList.add('drag'); moved = Math.abs(dx); track.scrollLeft = sl - dx; const t = performance.now(); v = (e.clientX - lx) / Math.max(1, t - lt); lx = e.clientX; lt = t; });
  addEventListener('pointerup', () => {
    if (!down) return; down = false;
    if (!track.classList.contains('drag')) return;
    let vel = -v * 16; const glide = () => { track.scrollLeft += vel; vel *= .92; if (Math.abs(vel) > .5) requestAnimationFrame(glide); else { track.classList.remove('drag'); go(0); } };
    RM ? (track.classList.remove('drag'), go(0)) : glide();
  });
  track.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });

  // lightbox
  const lb = $('[data-lb]'), lt2 = $('[data-lb-track]'), cap = $('[data-lb-cap]'), lc = $('[data-lb-count]');
  const data = items.map(it => { const im = $('img', it); return { src: im.currentSrc || im.src, srcset: im.getAttribute('srcset'), alt: im.alt }; });
  lt2.innerHTML = data.map(d => `<li><img srcset="${d.srcset}" sizes="100vw" src="${d.src}" alt="${d.alt}" draggable="false"></li>`).join('');
  const slides = $$('li', lt2);
  let li = 0, opener;
  const lbUpd = () => { const i = Math.round(lt2.scrollLeft / Math.max(1, lt2.clientWidth)); if (i !== li || !slides[i].classList.contains('on')) { li = i; slides.forEach((s, k) => s.classList.toggle('on', k === i)); cap.textContent = data[i].alt; lc.textContent = (i + 1) + ' / ' + N; } };
  lt2.addEventListener('scroll', () => requestAnimationFrame(lbUpd), { passive: true });
  const open = i => { opener = document.activeElement; lb.hidden = false; document.body.classList.add('lock'); requestAnimationFrame(() => { lb.classList.add('open'); lt2.scrollLeft = i * lt2.clientWidth; li = -1; lbUpd(); $('[data-lb-close]').focus(); }); };
  const close = () => { lb.classList.remove('open'); document.body.classList.remove('lock'); setTimeout(() => lb.hidden = true, 350); opener?.focus?.(); };
  const step = d => lt2.scrollTo({ left: Math.max(0, Math.min(N - 1, li + d)) * lt2.clientWidth, behavior: RM ? 'auto' : 'smooth' });
  $$('[data-gal-open]').forEach(b => b.addEventListener('click', () => open(+b.dataset.galOpen)));
  $('[data-lb-close]').addEventListener('click', close);
  $('[data-lb-prev]').addEventListener('click', () => step(-1)); $('[data-lb-next]').addEventListener('click', () => step(1));
  addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  // swipe down to close on touch
  let ty0 = null; lt2.addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; }, { passive: true });
  lt2.addEventListener('touchend', e => { if (ty0 !== null && e.changedTouches[0].clientY - ty0 > 110) close(); ty0 = null; }, { passive: true });
  addEventListener('resize', () => { if (lb.classList.contains('open')) lt2.scrollLeft = li * lt2.clientWidth; });
})();

/* ---------- shop: swipe dots on phones ---------- */
(() => {
  const shop = $('[data-shop]'); if (!shop) return;
  const cards = $$('.prod', shop); const dots = document.createElement('div'); dots.className = 'shop-dots';
  dots.innerHTML = cards.map((c, i) => `<button type="button" aria-label="Coffee ${i + 1} of ${cards.length}"></button>`).join('');
  shop.after(dots);
  const bs = $$('button', dots);
  const upd = () => { const i = Math.round(shop.scrollLeft / Math.max(1, cards[0].offsetWidth + 14)); bs.forEach((b, k) => b.setAttribute('aria-current', k === Math.min(i, cards.length - 1))); };
  bs.forEach((b, i) => b.addEventListener('click', () => shop.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' })));
  shop.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
})();
