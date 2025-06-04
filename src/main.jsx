// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // App.jsx NO tendría AuthProvider ni BrowserRouter
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom'; // BrowserRouter aquí

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>  {/* BrowserRouter envuelve AuthProvider y App */}
      <AuthProvider> {/* AuthProvider envuelve App */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);