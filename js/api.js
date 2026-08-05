// Cliente de la API pública de Web-MVP (comerciantes.com.ar).
// Mismo backend que consumen comerciantes.com.ar y la app móvil.
const API_BASE_URL = 'https://backend-production-196c.up.railway.app';

async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Error ${response.status} al llamar ${path}`);
  }
  return response.json();
}

function fetchComercio(id) {
  return apiGet(`/api/comercios/${id}`);
}

// Registra un evento de tracking (búsqueda, clic en "Ver más", clic de contacto, etc.) - sección
// 5.2 del plan de tarjetas/landing, alimenta el reporte de "clics perdidos" y el Panel de
// Estadísticas Premium. Nunca debe romper la UI si falla: es fire-and-forget.
function registrarEvento(tipo, { comercio_id, termino_busqueda, origen } = {}) {
  try {
    fetch(`${API_BASE_URL}/api/tracking/evento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, comercio_id, termino_busqueda, origen }),
      keepalive: true
    }).catch(() => {});
  } catch (e) {
    // Nunca bloquear la navegación real del usuario por un evento de analítica.
  }
}

// Pide reclamar el perfil de un comercio ("¿Sos el dueño? Reclamá tu perfil" - sección 5.1).
function reclamarPerfil(comercioId, datos) {
  return fetch(`${API_BASE_URL}/api/comercios/${comercioId}/reclamar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Error al enviar el reclamo.');
    return data;
  });
}
