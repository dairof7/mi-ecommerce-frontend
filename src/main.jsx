// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // App.jsx NO tendría AuthProvider ni BrowserRouter
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom'; // BrowserRouter aquí
import { CartProvider } from './contexts/CartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>  {/* BrowserRouter envuelve AuthProvider y App */}
      <AuthProvider> {/* AuthProvider envuelve App */}
        <CartProvider> {/* Envuelve App (o lo que esté dentro de AuthProvider) */}
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);