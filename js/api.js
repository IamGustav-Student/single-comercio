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
