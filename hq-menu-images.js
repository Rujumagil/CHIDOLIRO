(() => {
  'use strict';

  // Usa fotografías reales/optimizadas del restaurante en lugar de los previews
  // base64 ultracomprimidos que provocaban pixelación en las tarjetas y detalles.
  window.CHIDOLIRO_GENERATED_IMAGES = {
    'Molcajete de mariscos': 'assets/molcajete.webp',
    'Aguachilón': 'assets/molcajete.webp',
    'Aguachile de camarón': 'assets/aguachile.webp',
    'Aguachile negro': 'assets/aguachile.webp',
    'Aguachile con pulpo': 'assets/pulpo.webp',
    'Pulpo zarandeado': 'assets/pulpo.webp',
    'Piñalira': 'assets/dishwide.webp',
    'Torre de mariscos individual': 'assets/torre.webp',
    'Baja Style · Camarón': 'assets/promo-tacos.webp',
    'Baja Style · Pescado': 'assets/promo-tacos.webp',
    'Tostada de camarón': 'assets/gallery-07.webp',
    'Camarones al gusto': 'assets/dishwide.webp',
    'Arrachera': 'assets/dishwide.webp',
    'Carajillo': 'assets/carajillo.webp',
    'Refresher': 'assets/citric.webp',
    'Refresher c/alcohol': 'assets/citric.webp',
    'Michelada': 'assets/citric.webp',
    'Ostiones': 'assets/gallery-01.webp',
    'Steak de salmón': 'assets/dishwide.webp'
  };

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