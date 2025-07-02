import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthDispatch, useAuthState } from '../contexts/AuthContext';
import authService from '../services/authService';

function RegisterPage() {
  const { 
    register, 
    handleSubmit, 
    watch, 
    setError, // Importante para establecer errores del backend
    formState: { errors, isSubmitting } // isSubmitting es mejor que isLoading local para el botón
  } = useForm({
    mode: 'onBlur', // Validar al salir del campo
    // No establezcas defaultValues aquí si no quieres que se reinicie al cambiar un prop
  });

  const dispatch = useAuthDispatch();
  const { isLoading: isAuthLoading } = useAuthState(); // Solo para deshabilitar el botón
  const navigate = useNavigate();
  const password = watch("password", "");

  const onSubmit = async (data) => {
    // No necesitamos dispatch({ type: 'REQUEST_START' }) aquí si el estado
    // de carga lo maneja el propio formulario con isSubmitting.
    // Esto evita re-renders innecesarios por el contexto.
    try {
      const userData = {
        email: data.email,
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        password: data.password,
        profile: {
          address: data.address || "",
          document: data.document || "",
          phone: data.phone || "",
        }
      };

      const registrationResponse = await authService.register(userData);

      // Si el registro es exitoso, la lógica de login se dispara
      // (obtener perfil, despachar success, etc.)
      localStorage.setItem('accessToken', registrationResponse.access);
      localStorage.setItem('refreshToken', registrationResponse.refresh);
      const userProfile = await authService.getProfile();
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: {
          accessToken: registrationResponse.access,
          refreshToken: registrationResponse.refresh,
          user: userProfile,
        },
      });
      toast.success('¡Registro exitoso! Bienvenido.');
      navigate('/');
      
    } catch (err) {
      let generalToastError = "Error en el registro. Por favor, revisa los campos.";
      
      if (err.response && err.response.data) {
        const backendErrors = err.response.data;
        console.error("Errores del backend:", backendErrors);

        let fieldErrorsHandled = false;
        // Iterar sobre las claves del objeto de errores del backend
        Object.keys(backendErrors).forEach(fieldName => {
          // El nombre del campo en el backend ('firstName', 'lastName')
          // debe coincidir con el nombre que le diste en register()
          if (register(fieldName)) { // Verifica si el campo existe en el formulario
            setError(fieldName, {
              type: 'server',
              message: Array.isArray(backendErrors[fieldName]) ? backendErrors[fieldName][0] : backendErrors[fieldName]
            });
            fieldErrorsHandled = true;
          }
        });
        
        // Si hubo errores de campo, el toast puede ser genérico.
        // Si no, usamos el error 'detail' o 'non_field_errors'.
        if (!fieldErrorsHandled) {
          if (backendErrors.detail) generalToastError = backendErrors.detail;
          else if (Array.isArray(backendErrors.non_field_errors)) generalToastError = backendErrors.non_field_errors[0];
        }
      }
      
      // Solo mostramos un toast de error, no modificamos el AuthContext
      // para no causar re-renders que limpien el formulario.
      toast.error(generalToastError);
    }
  };

  // El JSX no necesita cambiar mucho, pero aquí está completo por si acaso
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-6 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 bg-white shadow-md rounded-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-color-primary">Crear Cuenta</h2>
        
        {/* Ya no mostramos un error global aquí, los errores van por campo */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              id="firstName"
              type="text"
              {...register("firstName", { required: "Tu nombre es requerido" })}
              className={`mt-1 block w-full input-style ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellido *</label>
            <input
              id="lastName"
              type="text"
              {...register("lastName", { required: "Tu apellido es requerido" })}
              className={`mt-1 block w-full input-style ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
            <input id="email" type="email" {...register("email", { required: "El email es obligatorio", pattern: { value: /^\S+@\S+\.\S+$/, message: "Formato de email inválido" } })} className={`mt-1 block w-full input-style ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario *</label>
            <input id="username" type="text" {...register("username", { required: "El nombre de usuario es obligatorio", minLength: { value: 3, message: "Mínimo 3 caracteres" } })} className={`mt-1 block w-full input-style ${errors.username ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña *</label>
            <input id="password" type="password" {...register("password", { required: "La contraseña es obligatoria", minLength: { value: 8, message: "La contraseña debe tener al menos 8 caracteres" } })} className={`mt-1 block w-full input-style ${errors.password ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Contraseña *</label>
            <input id="confirmPassword" type="password" {...register("confirmPassword", { required: "Confirma tu contraseña", validate: value => value === password || "Las contraseñas no coinciden" })} className={`mt-1 block w-full input-style ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>
        
        <hr className="my-6"/>
        <h3 className="text-lg font-semibold mb-3 text-color-secondary">Información Adicional (Opcional)</h3>
        
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
          <input id="address" type="text" {...register("address")} className="input-style w-full mt-1 border-gray-300" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="document" className="block text-sm font-medium text-gray-700">Documento</label>
            <input id="document" type="text" {...register("document")} className="input-style w-full mt-1 border-gray-300" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input id="phone" type="tel" {...register("phone")} className="input-style w-full mt-1 border-gray-300" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isAuthLoading}
          className="w-full bg-color-accent1 hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {isSubmitting || isAuthLoading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
        <p className="mt-4 text-center text-sm">
          ¿Ya tienes cuenta? <Link to="/login" className="font-medium text-color-accent2 hover:text-color-accent1">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;