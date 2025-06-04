// src/pages/LoginPage.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthDispatch, useAuthState } from '../contexts/AuthContext';
import authService from '../services/authService'; // Asegúrate que la ruta sea correcta

function LoginPage() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } // isSubmitting para deshabilitar el botón mientras se envía
  } = useForm({
    mode: 'onBlur', // Validar al salir del campo
  });

  const dispatch = useAuthDispatch();
  const { isLoading, error: authErrorState } = useAuthState(); // Renombrar error para evitar conflicto con errors de useForm
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    dispatch({ type: 'REQUEST_START' });
    try {
      // 1. Iniciar sesión para obtener tokens
      const tokenData = await authService.login({ 
        email: data.email,       // El USERNAME_FIELD es 'email'
        password: data.password 
      });
      // tokenData = { access: "...", refresh: "..." }

      // 2. Guardar tokens temporalmente para que la siguiente llamada los use (el interceptor lo hará)
      localStorage.setItem('accessToken', tokenData.access);
      localStorage.setItem('refreshToken', tokenData.refresh);

      // 3. Obtener el perfil del usuario completo
      const userProfile = await authService.getProfile(); 
      // userProfile es el objeto devuelto por /api/accounts/profile/
      // que incluye user_info (email/username) y los campos del perfil (address, etc.)
      
      // 4. Despachar LOGIN_SUCCESS con todos los datos
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          accessToken: tokenData.access, 
          refreshToken: tokenData.refresh,
          user: userProfile // Pasamos el perfil completo como 'user' al estado
        } 
      });

      toast.success('¡Bienvenido de nuevo!');
      navigate('/'); // Redirigir al home o a la página anterior si se guardó
    } catch (err) {
      let errorMsg = 'Error en el inicio de sesión. Verifica tus credenciales.';
      if (err.response && err.response.data) {
        // Intentar obtener mensajes de error específicos del backend
        const backendError = err.response.data;
        if (backendError.detail) {
          errorMsg = backendError.detail;
        } else if (Array.isArray(backendError.non_field_errors) && backendError.non_field_errors.length > 0) {
          errorMsg = backendError.non_field_errors[0];
        }
        // Podrías añadir más lógica para parsear otros formatos de error
      }
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMsg } });
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] py-6 px-4"> {/* Ajustar min-h para navbar/footer */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-xl rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-color-primary">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            o si no tienes cuenta{' '}
            <Link to="/register" className="font-medium text-color-accent2 hover:text-color-accent1">
              regístrate aquí
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Mostrar error global del AuthContext si existe */}
          {authErrorState && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              {authErrorState}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                {...register("email", { 
                  required: "El email es obligatorio", 
                  pattern: { 
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                    message: "Formato de email inválido" 
                  } 
                })}
                className={`appearance-none rounded-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-color-secondary focus:border-color-secondary focus:z-10 sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-t-md`}
                placeholder="Email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 px-1">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                {...register("password", { 
                  required: "La contraseña es obligatoria" 
                })}
                className={`appearance-none rounded-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-color-secondary focus:border-color-secondary focus:z-10 sm:text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-b-md`}
                placeholder="Contraseña"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 px-1">{errors.password.message}</p>}
            </div>
          </div>

          {/* <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-color-accent2 hover:text-color-accent1">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div> */}

          <div>
            <button
              type="submit"
              disabled={isLoading || isSubmitting} // Deshabilitar si AuthContext está cargando o el form se está enviando
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-color-secondary hover:bg-color-accent1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-color-accent2 disabled:opacity-70"
            >
              {isLoading || isSubmitting ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading || isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;