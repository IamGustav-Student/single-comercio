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

function mostrarRestringido(c) {
  document.getElementById('estado-carga').style.display = 'none';
  document.getElementById('restringido-nombre').textContent = c.nombre_negocio;
  document.getElementById('estado-restringido').style.display = 'flex';
  // Cada visita a una ficha restringida es un "intento de contacto perdido" real (sección 5.2
  // del plan) - alimenta el reporte que el Community Manager usa para vender Premium.
  registrarEvento('visita_restringida', { comercio_id: c.id, origen: 'single-comercio' });
  configurarModalReclamarPerfil(c.id, c.nombre_negocio);
}

// ---------------------------------------------------------------------------
// "¿SOS EL DUEÑO? RECLAMÁ TU PERFIL" (sección 5.1 del plan)
// ---------------------------------------------------------------------------

function configurarModalReclamarPerfil(comercioId, nombreNegocio) {
  const btnAbrir = document.getElementById('btn-reclamar-perfil');
  const modal = document.getElementById('modal-reclamar-perfil');
  const btnCerrar = document.getElementById('cerrar-modal-reclamar');
  const form = document.getElementById('form-reclamar-perfil');
  const errorEl = document.getElementById('reclamar-error');
  const exitoEl = document.getElementById('reclamar-exito');

  if (!btnAbrir || !modal) return;

  btnAbrir.addEventListener('click', () => {
    modal.style.display = 'flex';
    registrarEvento('click_reclamar_perfil', { comercio_id: comercioId, origen: 'single-comercio' });
  });

  const cerrar = () => { modal.style.display = 'none'; };
  btnCerrar.addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const nombre = document.getElementById('reclamar-nombre').value.trim();
    const telefono = document.getElementById('reclamar-telefono').value.trim();
    const email = document.getElementById('reclamar-email').value.trim();
    const mensaje = document.getElementById('reclamar-mensaje').value.trim();

    if (!nombre || (!telefono && !email)) {
      errorEl.textContent = 'Ingresá tu nombre y al menos un teléfono o email de contacto.';
      errorEl.style.display = 'block';
      return;
    }

    try {
      await reclamarPerfil(comercioId, { nombre, telefono, email, mensaje });
      form.style.display = 'none';
      exitoEl.style.display = 'block';
    } catch (err) {
      errorEl.textContent = err.message || 'No pudimos enviar el reclamo, probá de nuevo.';
      errorEl.style.display = 'block';
    }
  });
}

function ocultarCarga() {
  document.getElementById('estado-carga').style.display = 'none';
  if (typeof ScrollTrigger !== 'undefined') {
    setTimeout(() => ScrollTrigger.refresh(), 50);
  }
}

// Convierte "HH:MM" a minutos desde medianoche para poder comparar horarios sin líos de string.
function horaAMinutos(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Calcula si el comercio está abierto AHORA según horarios_json (sección 3.B del plan) y la hora
// local del dispositivo del visitante. El índice del array coincide con Date.getDay() (0=domingo).
function calcularAbiertoAhora(horariosJson) {
  if (!horariosJson || !Array.isArray(horariosJson)) return null;
  const ahora = new Date();
  const hoy = horariosJson[ahora.getDay()];
  if (!hoy || hoy.cerrado || !hoy.apertura || !hoy.cierre) return false;

  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const apertura = horaAMinutos(hoy.apertura);
  const cierre = horaAMinutos(hoy.cierre);

  // Soporta horarios que cruzan medianoche (ej. 20:00 a 02:00).
  if (cierre < apertura) {
    return minutosAhora >= apertura || minutosAhora < cierre;
  }
  return minutosAhora >= apertura && minutosAhora < cierre;
}

function poblarBadgeAbierto(horariosJson) {
  const abierto = calcularAbiertoAhora(horariosJson);
  const badge = document.getElementById('badge-abierto');
  if (abierto === null) return; // sin horario estructurado cargado, no se muestra nada

  badge.style.display = 'inline-flex';
  if (abierto) {
    badge.textContent = 'Abierto ahora';
    badge.className = 'badge-abierto abierto';
  } else {
    badge.textContent = 'Cerrado ahora';
    badge.className = 'badge-abierto cerrado';
  }
}

// Sticky CTA Bar (sección 3.A del plan): WhatsApp con mensaje precargado, Llamar y Cómo Llegar
// (abre Maps/Waze con la ruta). Cada clic queda registrado para el Panel de Estadísticas Premium.
function poblarStickyCtaBar(c, numeroWhatsapp) {
  const bar = document.getElementById('sticky-cta-bar');
  const btnWa = document.getElementById('sticky-cta-whatsapp');
  const btnLlamar = document.getElementById('sticky-cta-llamar');
  const btnLlegar = document.getElementById('sticky-cta-como-llegar');

  let hayAlgunBoton = false;

  if (numeroWhatsapp) {
    const mensaje = encodeURIComponent(`Hola, vi tu local en Comerciantes y quería consultar sobre...`);
    btnWa.href = `https://wa.me/${numeroWhatsapp}?text=${mensaje}`;
    btnWa.addEventListener('click', () => registrarEvento('click_whatsapp', { comercio_id: c.id, origen: 'sticky-bar' }));
    hayAlgunBoton = true;
  } else {
    btnWa.style.display = 'none';
  }

  if (c.telefono) {
    btnLlamar.href = `tel:${c.telefono}`;
    btnLlamar.addEventListener('click', () => registrarEvento('click_llamar', { comercio_id: c.id, origen: 'sticky-bar' }));
    hayAlgunBoton = true;
  } else {
    btnLlamar.style.display = 'none';
  }

  if (c.latitud && c.longitud) {
    btnLlegar.href = `https://www.google.com/maps/dir/?api=1&destination=${c.latitud},${c.longitud}`;
    btnLlegar.addEventListener('click', () => registrarEvento('click_como_llegar', { comercio_id: c.id, origen: 'sticky-bar' }));
    hayAlgunBoton = true;
  } else if (c.direccion) {
    btnLlegar.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.direccion)}`;
    btnLlegar.addEventListener('click', () => registrarEvento('click_como_llegar', { comercio_id: c.id, origen: 'sticky-bar' }));
    hayAlgunBoton = true;
  } else {
    btnLlegar.style.display = 'none';
  }

  if (hayAlgunBoton) bar.style.display = 'flex';
}

// Showcase de productos/servicios (sección 3.C del plan) - solo llega poblado desde el backend
// si el comercio es Premium, no hace falta chequear el plan de nuevo acá.
function poblarProductos(productos) {
  if (!productos || !productos.length) return;
  const grid = document.getElementById('productos-grid');
  grid.innerHTML = productos.map((p) => `
    <div class="producto-card">
      ${p.foto_url ? `<img class="producto-card-foto" src="${p.foto_url}" alt="${p.nombre}" loading="lazy">` : ''}
      <div class="producto-card-body">
        <div class="producto-card-nombre">${p.nombre}</div>
        ${p.descripcion ? `<div class="producto-card-desc">${p.descripcion}</div>` : ''}
        ${p.precio ? `<div class="producto-card-precio">$${Number(p.precio).toLocaleString('es-AR')}</div>` : ''}
      </div>
    </div>
  `).join('');
  document.getElementById('productos-section').style.display = 'block';
}

// Testimonios (sección 3.D del plan) - solo los aprobados por el admin llegan del backend.
function poblarTestimonios(testimonios) {
  if (!testimonios || !testimonios.length) return;
  const grid = document.getElementById('testimonios-grid');
  grid.innerHTML = testimonios.map((t) => `
    <div class="testimonio-card">
      <p class="testimonio-card-texto">${t.texto}</p>
      <p class="testimonio-card-autor">${t.autor_nombre}</p>
    </div>
  `).join('');
  document.getElementById('testimonios-section').style.display = 'block';
}

function poblarFicha(c) {
  const esPago = !!c.plan_info && c.plan_info.plan_slug !== 'gratuito';
  const numeroWhatsapp = c.whatsapp ? c.whatsapp.replace(/\D/g, '') : null;
  const icono = ICONO_FA_CATEGORIA[c.categoria_slug] || 'fa-tag';
  const categoriaTexto = c.categoria_nombre || 'Comercio';
  const localidadTexto = c.localidad_nombre || 'Colón, Buenos Aires';

  // Cada carga de una ficha completa cuenta como "visita" real para el Panel de Estadísticas
  // Premium (sección 4 de la matriz: "visitas, clicks a WhatsApp" como justificador del gasto).
  registrarEvento('visita_ficha', { comercio_id: c.id, origen: 'single-comercio' });

  poblarBadgeAbierto(c.horarios_json);
  if (esPago) poblarStickyCtaBar(c, numeroWhatsapp);
  poblarProductos(c.productos);
  poblarTestimonios(c.testimonios);

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
    ctaLlamar.addEventListener('click', () => registrarEvento('click_llamar', { comercio_id: c.id, origen: 'header' }));
  } else {
    ctaLlamar.style.display = 'none';
  }

  // Floating WhatsApp - mensaje precargado real (sección 3.A del plan), no solo el número pelado.
  const mensajeWaDefault = encodeURIComponent(`Hola, vi tu local en Comerciantes y quería consultar sobre...`);
  const floatWa = document.getElementById('float-whatsapp');
  if (esPago && numeroWhatsapp) {
    floatWa.href = `https://wa.me/${numeroWhatsapp}?text=${mensajeWaDefault}`;
    floatWa.style.display = 'flex';
    floatWa.addEventListener('click', () => registrarEvento('click_whatsapp', { comercio_id: c.id, origen: 'float' }));
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
      html += `<a href="https://wa.me/${numeroWhatsapp}?text=${mensajeWaDefault}" target="_blank" class="contact-btn whatsapp-btn-simple" id="cierre-btn-whatsapp"><i class="fa fa-whatsapp"></i> ESCRIBIR POR WHATSAPP</a>`;
    }
    if (c.telefono) {
      html += `<a href="tel:${c.telefono}" class="contact-btn phone-btn-simple" id="cierre-btn-llamar"><i class="fa fa-phone"></i> LLAMAR</a>`;
    }
    botones.innerHTML = html;
    const btnWaCierre = document.getElementById('cierre-btn-whatsapp');
    if (btnWaCierre) btnWaCierre.addEventListener('click', () => registrarEvento('click_whatsapp', { comercio_id: c.id, origen: 'cierre' }));
    const btnLlamarCierre = document.getElementById('cierre-btn-llamar');
    if (btnLlamarCierre) btnLlamarCierre.addEventListener('click', () => registrarEvento('click_llamar', { comercio_id: c.id, origen: 'cierre' }));
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
    if (comercio.acceso_restringido) {
      mostrarRestringido(comercio);
      return;
    }
    poblarFicha(comercio);
    ocultarCarga();
  } catch (e) {
    mostrarError();
  }
})();
