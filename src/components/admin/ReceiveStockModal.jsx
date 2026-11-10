// src/components/admin/ReceiveStockModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruckLoading, FaCheckCircle, FaBoxes, FaWarehouse } from 'react-icons/fa';
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

const ReceiveStockModal = ({ isOpen, onClose, products = [], onSuccess }) => {
  // Cantidades a recibir por cada producto: { [productId]: number }
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar cantidades con el 100% del stock en tránsito
  useEffect(() => {
    if (!isOpen || !products || products.length === 0) return;

    const initialQtys = {};
    products.forEach(p => {
      initialQtys[p.id] = p.incoming_stock || 0;
    });
    setQuantities(initialQtys);
    setNotes(products.length === 1 
      ? `Recepción en bodega de ${products[0].name}` 
      : `Recepción masiva de stock en tránsito (${products.length} productos)`
    );
  }, [isOpen, products]);

  if (!isOpen || !products || products.length === 0) return null;

  const isSingle = products.length === 1;
  const singleProduct = isSingle ? products[0] : null;

  const handleQuantityChange = (productId, val, maxVal) => {
    const num = parseInt(val, 10);
    const clamped = isNaN(num) ? 0 : Math.max(0, Math.min(num, maxVal));
    setQuantities(prev => ({ ...prev, [productId]: clamped }));
  };

  const handleSetAllToMax = () => {
    const maxQtys = {};
    products.forEach(p => {
      maxQtys[p.id] = p.incoming_stock || 0;
    });
    setQuantities(maxQtys);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que al menos se reciba 1 unidad
    const itemsToReceive = products
      .map(p => ({
        product_id: p.id,
        quantity: quantities[p.id] || 0,
        purchase_price: p.purchase_price,
      }))
      .filter(item => item.quantity > 0);

    if (itemsToReceive.length === 0) {
      toast.error("Debes ingresar al menos 1 unidad para recibir en bodega.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSingle) {
        const item = itemsToReceive[0];
        const res = await productService.receiveStock(singleProduct.id, {
          quantity: item.quantity,
          purchase_price: singleProduct.purchase_price,
          notes: notes.trim(),
        });
        toast.success(res.message || `Stock de ${singleProduct.name} recibido exitosamente.`);
      } else {
        const res = await productService.receiveMultipleStock(itemsToReceive);
        toast.success(res.message || `Se recibió stock para ${itemsToReceive.length} productos.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error al recibir stock:", err);
      let msg = "Error al recibir stock.";
      if (typeof err === 'string') {
        if (err.includes('<html') || err.includes('<!DOCTYPE') || err.includes('<!doctype')) {
          msg = "Error interno del servidor (500). Por favor intenta de nuevo.";
        } else {
          msg = err;
        }
      } else if (err?.error) {
        msg = err.error;
      } else if (err?.detail) {
        msg = err.detail;
      } else if (err?.message) {
        msg = err.message;
      } else if (typeof err === 'object') {
        try {
          const values = Object.values(err).flat();
          if (values.length > 0) msg = values.join(' ');
        } catch {
          // fallback
        }
      }
      if (typeof msg === 'string' && msg.length > 200) {
        msg = msg.substring(0, 197) + '...';
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalUnitsToReceive = Object.values(quantities).reduce((acc, q) => acc + (q || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-700 rounded-xl text-white shadow-sm">
              <FaWarehouse size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isSingle ? 'Recibir Stock en Bodega' : `Recepción Masiva de Stock (${products.length} productos)`}
              </h2>
              <p className="text-xs text-emerald-200">
                Pasa las unidades desde "Tránsito" a "Stock Físico" y recalcula el costo promedio automáticamente
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-emerald-300 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-emerald-800"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {isSingle ? (
            /* Vista individual */
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                  Producto a recibir
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  {singleProduct.name}
                </h3>
                <div className="mt-1 flex items-center space-x-3 text-xs text-gray-600">
                  {singleProduct.brand?.name && <span>Marca: <strong>{singleProduct.brand.name}</strong></span>}
                  {singleProduct.purchase_price && (
                    <span>Costo Compra: <strong>{formatCurrency(singleProduct.purchase_price)}</strong></span>
                  )}
                </div>
              </div>

              {/* Indicadores de inventario */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-xs font-semibold text-blue-700 block">Stock en Tránsito Pendiente</span>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {singleProduct.incoming_stock} <span className="text-sm font-normal text-blue-700">un.</span>
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-xs font-semibold text-gray-600 block">Stock Actual en Bodega</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {singleProduct.stock} <span className="text-sm font-normal text-gray-600">un.</span>
                  </p>
                </div>
              </div>

              {/* Cantidad a recibir */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Cantidad que llegó físicamente a bodega <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max={singleProduct.incoming_stock}
                    value={quantities[singleProduct.id] ?? singleProduct.incoming_stock}
                    onChange={(e) => handleQuantityChange(singleProduct.id, e.target.value, singleProduct.incoming_stock)}
                    className="w-32 px-4 py-2.5 text-lg font-mono font-bold text-center border-2 border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-400 text-gray-900"
                    required
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(singleProduct.id, singleProduct.incoming_stock, singleProduct.incoming_stock)}
                      className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                    >
                      Recibir Todo ({singleProduct.incoming_stock})
                    </button>
                    {singleProduct.incoming_stock > 1 && (
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(singleProduct.id, Math.floor(singleProduct.incoming_stock / 2), singleProduct.incoming_stock)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Recibir Mitad ({Math.floor(singleProduct.incoming_stock / 2)})
                      </button>
                    )}
                  </div>
                </div>

                {/* Previsualización del nuevo estado */}
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <span>Resultado tras la recepción:</span>
                  <div className="space-x-3 font-semibold">
                    <span>Nuevo Stock en Bodega: <strong>{singleProduct.stock + (quantities[singleProduct.id] || 0)} un.</strong></span>
                    <span>Tránsito Restante: <strong>{Math.max(0, singleProduct.incoming_stock - (quantities[singleProduct.id] || 0))} un.</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Vista múltiple */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Ajusta la cantidad recibida para cada producto seleccionado:
                </span>
                <button
                  type="button"
                  onClick={handleSetAllToMax}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Recibir el 100% de todos
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5">Producto</th>
                      <th className="px-3 py-2.5 text-center">En Bodega</th>
                      <th className="px-3 py-2.5 text-center">Pendiente</th>
                      <th className="px-3 py-2.5 text-center w-28">Recibir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {p.name}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600 font-mono">
                          {p.stock}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-blue-600 font-mono">
                          {p.incoming_stock}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max={p.incoming_stock}
                            value={quantities[p.id] ?? p.incoming_stock}
                            onChange={(e) => handleQuantityChange(p.id, e.target.value, p.incoming_stock)}
                            className="w-20 px-2 py-1 text-center font-bold border border-emerald-400 rounded-lg text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between font-semibold">
                <span>Total de unidades a ingresar en bodega:</span>
                <strong className="text-base text-emerald-900">{totalUnitsToReceive} unidades</strong>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Notas u observaciones de la recepción (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Factura #1234 de proveedor XYZ, llegó completo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
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
              disabled={isSubmitting || totalUnitsToReceive === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center disabled:opacity-50"
            >
              <FaCheckCircle className="mr-2" />
              {isSubmitting ? 'Procesando ingreso...' : `Confirmar Ingreso (${totalUnitsToReceive} un.)`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ReceiveStockModal;

