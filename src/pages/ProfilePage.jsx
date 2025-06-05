import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuthState, useAuthDispatch } from '../contexts/AuthContext';
import authService from '../services/authService';
import { FaUserEdit, FaSave, FaSpinner } from 'react-icons/fa';

const Loader = ({ message = "Cargando..." }) => ( // Un loader simple
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-color-secondary"></div>
    <p className="ml-3 text-color-secondary">{message}</p>
  </div>
);

function ProfilePage() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuthState();
  const dispatch = useAuthDispatch();
  
  const { 
    register, 
    handleSubmit, 
    reset, // Para resetear el formulario con los datos del usuario
    formState: { errors, isDirty, isSubmitting } // isDirty para saber si el form cambió
  } = useForm({
    defaultValues: { // Valores por defecto iniciales
      address: '',
      document: '',
      phone: ''
    }
  });

  // Efecto para poblar el formulario cuando los datos del usuario (perfil) estén disponibles
  useEffect(() => {
    if (user) { // 'user' en AuthContext es el UserProfile
      reset({
        address: user.address || '',
        document: user.document || '',
        phone: user.phone || '',
      });
    }
  }, [user, reset]); // Se ejecuta cuando 'user' o 'reset' cambian

  const onSubmit = async (data) => {
    dispatch({ type: 'REQUEST_START' }); // Podrías tener un tipo específico como 'PROFILE_UPDATE_REQUEST'
    try {
      // El payload solo debe contener los campos que el serializador de UserProfile espera para PUT/PATCH
      // Tu schema.json para PUT /api/accounts/profile/ espera un UserProfile completo,
      // que incluye 'user' (readOnly), 'address', 'document', 'phone'.
      // Nos aseguramos de enviar solo los campos editables.
      const profileDataToUpdate = {
        address: data.address,
        document: data.document,
        phone: data.phone,
      };

      const updatedProfile = await authService.updateProfile(profileDataToUpdate);
      
      // Actualizar el estado del usuario en AuthContext con el perfil actualizado
      dispatch({ type: 'PROFILE_UPDATE_SUCCESS', payload: { user: updatedProfile } });
      toast.success('¡Perfil actualizado exitosamente!');
      reset(updatedProfile); // Resetear el formulario con los nuevos datos para limpiar 'isDirty'
    } catch (err) {
      let errorMsg = "Error al actualizar el perfil.";
      if (err.response && err.response.data) {
        const backendErrors = err.response.data;
        // Construir un mensaje de error más detallado si el backend los devuelve
        const fieldErrors = Object.keys(backendErrors)
          .map(key => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(backendErrors[key]) ? backendErrors[key].join(', ') : backendErrors[key]}`)
          .join(' ');
        if (fieldErrors) errorMsg = fieldErrors;
        else if (backendErrors.detail) errorMsg = backendErrors.detail;
      }
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMsg } }); // O un 'PROFILE_UPDATE_FAILURE'
      toast.error(errorMsg);
    }
  };

  if (isAuthLoading && !user) {
    return <Loader message="Cargando perfil..." />;
  }

  if (!user && !isAuthLoading) { // Si terminó de cargar y no hay usuario (debería haber sido redirigido por ProtectedRoute)
    return (
        <div className="text-center py-10">
            <p className="text-xl text-red-500">No se pudo cargar la información del perfil. Por favor, intenta iniciar sesión de nuevo.</p>
            <Link to="/login" className="text-color-secondary hover:text-color-accent1 underline mt-4 inline-block">
                Ir a Login
            </Link>
        </div>
    );
  }
  
  // Si hay un error general del AuthContext que no sea de carga
  if (authError && !isAuthLoading) {
    return <div className="text-center py-10 text-red-500 text-xl">Error: {authError}</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-2xl">
        <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
            <FaUserEdit size={32} className="text-color-secondary mr-3" />
            <h1 className="text-2xl md:text-3xl font-bold text-color-primary">
                Mi Perfil
            </h1>
        </div>
        
        {/* Mostrar email y username (no editables aquí) */}
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Email:</p>
            <p className="text-md font-semibold text-gray-800">{user?.user_info || user?.email || 'No disponible'}</p> 
            {/* user.user_info es lo que definiste en UserProfileSerializer. user.email si accedes directo. */}
            
            {user?.user && ( // Si tienes username en tu CustomUser y lo quieres mostrar
              <>
                <p className="text-sm text-gray-500 mt-2">Nombre de Usuario:</p>
                <p className="text-md font-semibold text-gray-800">{user.user}</p>
              </>
            )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              id="address"
              rows={3}
              {...register("address", {
                // maxLength: { value: 255, message: "Máximo 255 caracteres" } // Si tienes validación
              })}
              className={`input-style w-full ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Tu dirección de envío o residencia"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
              Documento
            </label>
            <input
              id="document"
              type="text"
              {...register("document", {
                // pattern: { value: /^[A-Z0-9]+$/i, message: "Formato de documento inválido" } // Ejemplo
              })}
              className={`input-style w-full ${errors.document ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Tu número de documento"
            />
            {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              {...register("phone", {
                // pattern: { value: /^[0-9+-]{7,15}$/, message: "Formato de teléfono inválido" } // Ejemplo
              })}
              className={`input-style w-full ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Tu número de teléfono"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting || isAuthLoading} // Deshabilitar si no hay cambios o está enviando/cargando
              className="w-full flex items-center justify-center bg-color-secondary hover:bg-color-accent1 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-color-accent2 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSave className="mr-2" />
              )}
              {isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;