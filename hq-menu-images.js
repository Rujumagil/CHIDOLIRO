(() => {
  'use strict';

  // Las fotografías del menú se sirven únicamente desde image_url.
  // Si un producto todavía no tiene fotografía oficial, se muestra sin imagen.
  window.CHIDOLIRO_GENERATED_IMAGES = {};

  const style = document.createElement('style');
  style.id = 'chidoliroHqImageRendering';
  style.textContent = `
    .hero-bg,
    .foodCard img,
    .menuItem img,
    .productDetailHero img,
    .experienceCard img,
    .galleryTile img,
    .visitPhoto img {
      image-rendering: auto;
      -webkit-font-smoothing: antialiased;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    .menuItem img,
    .foodCard img,
    .productDetailHero img {
      object-fit: cover;
    }
  `;
  document.head.appendChild(style);
})();