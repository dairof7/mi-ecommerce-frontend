// src/pages/admin/AdminReportsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaChartLine,
  FaCalendarAlt,
  FaSyncAlt,
  FaBoxes,
  FaTruckLoading,
  FaHandHoldingUsd,
  FaCoins,
  FaPercentage,
  FaChartPie,
  FaTrophy,
  FaMedal,
  FaFileInvoiceDollar,
  FaSearch,
  FaInfoCircle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import quoteAdminService from '../../services/quoteAdminService';
import {
  SalesLineChart,
  ProfitBarChart,
  CategoryStackedBarChart,
  StockTrendLineChart,
} from '../../components/admin/reports/SalesCharts';

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('6m'); // '30d', '3m', '6m', 'ytd', 'custom'
  const [rankingTab, setRankingTab] = useState('bestsellers'); // 'bestsellers' | 'profit'
  const [rankingSearch, setRankingSearch] = useState('');
  const [stockTrendMetric, setStockTrendMetric] = useState('all'); // 'all' | 'cost' | 'sale' | 'transit'

  // Configurar presets de fechas
  const setPreset = (preset) => {
    const today = new Date();
    let start = new Date();

    if (preset === '30d') {
      start.setDate(today.getDate() - 30);
    } else if (preset === '3m') {
      start.setMonth(today.getMonth() - 3);
    } else if (preset === '6m') {
      start.setMonth(today.getMonth() - 5);
      start.setDate(1);
    } else if (preset === 'ytd') {
      start = new Date(today.getFullYear(), 0, 1);
    } else if (preset === 'all') {
      start = new Date(2023, 0, 1);
    }

    setActivePreset(preset);
    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(today));
  };

  // Inicializar con últimos 6 meses
  useEffect(() => {
    setPreset('6m');
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const response = await quoteAdminService.getSalesDashboard({
        start_date: startDate,
        end_date: endDate,
      });
      setData(response);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      toast.error('Error al cargar métricas y reportes del servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setActivePreset('custom');
    fetchDashboardData();
  };

  const handleReset = () => {
    setPreset('6m');
  };

  // Filtrado interno para tablas de rankings
  const filterRankings = (items = []) => {
    if (!rankingSearch.trim()) return items;
    const term = rankingSearch.toLowerCase();
    return items.filter((p) => p.name.toLowerCase().includes(term));
  };

  const inv = data?.inventory_valuation || {};
  const period = data?.period_summary || {};
  const topSelling = filterRankings(data?.top_selling_products || []);
  const topProfit = filterRankings(data?.top_profit_products || []);

  const sellingList = data?.top_selling_products || [];
  const profitList = data?.top_profit_products || [];
  const maxSold = sellingList.length > 0 ? Math.max(...sellingList.map((p) => p.total_sold), 1) : 1;
  const maxProfit = profitList.length > 0 ? Math.max(...profitList.map((p) => p.total_profit), 1) : 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Principal */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-700/60 rounded-full text-xs font-semibold text-blue-200 mb-3 border border-blue-500/30">
                <FaChartLine />
                <span>Panel de Analítica y Rendimiento</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Dashboard de Ventas e Inventario
              </h1>
              <p className="mt-1 text-sm text-blue-200 max-w-2xl">
                Valoración de bodega física, mercancía en tránsito, análisis de rentabilidad y evolución temporal de facturación.
              </p>
            </div>

            {/* Botón Refrescar */}
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition border border-white/20 shadow-sm backdrop-blur-sm disabled:opacity-50"
                title="Actualizar datos"
              >
                <FaSyncAlt className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Filtros de Rango de Fecha */}
          <div className="mt-6 pt-6 border-t border-blue-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Presets Rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-blue-200 mr-1 flex items-center">
                <FaCalendarAlt className="mr-1.5" /> Rango:
              </span>
              {[
                { id: '30d', label: 'Últimos 30 días' },
                { id: '3m', label: '3 Meses' },
                { id: '6m', label: '6 Meses' },
                { id: 'ytd', label: 'Este Año' },
                { id: 'all', label: 'Histórico' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setPreset(btn.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activePreset === btn.id
                      ? 'bg-white text-blue-900 shadow-md'
                      : 'bg-blue-800/60 text-blue-100 hover:bg-blue-800 hover:text-white border border-blue-700/40'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Selector de Fechas Personalizado */}
            <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="px-3 py-1.5 bg-blue-950/70 border border-blue-700 rounded-lg text-xs text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-xs text-blue-300">hasta</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="px-3 py-1.5 bg-blue-950/70 border border-blue-700 rounded-lg text-xs text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 bg-blue-800/80 hover:bg-blue-700 text-blue-200 rounded-lg text-xs transition border border-blue-600/40"
              >
                Limpiar
              </button>
            </form>
          </div>
        </div>

        {/* Loading Overlay / Skeleton */}
        {isLoading && !data && (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium text-sm">Calculando valoración de inventario y analítica de ventas...</p>
          </div>
        )}

        {data && (
          <>
            {/* SECCIÓN 1: VALORACIÓN ACTUAL DEL INVENTARIO FÍSICO */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                    <FaBoxes size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Valoración Actual del Inventario Físico
                    </h2>
                    <p className="text-xs text-gray-500">
                      Calculado sobre stock real disponible en bodega (excluye combos y servicios)
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center space-x-1.5 text-xs text-indigo-700 bg-indigo-50 font-medium px-3 py-1 rounded-full self-start sm:self-auto">
                  <FaInfoCircle size={12} />
                  <span>En tiempo real</span>
                </div>
              </div>

              {/* Grid de Métricas de Inventario */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                
                {/* Costo Total Stock */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/50 border border-rose-100">
                  <div className="flex items-center justify-between text-rose-700 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider">Costo Stock</span>
                    <FaCoins size={14} />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-rose-900">
                    {formatCurrency(inv.total_stock_cost)}
                  </div>
                  <p className="text-[11px] text-rose-600/90 mt-1 font-medium">Inversión en bodega</p>
                </div>

                {/* Costo Stock en Tránsito */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-100">
                  <div className="flex items-center justify-between text-amber-700 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider">En Tránsito</span>
                    <FaTruckLoading size={15} />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-amber-900">
                    {formatCurrency(inv.total_transit_cost)}
                  </div>
                  <p className="text-[11px] text-amber-600/90 mt-1 font-medium">Mercancía por recibir</p>
                </div>

                {/* Ganancia Potencial */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/50 border border-emerald-100">
                  <div className="flex items-center justify-between text-emerald-700 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider">Ganancia Pot.</span>
                    <FaHandHoldingUsd size={15} />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-900">
                    {formatCurrency(inv.total_stock_profit)}
                  </div>
                  <p className="text-[11px] text-emerald-600/90 mt-1 font-medium">Margen total esperado</p>
                </div>

                {/* Valor Total de Venta */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50/50 border border-blue-100">
                  <div className="flex items-center justify-between text-blue-700 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider">Valor Venta</span>
                    <FaFileInvoiceDollar size={15} />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-blue-900">
                    {formatCurrency(inv.total_stock_sale)}
                  </div>
                  <p className="text-[11px] text-blue-600/90 mt-1 font-medium">Precio total catálogo</p>
                </div>

                {/* Margen Bruto Global */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50/50 border border-purple-100">
                  <div className="flex items-center justify-between text-purple-700 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider">Margen Global</span>
                    <FaPercentage size={13} />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-purple-900">
                    {Number(inv.global_margin_percentage || 0).toFixed(1)}%
                  </div>
                  <p className="text-[11px] text-purple-600/90 mt-1 font-medium">Ganancia / Valor Venta</p>
                </div>

                {/* GMROI Retorno Inversión */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between text-slate-700 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider">GMROI</span>
                    <FaChartPie size={14} />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {Number(inv.gmroi || 0).toFixed(2)}x
                  </div>
                  <p className="text-[11px] text-slate-600/90 mt-1 font-medium">Retorno por peso inv.</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: RESUMEN DEL PERÍODO FILTRADO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-4 bg-blue-100 text-blue-700 rounded-2xl">
                  <FaFileInvoiceDollar size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ventas Facturadas ({data.start_date} a {data.end_date})</p>
                  <p className="text-2xl font-black text-gray-900 mt-0.5">{formatCurrency(period.total_sales)}</p>
                  <span className="text-xs font-medium text-blue-600">Pedidos pagados y enviados</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <FaHandHoldingUsd size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ganancia Neta Realizada</p>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">{formatCurrency(period.total_profit)}</p>
                  <span className="text-xs font-medium text-emerald-600">Restando costos y cupones</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-4 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <FaPercentage size={22} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Margen Realizado del Período</p>
                  <p className="text-2xl font-black text-indigo-900 mt-0.5">{Number(period.margin_percentage || 0).toFixed(1)}%</p>
                  <span className="text-xs font-medium text-indigo-600">Efectividad neta comercial</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: GRÁFICAS TEMPORALES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfica 1: Ventas Totales */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                    <h3 className="font-bold text-gray-900 text-base">Evolución de Ventas Totales</h3>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                    Mensual
                  </span>
                </div>
                <SalesLineChart data={data.sales_chart_data} />
              </div>

              {/* Gráfica 2: Ganancias Mensuales */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <h3 className="font-bold text-gray-900 text-base">Ganancia Neta Mensual</h3>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Rendimiento
                  </span>
                </div>
                <ProfitBarChart data={data.profit_chart_data} />
              </div>
            </div>

            {/* Gráfica 3: Ventas por Categoría (Full Width) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                  <h3 className="font-bold text-gray-900 text-base">Ventas Mensuales por Categoría</h3>
                </div>
                <p className="text-xs text-gray-500">Distribución apilada de facturación por línea comercial</p>
              </div>
              <CategoryStackedBarChart data={data.category_sales_chart_data} />
            </div>

            {/* SECCIÓN 4: RANKINGS TOP 10 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <FaTrophy size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Top Productos del Período</h3>
                    <p className="text-xs text-gray-500">Los 10 artículos más representativos en ventas y utilidad</p>
                  </div>
                </div>

                {/* Tabs & Buscador */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setRankingTab('bestsellers')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        rankingTab === 'bestsellers'
                          ? 'bg-white text-blue-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Más Vendidos (&gt; $45.000)
                    </button>
                    <button
                      onClick={() => setRankingTab('profit')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        rankingTab === 'profit'
                          ? 'bg-white text-blue-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Más Rentables ($)
                    </button>
                  </div>

                  {/* Buscador dentro del top */}
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-2.5 text-gray-400" size={12} />
                    <input
                      type="text"
                      placeholder="Filtrar top..."
                      value={rankingSearch}
                      onChange={(e) => setRankingSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-44"
                    />
                  </div>
                </div>
              </div>

              {/* Contenido de la Tabla */}
              {rankingTab === 'bestsellers' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 bg-gray-50/50">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4 w-40 text-center">Unidades Vendidas</th>
                        <th className="py-3 px-4 w-44 text-right">Ganancia Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topSelling.length > 0 ? (
                        topSelling.map((prod, idx) => {
                          const percent = Math.round((prod.total_sold / maxSold) * 100);
                          return (
                            <tr key={idx} className="hover:bg-blue-50/40 transition">
                              <td className="py-3 px-4 text-center">
                                {idx === 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                                    1
                                  </span>
                                ) : idx === 1 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                                    2
                                  </span>
                                ) : idx === 2 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-800/20 text-amber-900 font-bold text-xs">
                                    3
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-gray-400">{idx + 1}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-gray-900">{prod.name}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-gray-900 text-xs">{prod.total_sold} un.</span>
                                  <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{ width: `${percent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                {formatCurrency(prod.total_profit)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-gray-400 text-sm">
                            No se registraron ventas en este período para productos &gt; $45.000.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 bg-gray-50/50">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4 w-40 text-center">Unidades</th>
                        <th className="py-3 px-4 w-44 text-right">Ganancia Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topProfit.length > 0 ? (
                        topProfit.map((prod, idx) => {
                          const percent = Math.round((prod.total_profit / maxProfit) * 100);
                          return (
                            <tr key={idx} className="hover:bg-emerald-50/40 transition">
                              <td className="py-3 px-4 text-center">
                                {idx === 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                                    1
                                  </span>
                                ) : idx === 1 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                                    2
                                  </span>
                                ) : idx === 2 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-800/20 text-amber-900 font-bold text-xs">
                                    3
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-gray-400">{idx + 1}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-gray-900">{prod.name}</span>
                              </td>
                              <td className="py-3 px-4 text-center font-medium text-gray-700 text-xs">
                                {prod.total_sold} un.
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-extrabold text-emerald-700 text-sm">
                                    {formatCurrency(prod.total_profit)}
                                  </span>
                                  <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-1.5 rounded-full"
                                      style={{ width: `${percent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-gray-400 text-sm">
                            No se encontraron datos de rentabilidad para este rango.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECCIÓN 5: GRÁFICO DE TENDENCIA HISTÓRICA DEL VALOR DEL STOCK DIARIO (AL FINAL) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <FaChartLine size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                      Tendencia Histórica del Valor del Stock (Registro Diario)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Evolución diaria del capital invertido en bodega, potencial de venta y mercancía en tránsito.
                    </p>
                  </div>
                </div>

                {/* Filtros de Métricas para la Gráfica de Tendencia */}
                <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'cost', label: 'Costo Bodega' },
                    { id: 'sale', label: 'Valor Venta' },
                    { id: 'transit', label: 'En Tránsito' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStockTrendMetric(tab.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        stockTrendMetric === tab.id
                          ? 'bg-white text-blue-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Componente Gráfico */}
              <StockTrendLineChart
                data={data.stock_trend_chart_data}
                metric={stockTrendMetric}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

