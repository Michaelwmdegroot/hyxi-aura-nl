/**
 * Premium three-angle HYXI showroom built on real, unchanged manufacturer images.
 * NOT a 360-degree / 3D view. No external requests, storage, pixels or lead writes.
 * The first official front view remains usable without JavaScript.
 */
const gallery = document.querySelector('[data-product-gallery]');
if (gallery) {
  const stage = gallery.querySelector('#hero-product-stage');
  const controls = gallery.querySelector('.hero-view-switcher');
  const caption = gallery.querySelector('#hero-image-caption');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const front = stage.querySelector('#hero-product-image');
  const views = Object.freeze({
    side: {
      src: '/images/aura-side.webp', width: 1875, height: 1000,
      alt: 'HYXI AURA thuisbatterij, officieel schuin productaanzicht met zichtbare linkerzijde',
      caption: 'Officieel HYXI-productbeeld · linkerhoek'
    },
    front: {
      src: '/images/aura-front.webp', width: 699, height: 1000,
      alt: 'HYXI AURA thuisbatterij met modulaire opslag, vooraanzicht en ronde statusindicator',
      caption: 'Officieel HYXI-productbeeld · vooraanzicht'
    },
    angle: {
      src: '/images/aura-angle.webp', width: 2078, height: 1000,
      alt: 'HYXI AURA thuisbatterij, officieel schuin productaanzicht met zichtbare rechterzijde',
      caption: 'Officieel HYXI-productbeeld · rechterhoek'
    }
  });
  const order = ['side', 'front', 'angle'];
  const buttons = [...controls.querySelectorAll('[data-aura-view]')];
  const loaded = new Map([['front', Promise.resolve(front)]]);
  let current = 'front';
  let requestId = 0;
  let hoverTimer = null;
  let touchStart = null;
  stage.dataset.activeView = current;

  // Deliberately defer both additional angle downloads until interaction intent.
  function load(view) {
    if (loaded.has(view)) return loaded.get(view);
    const info = views[view];
    if (!info) return Promise.reject(new Error('Unknown product angle'));
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.className = 'hero-product';
      image.dataset.auraAngle = view;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.decoding = 'async';
      image.width = info.width;
      image.height = info.height;
      image.onload = async () => {
        try { await image.decode(); } catch { /* onload already confirmed usable pixels */ }
        resolve(image);
      };
      image.onerror = () => reject(new Error('Product image unavailable'));
      image.src = info.src;
    }).catch(error => {
      loaded.delete(view); // Later manual selections may retry safely.
      throw error;
    });
    loaded.set(view, promise);
    return promise;
  }

  async function show(view) {
    if (!views[view]) return;
    const token = ++requestId;
    if (view === current) return;
    let incoming;
    try {
      incoming = await load(view);
    } catch {
      // Never replace the last good photo with a failed/empty image.
      return;
    }
    if (token !== requestId) return;
    if (!stage.contains(incoming)) {
      stage.append(incoming);
      incoming.getBoundingClientRect(); // establish opacity=0 before cross-dissolve
    }
    requestAnimationFrame(() => {
      if (token !== requestId) return;
      const outgoing = stage.querySelector('.hero-product.is-active');
      if (outgoing && outgoing !== incoming) {
        outgoing.classList.remove('is-active');
        outgoing.alt = '';
        outgoing.setAttribute('aria-hidden', 'true');
        outgoing.removeAttribute('id');
      }
      incoming.classList.add('is-active');
      incoming.id = 'hero-product-image';
      incoming.alt = views[view].alt;
      incoming.removeAttribute('aria-hidden');
      current = view;
      stage.dataset.activeView = current;
      stage.setAttribute('aria-label', 'HYXI AURA · ' + views[view].caption);
      caption.textContent = views[view].caption;
      for (const button of buttons) {
        button.setAttribute('aria-pressed', String(button.dataset.auraView === view));
      }
    });
  }

  for (const button of buttons) {
    button.addEventListener('click', () => { void show(button.dataset.auraView); });
    button.addEventListener('focus', () => { void load(button.dataset.auraView).catch(() => {}); });
  }
  controls.hidden = false;

  function prefetchAngles() {
    for (const view of ['side', 'angle']) void load(view).catch(() => {});
  }
  stage.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && !reducedMotion.matches) prefetchAngles();
  }, { passive: true });
  stage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width) return;
    const relativeX = (event.clientX - bounds.left) / bounds.width;
    const next = relativeX < .34 ? 'side' : relativeX > .66 ? 'angle' : 'front';
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = null;
    if (next !== current) hoverTimer = setTimeout(() => { hoverTimer = null; void show(next); }, 85);
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = null;
  }, { passive: true });

  // Gesture recognition remains passive: vertical page scrolling is never hijacked.
  stage.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    prefetchAngles();
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    const next = Math.max(0, Math.min(2, order.indexOf(current) + (dx < 0 ? 1 : -1)));
    void show(order[next]);
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
}
