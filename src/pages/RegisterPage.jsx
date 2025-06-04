import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthDispatch, useAuthState } from '../contexts/AuthContext';
import authService from '../services/authService';

function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    mode: 'onBlur', // Validar al salir del campo
  });
  const dispatch = useAuthDispatch();
  const { isLoading, error: authError } = useAuthState();
  const navigate = useNavigate();
  const password = watch("password", ""); // Para la validación de confirmar contraseña

  const onSubmit = async (data) => {
    dispatch({ type: 'REQUEST_START' });
    try {
      // Prepara los datos para el backend.
      // Si tu UserRegistrationSerializer espera un objeto 'profile' anidado:
      const userData = {
        email: data.email,
        username: data.username, // Si tu CustomUser todavía tiene username y lo quieres
        password: data.password,
        profile: { // Este objeto 'profile' debe coincidir con lo que espera tu UserRegistrationSerializer
          address: data.address || "", // Enviar cadena vacía si no se proporciona y es opcional
          document: data.document || "",
          phone: data.phone || "",
        }
      };
      // Si tu endpoint de registro NO espera 'profile' anidado, solo envía:
      // const userData = { email: data.email, username: data.username, password: data.password };

      const registrationResponse = await authService.register(userData);
      // registrationResponse debería ser algo como { access, refresh, user_id, email }

      // Después de registrar y obtener tokens, obtener el perfil completo del usuario
      // El interceptor de apiClient usará el nuevo accessToken de registrationResponse
      // si authService.register guarda los tokens en localStorage inmediatamente.
      // O, si authService.register devuelve los tokens, puedes pasarlos a authService.getProfile si es necesario.
      // Por simplicidad, asumimos que el token se setea antes de llamar a getProfile
      // o que getProfile usa el token más reciente del estado/localStorage.
      localStorage.setItem('accessToken', registrationResponse.access); // Asegurar que el token esté disponible para getProfile
      localStorage.setItem('refreshToken', registrationResponse.refresh);


      const userProfile = await authService.getProfile();

      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: {
          accessToken: registrationResponse.access,
          refreshToken: registrationResponse.refresh,
          user: userProfile, // El objeto UserProfile completo
        },
      });
      toast.success('¡Registro exitoso! Bienvenido.');
      navigate('/'); // Redirigir al home o dashboard
    } catch (err) {
      let errorMsg = 'Error en el registro.';
      if (err.response && err.response.data) {
        // Intentar obtener mensajes de error específicos del backend
        const backendErrors = err.response.data;
        if (backendErrors.email) errorMsg = `Email: ${backendErrors.email[0]}`;
        else if (backendErrors.username) errorMsg = `Username: ${backendErrors.username[0]}`;
        else if (backendErrors.password) errorMsg = `Password: ${backendErrors.password[0]}`;
        else if (typeof backendErrors === 'string') errorMsg = backendErrors;
        else if (backendErrors.detail) errorMsg = backendErrors.detail;
        // Puedes añadir más lógica para manejar errores de 'profile' si los tienes
      }
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMsg } });
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-6">
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 bg-white shadow-md rounded-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-color-primary">Crear Cuenta</h2>

        {authError && <p className="text-red-500 text-sm mb-4 text-center">{authError}</p>}

        {/* Campos del Usuario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              id="email"
              type="email"
              {...register("email", { 
                required: "El email es obligatorio", 
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Formato de email inválido" } 
              })}
              className={`mt-1 block w-full input-style ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Nombre de Usuario { /* Si username es opcional, indícalo */ }
            </label>
            <input
              id="username"
              type="text"
              {...register("username", { 
                // required: "El nombre de usuario es obligatorio", // Descomenta si es obligatorio
                minLength: { value: 3, message: "Mínimo 3 caracteres" } 
              })}
              className={`mt-1 block w-full input-style ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña *</label>
            <input
              id="password"
              type="password"
              {...register("password", { 
                required: "La contraseña es obligatoria", 
                minLength: { value: 8, message: "La contraseña debe tener al menos 8 caracteres" } 
              })}
              className={`mt-1 block w-full input-style ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Contraseña *</label>
            <input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword", {
                required: "Confirma tu contraseña",
                validate: value => value === password || "Las contraseñas no coinciden"
              })}
              className={`mt-1 block w-full input-style ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>
        
        {/* Campos del Perfil (Opcionales o como los necesites) */}
        <hr className="my-6"/>
        <h3 className="text-lg font-semibold mb-3 text-color-secondary">Información Adicional (Opcional)</h3>
        
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
          <input
            id="address"
            type="text"
            {...register("address")}
            className="mt-1 block w-full input-style border-gray-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="document" className="block text-sm font-medium text-gray-700">Documento</label>
            <input
              id="document"
              type="text"
              {...register("document")}
              className="mt-1 block w-full input-style border-gray-300"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              className="mt-1 block w-full input-style border-gray-300"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-color-accent1 hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {isLoading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
        <p className="mt-4 text-center text-sm">
          ¿Ya tienes cuenta? <Link to="/login" className="font-medium text-color-accent2 hover:text-color-accent1">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
}
export default RegisterPage;