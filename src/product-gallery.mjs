/**
 * HYXI AURA Hero V5 — direct spatial zones with GSAP-eased micro orbit, NOT a 360° model.
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
  const photoCache = new Map([['front', Promise.resolve(stage.querySelector('#hero-product-image'))]]);
  let active = 'front';
  let desired = 'front';
  let generation = 0;
  let dissolve = null;
  let returnTimer = null;
  let touchStart = null;
  let manualHold = false;
  const orbit = { yaw: 0 };

  // Without JavaScript the original official front product remains a static image.
  // With JavaScript the image itself becomes an accessible three-position control.
  stage.dataset.activeView = active;
  stage.dataset.activeZone = 'center';
  stage.setAttribute('role', 'slider');
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'HYXI AURA kijkhoek');
  stage.setAttribute('aria-describedby', 'aura-viewer-help');
  stage.setAttribute('aria-valuemin', '0');
  stage.setAttribute('aria-valuemax', '2');
  stage.setAttribute('aria-valuenow', '1');
  stage.setAttribute('aria-valuetext', 'Vooraanzicht');
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
    stage.dataset.activeZone = view === 'side' ? 'left' : view === 'angle' ? 'right' : 'center';
    stage.setAttribute('aria-valuenow', String(order.indexOf(view)));
    stage.setAttribute('aria-valuetext', view === 'side' ? 'Linkerhoek' : view === 'angle' ? 'Rechterhoek' : 'Vooraanzicht');
    caption.textContent = views[view].caption;
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

  // Three real viewing zones are measured against the *visible front battery*,
  // not the much wider stage or manufacturer source canvas's transparent margins.
  // The middle strip is 32% of visible battery width: neither a 1px threshold
  // nor an accidental jump through the front view.
  const MIDDLE_START = 0.34;
  const MIDDLE_END = 0.66;
  const HYSTERESIS = 0.025;

  function normalizedProductX(clientX) {
    const bounds = stage.getBoundingClientRect();
    const height = parseFloat(getComputedStyle(gallery).getPropertyValue('--aura-body-height'));
    const bodyWidth = Math.min(bounds.width, (Number.isFinite(height) && height > 0 ? height : bounds.height - 5) * 699 / 1000);
    if (!bodyWidth) return 0.5;
    return clamp((clientX - bounds.left - (bounds.width - bodyWidth) / 2) / bodyWidth, 0, 1);
  }

  function viewFromProductX(value, previous = desired) {
    // 2.5% hysteresis around the two boundaries prevents rapid image flicker.
    if (previous === 'side' && value < MIDDLE_START + HYSTERESIS) return 'side';
    if (previous === 'angle' && value > MIDDLE_END - HYSTERESIS) return 'angle';
    if (value < MIDDLE_START - HYSTERESIS) return 'side';
    if (value > MIDDLE_END + HYSTERESIS) return 'angle';
    return 'front';
  }

  function viewOnTap(value) {
    return value < MIDDLE_START ? 'side' : value > MIDDLE_END ? 'angle' : 'front';
  }

  function renderOrbit() {
    if (!gsap || reduced.matches) return;
    const v = orbit.yaw;
    // A small physical hint — real photos remain photographs, NOT model textures.
    gsap.set(pivot, { rotationY: v * 5.2, rotationX: -Math.abs(v) * 0.75, x: v * 5, force3D: true });
    gsap.set(halo, { x: -v * 12 });
    gsap.set(plinth, { x: v * 5 });
    stage.dataset.orbitPose = v.toFixed(3); // inspectable non-identifying QA state
    // The photo is selected from the CURRENT pointer zone, not from the
    // eased orbit value. The GSAP pose controls only restrained micro-parallax.
  }

  // GSAP quickTo reuses one optimized tween for hundreds of pointer samples.
  // Native controls and no-GSAP fallback work without this optional effect.
  const orbitTo = gsap
    ? gsap.quickTo(orbit, 'yaw', { duration: 0.56, ease: 'power3.out', onUpdate: renderOrbit })
    : null;

  function resetOrbit() {
    if (orbitTo && !reduced.matches) orbitTo(0);
  }

  // The on-product stage replaces the old floating control box entirely.
  stage.addEventListener('focus', prefetch);
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    manualHold = true;
    resetOrbit();
    const index = order.indexOf(desired);
    const next = event.key === 'Home' ? 0 :
      event.key === 'End' ? 2 :
      clamp(index + (event.key === 'ArrowLeft' ? -1 : 1), 0, 2);
    void show(order[next]);
  });

  gallery.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    returnTimer?.kill();
    returnTimer = null;
    prefetch();
  }, { passive: true });

  gallery.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    manualHold = false;
    returnTimer?.kill();
    returnTimer = null;
    const ratio = normalizedProductX(event.clientX);
    const next = viewFromProductX(ratio);
    if (next !== desired) void show(next);
    if (orbitTo) orbitTo(clamp((ratio - 0.5) * 2.0, -1, 1));
  }, { passive: true });

  gallery.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse' || reduced.matches || manualHold) return;
    returnTimer?.kill?.();
    resetOrbit();
    // Outside the product the default is the front view again. On touch or
    // keyboard the explicitly chosen view stays until the next interaction.
    returnTimer = gsap
      ? gsap.delayedCall(0.24, () => { void show('front'); })
      : { kill: () => clearTimeout(returnTimer.timer),
          timer: setTimeout(() => { void show('front'); }, 240) };
  }, { passive: true });

  // Passive touch handling: horizontal swipe only; vertical scrolling is untouched.
  gallery.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
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
    // Vertical movements are native scrolling, never a photo change.
    if (Math.abs(dy) > Math.abs(dx) * 0.8 && Math.abs(dy) > 14) return;
    manualHold = true;
    resetOrbit();
    if (Math.abs(dx) >= 42 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      const next = clamp(order.indexOf(desired) + (dx < 0 ? 1 : -1), 0, 2);
      void show(order[next]);
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      // A tap on left/center/right maps to the same visible battery zones.
      const next = viewOnTap(normalizedProductX(event.changedTouches[0].clientX));
      void show(next);
    }
  }, { passive: true });

  gallery.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
}
