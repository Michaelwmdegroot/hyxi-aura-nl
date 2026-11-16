/**
 * HYXI AURA Hero V4 — GSAP inertial three-angle showroom, NOT a 360° model.
 * Official photos and mathematically calibrated V3 silhouette bounds unchanged.
 * GSAP core is pinned and served locally; no third-party runtime requests.
 * No PII, analytics, cookies or lead API interactions.
 */
const gallery = document.querySelector('[data-product-gallery]');

if (gallery) {
  const stage = gallery.querySelector('#hero-product-stage');
  const pivot = gallery.querySelector('#hero-product-pivot');
  const halo = gallery.querySelector('.aura-halo');
  const plinth = gallery.querySelector('.product-plinth');
  const controls = gallery.querySelector('.hero-view-switcher');
  const caption = gallery.querySelector('#hero-image-caption');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap?.quickTo && window.gsap?.timeline ? window.gsap : null;

  const views = Object.freeze({
    side: {
      src: '/images/aura-side.webp', width: 1875, height: 1000,
      alt: 'HYXI AURA thuisbatterij vanuit de linkerhoek, officiële fabrikantfoto',
      caption: 'Officieel HYXI-productbeeld · linkerhoek'
    },
    front: {
      src: '/images/aura-front.webp', width: 699, height: 1000,
      alt: 'HYXI AURA modulair thuisbatterijsysteem met ronde statusindicator, vooraanzicht',
      caption: 'Officieel HYXI-productbeeld · vooraanzicht'
    },
    angle: {
      src: '/images/aura-angle.webp', width: 2078, height: 1000,
      alt: 'HYXI AURA thuisbatterij vanuit de rechterhoek, officiële fabrikantfoto',
      caption: 'Officieel HYXI-productbeeld · rechterhoek'
    }
  });

  const order = ['side', 'front', 'angle'];
  const buttons = [...controls.querySelectorAll('[data-aura-view]')];
  const photoCache = new Map([['front', Promise.resolve(stage.querySelector('#hero-product-image'))]]);
  let active = 'front';
  let desired = 'front';
  let generation = 0;
  let dissolve = null;
  let returnTimer = null;
  let touchStart = null;
  let manualHold = false;
  const orbit = { yaw: 0 };

  stage.dataset.activeView = active;
  if (gsap) stage.dataset.gsapReady = 'true';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function loadPhoto(view) {
    if (photoCache.has(view)) return photoCache.get(view);
    const meta = views[view];
    if (!meta) return Promise.reject(new Error('Unknown HYXI product angle'));
    const load = new Promise((resolve, reject) => {
      const image = new Image();
      image.className = 'hero-product';
      image.dataset.auraAngle = view;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.decoding = 'async';
      image.width = meta.width;
      image.height = meta.height;
      image.onload = async () => {
        try { await image.decode(); } catch { /* onload already validated image bytes */ }
        resolve(image);
      };
      image.onerror = () => reject(new Error('Product angle unavailable'));
      image.src = meta.src;
    }).catch(error => {
      photoCache.delete(view);
      throw error;
    });
    photoCache.set(view, load);
    return load;
  }

  function prefetch() {
    for (const view of ['side', 'angle']) void loadPhoto(view).catch(() => {});
  }

  function present(view, image) {
    active = view;
    desired = view;
    stage.dataset.activeView = view;
    stage.setAttribute('aria-label', 'HYXI AURA · ' + views[view].caption);
    caption.textContent = views[view].caption;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.auraView === view));
    }
    for (const photo of pivot.querySelectorAll('.hero-product')) {
      const selected = photo === image;
      photo.classList.toggle('is-active', selected);
      if (selected) {
        photo.id = 'hero-product-image';
        photo.alt = views[view].alt;
        photo.removeAttribute('aria-hidden');
      } else {
        photo.removeAttribute('id');
        photo.alt = '';
        photo.setAttribute('aria-hidden', 'true');
      }
      if (gsap) gsap.set(photo, { opacity: selected ? 1 : 0 });
      else photo.style.opacity = selected ? '1' : '0';
    }
  }

  async function show(view) {
    if (!views[view] || desired === view) return;
    desired = view;
    const request = ++generation;
    let incoming;
    try {
      incoming = await loadPhoto(view);
    } catch {
      if (request === generation) desired = active;
      return; // Keep the last complete photo visible on network failure.
    }
    if (request !== generation) return;
    if (!pivot.contains(incoming)) pivot.append(incoming);

    dissolve?.kill();
    dissolve = null;
    const photos = [...pivot.querySelectorAll('.hero-product')];
    const outgoing = photos.reduce((best, candidate) =>
      !best || Number(getComputedStyle(candidate).opacity) > Number(getComputedStyle(best).opacity)
        ? candidate : best, null);

    // Even a fast reverse keeps one unbroken, fully opaque manufacturer photo.
    for (const photo of photos) {
      if (gsap) gsap.killTweensOf(photo);
      if (photo !== outgoing) {
        if (gsap) gsap.set(photo, { opacity: 0 });
        else photo.style.opacity = '0';
      }
      photo.classList.remove('is-active');
      photo.removeAttribute('id');
      photo.alt = '';
      photo.setAttribute('aria-hidden', 'true');
    }
    if (!gsap || reduced.matches || incoming === outgoing) {
      present(view, incoming);
      return;
    }

    incoming.id = 'hero-product-image';
    incoming.alt = views[view].alt;
    incoming.removeAttribute('aria-hidden');
    incoming.classList.add('is-active');
    gsap.set(outgoing, { opacity: 1 });
    gsap.set(incoming, { opacity: 0 });
    dissolve = gsap.timeline({
      onComplete() {
        if (request === generation) present(view, incoming);
      }
    })
      .to(outgoing, { opacity: 0, duration: 0.19, ease: 'sine.inOut' }, 0)
      .to(incoming, { opacity: 1, duration: 0.24, ease: 'sine.out' }, 0);
  }

  // Prevent flicker when the pointer hovers near a view boundary.
  function chooseView(position) {
    if (desired === 'side' && position < -0.29) return 'side';
    if (desired === 'angle' && position > 0.29) return 'angle';
    if (position < -0.56) return 'side';
    if (position > 0.56) return 'angle';
    return 'front';
  }

  function renderOrbit() {
    if (!gsap || reduced.matches) return;
    const v = orbit.yaw;
    // A small physical hint — real photos remain photographs, NOT model textures.
    gsap.set(pivot, { rotationY: v * 5.2, rotationX: -Math.abs(v) * 0.75, x: v * 5, force3D: true });
    gsap.set(halo, { x: -v * 12 });
    gsap.set(plinth, { x: v * 5 });
    stage.dataset.orbitPose = v.toFixed(3); // inspectable non-identifying QA state
    if (!manualHold) {
      const view = chooseView(v);
      if (view !== desired) void show(view);
    }
  }

  // GSAP quickTo reuses one optimized tween for hundreds of pointer samples.
  // Native controls and no-GSAP fallback work without this optional effect.
  const orbitTo = gsap
    ? gsap.quickTo(orbit, 'yaw', { duration: 0.56, ease: 'power3.out', onUpdate: renderOrbit })
    : null;

  function resetOrbit() {
    if (orbitTo && !reduced.matches) orbitTo(0);
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      manualHold = true;
      resetOrbit();
      void show(button.dataset.auraView);
    });
    button.addEventListener('focus', () => {
      void loadPhoto(button.dataset.auraView).catch(() => {});
    });
  }
  controls.hidden = false;

  gallery.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    returnTimer?.kill();
    returnTimer = null;
    prefetch();
  }, { passive: true });

  gallery.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches || !orbitTo) return;
    if (event.target.closest('.hero-view-switcher')) return;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    manualHold = false;
    returnTimer?.kill();
    returnTimer = null;
    const ratio = (event.clientX - bounds.left) / bounds.width;
    orbitTo(clamp((ratio - 0.5) * 2.25, -1, 1));
  }, { passive: true });

  gallery.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse' || reduced.matches || !gsap || manualHold) return;
    returnTimer?.kill();
    returnTimer = gsap.delayedCall(0.14, resetOrbit);
  }, { passive: true });

  // Passive touch handling: horizontal swipe only; vertical scrolling is untouched.
  gallery.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || event.target.closest('.hero-view-switcher')) return;
    const point = event.touches[0];
    const bounds = stage.getBoundingClientRect();
    if (point.clientX < bounds.left || point.clientX > bounds.right ||
        point.clientY < bounds.top || point.clientY > bounds.bottom) return;
    touchStart = { x: point.clientX, y: point.clientY };
    prefetch();
  }, { passive: true });

  gallery.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    manualHold = true;
    resetOrbit();
    const next = clamp(order.indexOf(desired) + (dx < 0 ? 1 : -1), 0, 2);
    void show(order[next]);
  }, { passive: true });

  gallery.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
}
