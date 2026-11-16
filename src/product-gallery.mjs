/**
 * Accessible progressive enhancement for three real manufacturer product images.
 * No third-party requests, analytics, storage, new claims or live form changes.
 * No JavaScript means the original manufacturer front product view is retained.
 */
const gallery = document.querySelector('[data-product-gallery]');
if (gallery) {
  const image = gallery.querySelector('#hero-product-image');
  const controls = gallery.querySelector('.hero-view-switcher');
  const caption = gallery.querySelector('#hero-image-caption');
  const variants = Object.freeze({
    front: {src:'/images/aura-front.webp',alt:'HYXI AURA: antraciet modulair thuisbatterijsysteem met geïntegreerde omvormer en ronde statusindicator',caption:'Officieel HYXI-productbeeld · vooraanzicht'},
    angle: {src:'/images/aura-angle.webp',alt:'HYXI AURA: officieel schuin aanzicht van de modulaire thuisbatterij en omvormer',caption:'Officieel HYXI-productbeeld · schuin aanzicht'},
    side: {src:'/images/aura-side.webp',alt:'HYXI AURA: tweede officieel schuin aanzicht van de modulaire thuisbatterij',caption:'Officieel HYXI-productbeeld · andere hoek'}
  });
  const buttons = [...controls.querySelectorAll('[data-aura-view]')];
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const variant = variants[button.dataset.auraView];
      if (!variant) return;
      image.src = variant.src;
      image.alt = variant.alt;
      caption.textContent = variant.caption;
      for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
    });
  }
  controls.hidden = false;
}
