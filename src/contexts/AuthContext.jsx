// src/contexts/AuthContext.jsx
import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import authService from '../services/authService'; // Asume que este archivo existe
import { setAuthDispatch as setApiAuthDispatch } from '../services/api'; // Para el interceptor

const AuthStateContext = createContext(undefined);
const AuthDispatchContext = createContext(undefined);

const initialState = {
  isAuthenticated: false,
  user: null, // Almacenará el objeto UserProfile devuelto por /api/accounts/profile/
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: true, // Inicia en true para verificar el estado de la sesión al cargar
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'REQUEST_START': // Acción genérica para iniciar carga
      return { ...state, isLoading: true, error: null };
    case 'LOGOUT_REQUEST': // <--- AÑADE ESTE CASE AQUÍ
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS': // Usado después de un login exitoso Y obtención de perfil
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user, // Objeto UserProfile completo
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        error: null,
      };
    case 'REGISTER_SUCCESS': // Similar a LOGIN_SUCCESS, asume que devuelve tokens y podemos obtener perfil
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        return {
            ...state,
            isAuthenticated: true,
            user: action.payload.user, // Objeto UserProfile completo
            accessToken: action.payload.accessToken,
            refreshToken: action.payload.refreshToken,
            isLoading: false,
            error: null,
        };
    case 'PROFILE_LOAD_SUCCESS': // Cuando se carga el perfil (ej. auto-login o después de login)
      return {
        ...state,
        isAuthenticated: true, // Si se carga el perfil, el usuario está autenticado
        user: action.payload.user,
        isLoading: false,
        error: null,
      };
    case 'PROFILE_UPDATE_SUCCESS':
      return {
        ...state,
        user: action.payload.user, // Actualiza el perfil del usuario en el estado
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return {
        ...initialState, // Reinicia al estado inicial pero manteniendo isLoading false
        accessToken: null,
        refreshToken: null,
        isLoading: false, // Termina la carga después del logout
      };
    case 'AUTH_ERROR': // Para errores de login, registro, o carga de perfil
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return {
        ...state, // Mantén algunos errores previos si es necesario, o usa initialState
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: action.payload.error,
      };
    case 'TOKEN_REFRESH_SUCCESS':
      localStorage.setItem('accessToken', action.payload.accessToken);
      return {
        ...state,
        accessToken: action.payload.accessToken,
        isAuthenticated: true, // Asegurarse de que sigue autenticado
        isLoading: false, // Termina la carga si esto se llamó durante una carga
      };
    case 'SET_LOADING': // Acción explícita para controlar isLoading si es necesario
        return { ...state, isLoading: action.payload };
    default:
      console.error("Unhandled action in authReducer:", action);
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Pasar el dispatch al módulo de API para que el interceptor pueda usarlo
  useEffect(() => {
    setApiAuthDispatch(dispatch);
  }, []); // Solo se ejecuta una vez al montar

  // Hook para verificar la sesión al cargar la aplicación
  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token && !state.user) { // Solo si hay token y no hemos cargado el usuario aún
      dispatch({ type: 'REQUEST_START' }); // Inicia la carga para obtener el perfil
      try {
        // No necesitas volver a setear accessToken aquí porque el interceptor de request lo usa
        const userProfile = await authService.getProfile();
        dispatch({ type: 'PROFILE_LOAD_SUCCESS', payload: { user: userProfile } });
      } catch (error) {
        console.error("Failed to auto-login with existing token (or get profile):", error);
        // Si getProfile falla (ej. token expirado y el refresh también falla o no hay refresh),
        // el interceptor de Axios debería haber manejado el logout si fue un 401.
        // Si no, lo hacemos aquí explícitamente.
        if (error.response && error.response.status === 401) {
            // El interceptor de Axios ya debería haber intentado refrescar y/o deslogueado.
            // Si llegamos aquí, es probable que el refresh token también sea inválido.
            dispatch({ type: 'LOGOUT' }); // Forzar logout si getProfile da 401
        } else {
            dispatch({ type: 'AUTH_ERROR', payload: { error: 'No se pudo verificar la sesión.' } });
        }
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false }); // No hay token, no hay usuario, terminar carga
    }
  }, [state.user]); // Depende de state.user para no re-ejecutar si el usuario ya está cargado

  useEffect(() => {
    if (initialState.isLoading) { // Solo ejecutar al montar si isLoading es true inicialmente
        checkAuthStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuthStatus]); // Ejecutar checkAuthStatus cuando el componente se monta

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState debe ser usado dentro de un AuthProvider');
  }
  return context;
}

export function useAuthDispatch() {
  const context = useContext(AuthDispatchContext);
  if (context === undefined) {
    throw new Error('useAuthDispatch debe ser usado dentro de un AuthProvider');
  }
  return context;
}