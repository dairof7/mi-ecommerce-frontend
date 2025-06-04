// import axios from 'axios';
// import { API_BASE_URL } from '../constants/apiConstants';

// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Interceptor para añadir el token JWT a las solicitudes
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('accessToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Interceptor de respuesta para manejar el refresco de token (lo haremos más adelante)

// export default apiClient;



import qs from 'qs';
import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConstants';
// Necesitaríamos una forma de acceder a dispatch del AuthContext aquí,
// lo cual es complicado. Una solución es un store separado para tokens o pasar
// el dispatch al configurar los interceptores.
// O, más simple, el componente que recibe el 401 maneja el logout.
// Por ahora, mantengamos el interceptor de request. El de response para refresh es más complejo.

let authDispatch = null; // Variable para almacenar el dispatch
export const setAuthDispatch = (dispatch) => { // Función para setear el dispatch desde AuthProvider
    authDispatch = dispatch;
};


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar 401 y refrescar token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) { // Si ya se está refrescando, encola la solicitud
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true; // Marcar para evitar bucles infinitos
      isRefreshing = true;

      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (refreshTokenValue) {
        try {
          const rs = await axios.post(`${API_BASE_URL}token/refresh/`, {
            refresh: refreshTokenValue,
          });
          const { access } = rs.data;
          localStorage.setItem('accessToken', access);
          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + access; // Actualizar header por defecto
          originalRequest.headers['Authorization'] = 'Bearer ' + access; // Actualizar header de la solicitud original
          processQueue(null, access); // Procesar cola con el nuevo token
          return apiClient(originalRequest); // Reintentar la solicitud original
        } catch (_error) {
          // Error al refrescar, desloguear al usuario
          processQueue(_error, null);
          if (authDispatch) { // Si el dispatch está disponible
            authDispatch({ type: 'LOGOUT' });
            // Opcional: Redirigir a login
            // window.location.href = '/login'; 
          } else {
            // Fallback si el dispatch no está disponible
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            // window.location.href = '/login';
          }
          return Promise.reject(_error);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No hay refresh token, desloguear
        if (authDispatch) {
            authDispatch({ type: 'LOGOUT' });
        } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
        // window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
export default apiClient;