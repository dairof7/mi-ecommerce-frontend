import React, { useState, useMemo, useEffect } from 'react';
import { FaPlus, FaTrash, FaCalculator, FaSave, FaFolderOpen } from 'react-icons/fa';

const QuickQuotePage = () => {
    const [trm, setTrm] = useState(4000); // Valor por defecto
    const [marginType, setMarginType] = useState('cost'); // 'cost' o 'sale'
    const [items, setItems] = useState([
        { id: Date.now(), description: '', units: 1, costUsd: '', costCop: '', taxPercent: 0, shippingCost: 0, margin: 50 }
    ]);
    const [savedQuotes, setSavedQuotes] = useState([]);
    const [currentQuoteName, setCurrentQuoteName] = useState('');

    useEffect(() => {
        const storedQuotes = localStorage.getItem('solidstore_quick_quotes');
        if (storedQuotes) {
            try {
                setSavedQuotes(JSON.parse(storedQuotes));
            } catch (e) {
                console.error("Error parsing saved quotes", e);
            }
        }
    }, []);

    const handleSaveQuote = () => {
        if (!currentQuoteName.trim()) {
            alert('Por favor, ingresa un nombre para la cotización.');
            return;
        }
        const newQuote = {
            id: Date.now(),
            name: currentQuoteName,
            date: new Date().toLocaleDateString(),
            trm,
            marginType,
            items
        };
        const updatedQuotes = [newQuote, ...savedQuotes.filter(q => q.name !== currentQuoteName)];
        setSavedQuotes(updatedQuotes);
        localStorage.setItem('solidstore_quick_quotes', JSON.stringify(updatedQuotes));
        alert('Cotización guardada exitosamente.');
    };

    const handleLoadQuote = (quoteId) => {
        const quoteToLoad = savedQuotes.find(q => q.id === quoteId);
        if (quoteToLoad) {
            setTrm(quoteToLoad.trm);
            setMarginType(quoteToLoad.marginType);
            setItems(quoteToLoad.items);
            setCurrentQuoteName(quoteToLoad.name);
        }
    };

    const handleDeleteQuote = (quoteId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta cotización guardada?')) {
            const updatedQuotes = savedQuotes.filter(q => q.id !== quoteId);
            setSavedQuotes(updatedQuotes);
            localStorage.setItem('solidstore_quick_quotes', JSON.stringify(updatedQuotes));
        }
    };

    const handleAddItem = () => {
        setItems([
            ...items, 
            { id: Date.now(), description: '', units: 1, costUsd: '', costCop: '', taxPercent: 0, shippingCost: 0, margin: 50 }
        ]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleChange = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                // Si cambian USD, limpiamos COP para que se calcule.
                if (field === 'costUsd') updatedItem.costCop = '';
                // Si cambian COP, limpiamos USD
                if (field === 'costCop') updatedItem.costUsd = '';
                return updatedItem;
            }
            return item;
        }));
    };

    const calculatedItems = useMemo(() => {
        return items.map(item => {
            let costCop = parseFloat(item.costCop) || 0;
            const costUsd = parseFloat(item.costUsd) || 0;
            const parsedTrm = parseFloat(trm) || 0;
            
            if (costUsd > 0 && costCop === 0) {
                costCop = costUsd * parsedTrm;
            }
            
            const margin = parseFloat(item.margin) || 0;
            const units = parseInt(item.units) || 1;
            const shippingCost = parseFloat(item.shippingCost) || 0;
            const taxPercent = parseFloat(item.taxPercent) || 0;
            
            const itemCostWithTax = costCop * (1 + taxPercent / 100);
            const totalUnitCost = itemCostWithTax + shippingCost;
            let salePrice = 0;
            
            if (marginType === 'cost') {
                salePrice = totalUnitCost * (1 + margin / 100);
            } else {
                const effectiveMargin = Math.min(margin, 99.99); // Evitar división por cero
                salePrice = totalUnitCost / (1 - effectiveMargin / 100);
            }
            
            const profit = salePrice - totalUnitCost;
            
            return {
                ...item,
                calculatedCostCop: costCop,
                salePrice: salePrice,
                profit: profit,
                totalSale: salePrice * units,
                totalProfit: profit * units,
                totalCost: totalUnitCost * units
            };
        });
    }, [items, trm, marginType]);

    const totals = useMemo(() => {
        return calculatedItems.reduce((acc, item) => ({
            cost: acc.cost + item.totalCost,
            profit: acc.profit + item.totalProfit,
            sale: acc.sale + item.totalSale
        }), { cost: 0, profit: 0, sale: 0 });
    }, [calculatedItems]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <FaCalculator className="mr-3 text-color-primary" />
                        Cotizador Rápido
                    </h1>
                </div>

                {/* Gestión de Cotizaciones */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                    <h2 className="text-sm font-bold text-blue-800 mb-3 flex items-center">
                        <FaFolderOpen className="mr-2" /> Mis Cotizaciones Guardadas
                    </h2>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de la cotización actual</label>
                            <input 
                                type="text" 
                                placeholder="Ej. Cotización Cliente Juan"
                                value={currentQuoteName} 
                                onChange={(e) => setCurrentQuoteName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-color-primary focus:border-color-primary text-sm bg-white"
                            />
                        </div>
                        <button 
                            onClick={handleSaveQuote}
                            className="flex items-center px-4 py-2 bg-color-primary hover:bg-color-secondary text-white rounded-md transition-colors text-sm font-medium"
                        >
                            <FaSave className="mr-2" /> Guardar
                        </button>
                        
                        <div className="w-full md:w-1/3 mt-4 md:mt-0 md:ml-auto">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cargar cotización guardada</label>
                            <select 
                                className="w-full p-2 border border-gray-300 rounded focus:ring-color-primary text-sm bg-white"
                                onChange={(e) => {
                                    if(e.target.value) handleLoadQuote(Number(e.target.value));
                                    e.target.value = ""; // Reset select
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>Seleccione una cotización...</option>
                                {savedQuotes.map(q => (
                                    <option key={q.id} value={q.id}>{q.name} ({q.date})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {savedQuotes.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-blue-200">
                            <h3 className="text-xs font-bold text-gray-600 mb-2">Administrar Guardadas:</h3>
                            <div className="flex flex-wrap gap-2">
                                {savedQuotes.map(q => (
                                    <div key={q.id} className="flex items-center bg-white border border-gray-200 rounded-md px-2 py-1 text-xs shadow-sm">
                                        <span className="font-medium mr-2 text-gray-700">{q.name}</span>
                                        <button onClick={() => handleLoadQuote(q.id)} className="text-blue-500 hover:text-blue-700 mr-2 ml-2" title="Cargar">Cargar</button>
                                        <button onClick={() => handleDeleteQuote(q.id)} className="text-red-500 hover:text-red-700" title="Eliminar"><FaTrash size={10} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Configuración Global */}
                <div className="bg-gray-50 p-4 rounded-lg mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-200">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TRM (Tasa de Cambio $)</label>
                        <input 
                            type="number" 
                            value={trm} 
                            onChange={(e) => setTrm(e.target.value)}
                            className="w-full md:w-1/2 p-2 border border-gray-300 rounded focus:ring-color-primary focus:border-color-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">Usada para calcular costos si ingresas en USD.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cálculo de Ganancia</label>
                        <div className="flex items-center space-x-4 mt-2">
                            <label className="inline-flex items-center">
                                <input 
                                    type="radio" 
                                    name="marginType" 
                                    value="cost" 
                                    checked={marginType === 'cost'}
                                    onChange={() => setMarginType('cost')}
                                    className="form-radio text-color-primary h-4 w-4"
                                />
                                <span className="ml-2 text-gray-700">Sobre el Costo (Costo + %)</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input 
                                    type="radio" 
                                    name="marginType" 
                                    value="sale" 
                                    checked={marginType === 'sale'}
                                    onChange={() => setMarginType('sale')}
                                    className="form-radio text-color-primary h-4 w-4"
                                />
                                <span className="ml-2 text-gray-700">Sobre la Venta</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tabla de Artículos */}
                <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 min-w-[200px]">Artículo</th>
                                <th className="px-4 py-3 w-20">Unid.</th>
                                <th className="px-4 py-3 w-28">Costo USD</th>
                                <th className="px-4 py-3 w-32">Costo COP</th>
                                <th className="px-4 py-3 w-24">Imp. (%)</th>
                                <th className="px-4 py-3 w-28">Envío COP</th>
                                <th className="px-4 py-3 w-24">% Gan.</th>
                                <th className="px-4 py-3 whitespace-nowrap bg-blue-50">Precio Unit. (COP)</th>
                                <th className="px-4 py-3 whitespace-nowrap bg-green-50">Ganancia Art. (COP)</th>
                                <th className="px-4 py-3 whitespace-nowrap bg-blue-50 font-bold">Total Venta</th>
                                <th className="px-4 py-3 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculatedItems.map((item, index) => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                        <input 
                                            type="text" 
                                            placeholder="Descripción" 
                                            value={item.description}
                                            onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-color-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={item.units}
                                            onChange={(e) => handleChange(item.id, 'units', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-color-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            placeholder="USD" 
                                            value={item.costUsd}
                                            onChange={(e) => handleChange(item.id, 'costUsd', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-color-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            placeholder={item.calculatedCostCop ? Math.round(item.calculatedCostCop) : "COP"} 
                                            value={item.costCop}
                                            onChange={(e) => handleChange(item.id, 'costCop', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-color-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            placeholder="0"
                                            value={item.taxPercent}
                                            onChange={(e) => handleChange(item.id, 'taxPercent', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-color-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            placeholder="0"
                                            value={item.shippingCost}
                                            onChange={(e) => handleChange(item.id, 'shippingCost', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-color-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            value={item.margin}
                                            onChange={(e) => handleChange(item.id, 'margin', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-color-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-2 bg-blue-50 font-medium text-gray-900">
                                        {formatCurrency(item.salePrice)}
                                    </td>
                                    <td className="px-4 py-2 bg-green-50 text-green-700">
                                        {formatCurrency(item.totalProfit)}
                                        <div className="text-[10px] text-green-600 leading-none">Unid: {formatCurrency(item.profit)}</div>
                                    </td>
                                    <td className="px-4 py-2 bg-blue-50 font-bold text-gray-900">
                                        {formatCurrency(item.totalSale)}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button 
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Eliminar fila"
                                            disabled={items.length === 1}
                                        >
                                            <FaTrash className={items.length === 1 ? "opacity-50 cursor-not-allowed" : ""} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-start">
                    <button 
                        onClick={handleAddItem}
                        className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors text-sm font-medium"
                    >
                        <FaPlus className="mr-2" /> Agregar Artículo
                    </button>

                    {/* Resumen Final */}
                    <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Resumen Cotización</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Costo Total:</span>
                                <span className="font-medium text-gray-800">{formatCurrency(totals.cost)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ganancia Total:</span>
                                <span className="font-medium text-green-600">{formatCurrency(totals.profit)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-300">
                                <span className="text-base font-bold text-gray-800">Total a Cobrar:</span>
                                <span className="text-xl font-bold text-color-primary">{formatCurrency(totals.sale)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickQuotePage;
