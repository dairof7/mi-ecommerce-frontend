// src/contexts/CartContext.jsx
import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { useAuthState } from './AuthContext'; // Para saber si el usuario está logueado
import { toast } from 'react-toastify';

const CartStateContext = createContext(undefined);
const CartDispatchContext = createContext(undefined);

const initialCartState = {
  items: [],          // Array de objetos CartItem del backend
  itemCount: 0,       // Número total de items individuales (suma de cantidades)
  totalAmount: 0,     // Suma total de los subtotales de los items
  cartId: null,       // ID del carrito del backend
  isLoading: false,   // Para operaciones del carrito
  error: null,
};

function calculateCartTotals(items) {
  if (!items || items.length === 0) {
    return { itemCount: 0, totalAmount: 0 };
  }
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal || item.product_sale_price * item.quantity), 0);
  // Asegúrate que 'subtotal' o 'product_sale_price' estén disponibles y sean numéricos.
  // Tu schema de CartItem tiene 'subtotal' y 'product_sale_price' como string/decimal.
  return { itemCount, totalAmount };
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'REQUEST_START':
      return { ...state, isLoading: true, error: null };
    case 'REQUEST_FAILURE':
      return { ...state, isLoading: false, error: action.payload.error };
    case 'LOAD_CART_SUCCESS':
      const totals = calculateCartTotals(action.payload.cart.items);
      return {
        ...state,
        items: action.payload.cart.items || [],
        itemCount: totals.itemCount,
        totalAmount: totals.totalAmount,
        cartId: action.payload.cart.id,
        isLoading: false,
        error: null,
      };
    case 'ADD_ITEM_SUCCESS': // Podría simplemente recargar el carrito o actualizar localmente
    case 'UPDATE_ITEM_SUCCESS': // Podría simplemente recargar el carrito o actualizar localmente
    case 'REMOVE_ITEM_SUCCESS': // Podría simplemente recargar el carrito o actualizar localmente
      // Por simplicidad, después de estas acciones, se recargará el carrito desde el backend.
      // Una optimización sería actualizar el estado local directamente.
      // Si la API devuelve el carrito actualizado, úsalo:
      // const updatedTotals = calculateCartTotals(action.payload.cart.items);
      // return {
      //   ...state,
      //   items: action.payload.cart.items,
      //   itemCount: updatedTotals.itemCount,
      //   totalAmount: updatedTotals.totalAmount,
      //   isLoading: false,
      // };
      // Por ahora, solo indicamos que la carga terminó, y el useEffect recargará
      return { ...state, isLoading: false, error: null };
    
    case 'CLEAR_CART_SUCCESS': // Después de crear una cotización
      return { 
        ...initialCartState, 
        isLoading: false,
        cartId: state.cartId // Mantener el ID del carrito si el backend no lo elimina
      };
    case 'SET_CART_LOADING':
        return { ...state, isLoading: action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const { isAuthenticated, user } = useAuthState(); // Para saber si cargar el carrito

  const loadCart = useCallback(async () => {
    if (!isAuthenticated || !user) { // No cargar si no está autenticado o no hay usuario
      dispatch({ type: 'CLEAR_CART_SUCCESS' }); // Limpiar carrito local si se desloguea
      return;
    }
    dispatch({ type: 'REQUEST_START' });
    try {
      const cartData = await cartService.getCart();
      if (cartData) {
        dispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: cartData } });
      } else {
        // No hay carrito en el backend (ej. nuevo usuario), inicializar uno vacío
        dispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: { items: [], id: null } }});
      }
    } catch (error) {
      dispatch({ type: 'REQUEST_FAILURE', payload: { error: "Error al cargar el carrito" } });
      // No mostramos toast aquí, la página que lo usa puede hacerlo
    }
  }, [isAuthenticated, user]); // Dependencias: recargar si cambia el estado de autenticación o el usuario

  // Cargar el carrito cuando el usuario se autentica o al montar el provider si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      // Si el usuario se desloguea, limpiar el carrito del estado
      dispatch({ type: 'CLEAR_CART_SUCCESS' });
    }
  }, [isAuthenticated, user, loadCart]);

  return (
    <CartStateContext.Provider value={state}>
      <CartDispatchContext.Provider value={dispatch}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCartState() {
  const context = useContext(CartStateContext);
  if (context === undefined) {
    throw new Error('useCartState must be used within a CartProvider');
  }
  return context;
}

export function useCartDispatch() {
  const context = useContext(CartDispatchContext);
  if (context === undefined) {
    throw new Error('useCartDispatch must be used within a CartProvider');
  }
  return context;
}