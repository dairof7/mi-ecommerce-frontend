// src/App.jsx
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FloatingButtons from './components/common/FloatingButtons';
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;
const FACEBOOK_PAGE_URL = import.meta.env.VITE_FACEBOOK_PAGE_URL;
// Componentes de Layout
import Navbar from './components/layout/Navbar';
// import Footer from './components/layout/Footer'; // Opcional

// Configuración del Router
import RouterConfig from './RouterConfig'; // Importa tu configuración de rutas

// AuthProvider y BrowserRouter estarán en main.jsx

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <RouterConfig /> {/* Renderiza tu componente de configuración de rutas aquí */}
      </main>
      <FloatingButtons 
        whatsappNumber={WHATSAPP_NUMBER} 
        facebookPageUrl={FACEBOOK_PAGE_URL} 
      />
      {/* <Footer /> */}
      <ToastContainer
        position="top-left"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App;