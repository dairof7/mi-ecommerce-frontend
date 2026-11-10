// src/components/admin/QuickTransitModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruckLoading, FaPlus, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import productService from '../../services/productService';

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(value);
};

const QuickTransitModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [mode, setMode] = useState('add'); // 'add' (sumar) o 'set' (fijar)
  const [qtyToAdd, setQtyToAdd] = useState('5');
  const [exactQty, setExactQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !product) return;
    setMode('add');
    setQtyToAdd('5');
    setExactQty(String(product.incoming_stock || 0));
    setPurchasePrice(product.purchase_price !== null && product.purchase_price !== undefined ? String(product.purchase_price) : '');
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentIncoming = product.incoming_stock || 0;
  const numAdd = parseInt(qtyToAdd, 10) || 0;
  const numExact = parseInt(exactQty, 10) || 0;

  const finalIncoming = mode === 'add' ? currentIncoming + numAdd : numExact;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (finalIncoming < 0) {
      toast.error("El stock en tránsito no puede ser negativo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        incoming_stock: finalIncoming,
      };

      if (purchasePrice !== '') {
        payload.purchase_price = parseFloat(purchasePrice) || null;
      }

      await productService.updateProduct(product.id, payload);
      toast.success(`Stock en tránsito de "${product.name}" actualizado a ${finalIncoming} un.`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error al actualizar tránsito:", err);
      toast.error("Error al actualizar el stock en tránsito.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="px-5 py-4 bg-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-700 rounded-lg text-white">
              <FaTruckLoading size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base">Añadir Stock en Tránsito</h3>
              <p className="text-[11px] text-blue-200">Registrar unidades compradas pendientes de entrega</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-blue-300 hover:text-white p-1 rounded-md hover:bg-blue-800"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Info del producto */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="font-bold text-sm text-gray-900">{product.name}</h4>
            <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
              <span>Tránsito Actual: <strong className="text-blue-600">{currentIncoming} un.</strong></span>
              <span>En Bodega: <strong>{product.stock || 0} un.</strong></span>
            </div>
          </div>

          {/* Selector de modo: Sumar vs Fijar */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${
                mode === 'add' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              + Sumar al actual
            </button>
            <button
              type="button"
              onClick={() => setMode('set')}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${
                mode === 'set' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Fijar total exacto
            </button>
          </div>

          {/* Inputs según modo */}
          {mode === 'add' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ¿Cuántas unidades compraste? (Se sumarán al tránsito)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={qtyToAdd}
                  onChange={(e) => setQtyToAdd(e.target.value)}
                  placeholder="5"
                  className="w-28 px-3 py-2 text-center text-lg font-bold font-mono border-2 border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-300 text-gray-900"
                  required
                />
                <div className="flex space-x-1.5">
                  {[5, 10, 20, 50].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQtyToAdd(String(val))}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nuevo total de stock en tránsito
              </label>
              <input
                type="number"
                min="0"
                value={exactQty}
                onChange={(e) => setExactQty(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 font-bold font-mono border border-gray-300 rounded-xl text-gray-900"
                required
              />
            </div>
          )}

          {/* Preview del nuevo total de tránsito */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <span>Nuevo stock en tránsito resultante:</span>
            <strong className="text-base text-blue-700 font-mono">{finalIncoming} unidades</strong>
          </div>

          {/* Precio de compra opcional */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Costo / Precio de Compra Unitario ($) (Opcional)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono text-gray-900"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">
              Si el lote se compró a un precio diferente, puedes actualizarlo aquí.
            </p>
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-xs font-semibold hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center disabled:opacity-50"
            >
              <FaSave className="mr-1.5" />
              {isSubmitting ? 'Guardando...' : 'Guardar Tránsito'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default QuickTransitModal;

