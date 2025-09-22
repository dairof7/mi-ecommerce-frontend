// src/contexts/CartContext.jsx
import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { useAuthState } from './AuthContext'; // Para saber si el usuario está logueado
import { toast } from 'react-toastify';

const CartStateContext = createContext(undefined);
const CartDispatchContext = createContext(undefined);

const initialCartStateDefinition = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  coupon: null,
  couponDiscount: 0,
  total: 0,
  cartId: null,
  isLoading: false,
  error: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'REQUEST_START':
      return { ...state, isLoading: true, error: null };
    case 'REQUEST_FAILURE':
      return { ...state, isLoading: false, error: action.payload.error };
    case 'LOAD_CART_SUCCESS':
      const cartData = action.payload.cart;
      if (cartData && cartData.items) { // Si tenemos un carrito con items
        return {
          ...state,
          items: cartData.items,
          itemCount: cartData.items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: cartData.subtotal,
          coupon: cartData.coupon,
          couponDiscount: cartData.coupon_discount,
          total: cartData.total,
          cartId: cartData.id,
          isLoading: false,
          error: null,
        };
      } else { // Carrito vacío o nulo del backend
        return { 
          ...initialCartStateDefinition,
          isLoading: false, // Asegura que la carga termine
          // cartId: cartData?.id || null // Podrías querer mantener el cartId si existe
        };
      }
    case 'ADD_ITEM_SUCCESS': // Podría simplemente recargar el carrito o actualizar localmente
    case 'UPDATE_ITEM_SUCCESS': // Podría simplemente recargar el carrito o actualizar localmente
    case 'REMOVE_ITEM_SUCCESS': // Podría simplemente recargar el carrito o actualizar localmente
      // Por simplicidad, después de estas acciones, se recargará el carrito desde el backend.
      // Las acciones ahora devuelven el carrito actualizado, así que LOAD_CART_SUCCESS se encarga.
      return { ...state, isLoading: false, error: null };
    
    case 'CLEAR_CART_SUCCESS': // Usado después de crear una cotización
      return { 
        ...initialCartStateDefinition, 
        isLoading: false,
        cartId: state.cartId 
      };
    case 'SET_CART_LOADING':
        return { ...state, isLoading: action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartStateDefinition);
  const { isAuthenticated, user } = useAuthState();

  const loadCart = useCallback(async () => {
    if (!isAuthenticated || !user) {
      dispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: null } }); // Limpiar al desloguear
      return;
    }
    dispatch({ type: 'REQUEST_START' });
    try {
      const cartApiResponse = await cartService.getCart();
      // cartApiResponse puede ser el objeto carrito o null
      dispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: cartApiResponse } });
    } catch (error) {
      console.error("CartContext: Error loading cart", error);
      dispatch({ type: 'REQUEST_FAILURE', payload: { error: "Error al cargar el carrito" } });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      dispatch({ type: 'LOAD_CART_SUCCESS', payload: { cart: null } }); // Limpiar si se desloguea
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