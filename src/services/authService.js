import apiClient from './api';
// Asumimos que el USERNAME_FIELD es 'email' como confirmaste
const USERNAME_FIELD = 'email';

const register = async (userData) => {
  // userData debe incluir: email, password, (opcionalmente username), y profile
  // { email: "...", password: "...", username: "...", profile: { address: "..."}}
  const response = await apiClient.post('/accounts/register/', userData);
  // La API de registro ahora devuelve el usuario y los tokens
  // Necesitamos extraer el user info para el AuthContext.
  // El schema.json dice que /api/accounts/register/ devuelve el schema User,
  // pero tu vista devuelve un objeto personalizado con tokens.
  // Vamos a asumir que la respuesta de tu vista de registro es:
  // { message, user_id, email, refresh, access }
  
  // Necesitamos obtener el perfil completo del usuario después del registro/login
  // o que el backend devuelva el objeto user completo.
  // Por ahora, creamos un objeto user básico.
  const user = {
      id: response.data.user_id,
      [USERNAME_FIELD]: response.data[USERNAME_FIELD] || response.data.email, // Usar email si username no está
      // ... otros campos básicos del usuario si los devuelve el registro
  };
  return { ...response.data, user }; // Añade el objeto user a la respuesta del servicio
};

const login = async (credentials) => {
  // credentials debe ser { email: "...", password: "..." }
  const payload = {
    [USERNAME_FIELD]: credentials.email, // Usa email como el campo de login
    password: credentials.password,
  };
  const response = await apiClient.post('/token/', payload);
  // La respuesta de /token/ es { access, refresh }
  // Necesitamos obtener los datos del usuario por separado.
  // Esto se puede hacer con una llamada a /api/accounts/profile/ después del login.
  // O, si tu backend devuelve datos del usuario con el token, úsalos.
  // Por ahora, asumimos que profile se obtiene por separado.
  return response.data; // Solo los tokens
};

const logout = async (refreshToken) => {
  // El cliente debe eliminar los tokens localmente independientemente de esta llamada.
  // Esta llamada es para invalidar el refresh token en el backend.
  try {
    await apiClient.post('/logout/', { refresh: refreshToken });
    return true;
  } catch (error) {
    console.error("Logout API call failed, but logging out client-side anyway.", error);
    // Incluso si falla, el cliente debe proceder con el logout local.
    return false; 
  }
};

const refreshToken = async (refresh) => {
  const response = await apiClient.post('/token/refresh/', { refresh });
  return response.data; // Debería devolver { access: "new_access_token" }
};

const getProfile = async () => {
    const response = await apiClient.get('/accounts/profile/');
    return response.data; // Devuelve el UserProfile completo (con user_info)
};

const updateProfile = async (profileData) => {
    const response = await apiClient.put('/accounts/profile/', profileData);
    return response.data;
};


export default {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
};