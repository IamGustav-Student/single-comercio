// Convierte esta plantilla (originalmente estática, "Panadería Don Juan") en una
// ficha dinámica real: lee el id de la URL (/comercio/:id) y puebla todo con los
// datos reales del comercio desde la API pública de Web-MVP.

const ICONO_FA_CATEGORIA = {
  gastronomia: 'fa-cutlery',
  comerciantes: 'fa-shopping-cart',
  artesanias: 'fa-paint-brush',
  servicios: 'fa-wrench',
  indumentaria: 'fa-shopping-bag',
  agro: 'fa-leaf',
  otros: 'fa-cube',
};

function obtenerIdDeUrl() {
  const match = window.location.pathname.match(/\/comercio\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function mostrarError() {
  document.getElementById('estado-carga').style.display = 'none';
  document.getElementById('estado-error').style.display = 'flex';
}

function ocultarCarga() {
  document.getElementById('estado-carga').style.display = 'none';
  if (typeof ScrollTrigger !== 'undefined') {
    setTimeout(() => ScrollTrigger.refresh(), 50);
  }
}

function poblarFicha(c) {
  const esPago = !!c.plan_info && c.plan_info.plan_slug !== 'gratuito';
  const numeroWhatsapp = c.whatsapp ? c.whatsapp.replace(/\D/g, '') : null;
  const icono = ICONO_FA_CATEGORIA[c.categoria_slug] || 'fa-tag';
  const categoriaTexto = c.categoria_nombre || 'Comercio';
  const localidadTexto = c.localidad_nombre || 'Colón, Buenos Aires';

  // Meta / título
  document.getElementById('meta-titulo').textContent = `${c.nombre_negocio} | ${localidadTexto}`;
  document.getElementById('meta-descripcion').setAttribute(
    'content',
    (c.descripcion || `${c.nombre_negocio}, en la guía comerciantes.com.ar.`).slice(0, 160)
  );

  // Header
  document.getElementById('icono-categoria').className = `fa ${icono}`;
  document.getElementById('logo-texto').firstChild.textContent = c.nombre_negocio;
  document.getElementById('logo-subtitulo').textContent = `${categoriaTexto} · ${localidadTexto}`;

  const ctaLlamar = document.getElementById('header-cta-llamar');
  if (esPago && c.telefono) {
    ctaLlamar.href = `tel:${c.telefono}`;
  } else {
    ctaLlamar.style.display = 'none';
  }

  // Floating WhatsApp
  const floatWa = document.getElementById('float-whatsapp');
  if (esPago && numeroWhatsapp) {
    floatWa.href = `https://wa.me/${numeroWhatsapp}`;
    floatWa.style.display = 'flex';
  }

  // Hero
  document.getElementById('hero-eyebrow').textContent = `${categoriaTexto} · ${localidadTexto}`;
  document.getElementById('hero-titulo').textContent = c.nombre_negocio;
  document.getElementById('hero-slogan').textContent =
    c.descripcion ? c.descripcion.split('.')[0] + '.' : 'Conocé este comercio en comerciantes.com.ar.';
  if (c.foto_portada) {
    document.getElementById('hero-bg').style.setProperty('--foto-hero', `url('${c.foto_portada}')`);
  }

  // Presentación
  document.getElementById('pre-title').textContent = categoriaTexto;
  document.getElementById('presentacion-titulo').textContent = c.nombre_negocio.toUpperCase();
  document.getElementById('presentacion-lead').textContent = c.descripcion
    ? c.descripcion.split('.')[0] + '.'
    : `${c.nombre_negocio} es parte de la guía de comercios de ${localidadTexto}.`;
  document.getElementById('main-story').textContent = c.descripcion || '';
  document.getElementById('direccion-texto').textContent = (c.direccion || localidadTexto).toUpperCase();

  // Mapa
  const mapaIframe = document.getElementById('mapa-iframe');
  if (c.latitud && c.longitud) {
    mapaIframe.src = `https://www.google.com/maps?q=${c.latitud},${c.longitud}&output=embed`;
  } else if (c.direccion) {
    mapaIframe.src = `https://www.google.com/maps?q=${encodeURIComponent(c.direccion + ', ' + localidadTexto)}&output=embed`;
  } else {
    document.getElementById('ubicacion').style.display = 'none';
  }

  // Horarios
  if (c.horarios) {
    document.getElementById('horarios-texto').textContent = c.horarios;
    document.getElementById('horarios').style.display = 'block';
  }

  // Galería
  const fotos = c.fotos && c.fotos.length ? c.fotos.map((f) => f.url) : c.foto_portada ? [c.foto_portada] : [];
  if (fotos.length) {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = fotos
      .map((url) => `<div class="gallery-item"><img src="${url}" alt="${c.nombre_negocio}" loading="lazy"></div>`)
      .join('');
    document.getElementById('galeria-section').style.display = 'block';
  }

  // Contacto / cierre
  const botones = document.getElementById('contact-buttons');
  if (esPago) {
    let html = '';
    if (numeroWhatsapp) {
      html += `<a href="https://wa.me/${numeroWhatsapp}" target="_blank" class="contact-btn whatsapp-btn-simple"><i class="fa fa-whatsapp"></i> ESCRIBIR POR WHATSAPP</a>`;
    }
    if (c.telefono) {
      html += `<a href="tel:${c.telefono}" class="contact-btn phone-btn-simple"><i class="fa fa-phone"></i> LLAMAR</a>`;
    }
    botones.innerHTML = html;
  } else {
    document.getElementById('aviso-freemium').style.display = 'block';
  }

  const redesHtml = [];
  if (c.instagram) {
    redesHtml.push(
      `<a href="https://instagram.com/${c.instagram.replace('@', '')}" target="_blank" class="contact-btn-secundario"><i class="fa fa-instagram"></i> Instagram</a>`
    );
  }
  if (c.facebook) redesHtml.push(`<a href="${c.facebook}" target="_blank" class="contact-btn-secundario"><i class="fa fa-facebook"></i> Facebook</a>`);
  if (c.sitio_web) redesHtml.push(`<a href="${c.sitio_web}" target="_blank" class="contact-btn-secundario"><i class="fa fa-globe"></i> Sitio web</a>`);
  document.getElementById('redes-sociales').innerHTML = redesHtml.join(' ');

  // Footer
  document.getElementById('footer-nombre').textContent = c.nombre_negocio;
  document.getElementById('footer-tagline').textContent = c.descripcion
    ? c.descripcion.split('.')[0] + '.'
    : `Parte de la guía de ${localidadTexto}.`;
  document.getElementById('footer-direccion').innerHTML = `<i class="fa fa-map-marker"></i> ${c.direccion || localidadTexto}`;
  // Mismo criterio que el resto del ecosistema: sin plan pago, no se expone contacto directo.
  if (esPago && c.telefono) {
    document.getElementById('footer-telefono').innerHTML = `<i class="fa fa-phone"></i> <a href="tel:${c.telefono}">${c.telefono}</a>`;
  }
  if (esPago && numeroWhatsapp) {
    document.getElementById('footer-whatsapp').innerHTML = `<i class="fa fa-whatsapp"></i> <a href="https://wa.me/${numeroWhatsapp}" target="_blank">Escribir por WhatsApp</a>`;
  }
  const footerSocial = document.getElementById('footer-social-links');
  if (c.instagram) footerSocial.innerHTML += `<a href="https://instagram.com/${c.instagram.replace('@', '')}" target="_blank" aria-label="Instagram"><i class="fa fa-instagram"></i></a>`;
  if (esPago && numeroWhatsapp) footerSocial.innerHTML += `<a href="https://wa.me/${numeroWhatsapp}" target="_blank" aria-label="WhatsApp"><i class="fa fa-whatsapp"></i></a>`;
  document.getElementById('footer-copyright').textContent = `© ${new Date().getFullYear()} ${c.nombre_negocio}. Todos los derechos reservados.`;
}

(async function init() {
  const id = obtenerIdDeUrl();
  if (!id) {
    mostrarError();
    return;
  }
  try {
    const comercio = await fetchComercio(id);
    poblarFicha(comercio);
    ocultarCarga();
  } catch (e) {
    mostrarError();
  }
})();
