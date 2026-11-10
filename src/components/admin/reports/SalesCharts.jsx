// src/components/admin/reports/SalesCharts.jsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// 1. Gráfico de Línea: Evolución de Ventas Totales
export const SalesLineChart = ({ data }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || !data.labels || data.labels.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    try {
      // Gradiente suave de fondo
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)');

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels || [],
          datasets: [
            {
              label: 'Ventas Totales',
              data: data.data || [],
              borderColor: '#2563eb',
              backgroundColor: gradient,
              borderWidth: 2.5,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#1d4ed8',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 13 },
              padding: 10,
              callbacks: {
                label: (context) => ` Ventas: ${formatCurrency(context.parsed.y)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, color: '#64748b' } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.7)' },
              ticks: {
                font: { size: 11, color: '#64748b' },
                callback: (value) => formatCurrency(value),
              },
            },
          },
        },
      });
    } catch (err) {
      console.error('Error al inicializar SalesLineChart:', err);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data]);

  if (!data || !data.labels || data.labels.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">Sin datos de ventas en este período</div>;
  }

  return (
    <div className="relative h-72 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

// 2. Gráfico de Barras: Ganancia Mensual
export const ProfitBarChart = ({ data }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || !data.labels || data.labels.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    try {
      const dataValues = data.data || [];
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels || [],
          datasets: [
            {
              label: 'Ganancia Neta',
              data: dataValues,
              backgroundColor: dataValues.map((val) =>
                val >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
              ),
              borderColor: dataValues.map((val) =>
                val >= 0 ? '#10b981' : '#ef4444'
              ),
              borderWidth: 1.5,
              borderRadius: 6,
              maxBarThickness: 45,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 13 },
              padding: 10,
              callbacks: {
                label: (context) => ` Ganancia: ${formatCurrency(context.parsed.y)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, color: '#64748b' } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.7)' },
              ticks: {
                font: { size: 11, color: '#64748b' },
                callback: (value) => formatCurrency(value),
              },
            },
          },
        },
      });
    } catch (err) {
      console.error('Error al inicializar ProfitBarChart:', err);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data]);

  if (!data || !data.labels || data.labels.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">Sin datos de ganancia en este período</div>;
  }

  return (
    <div className="relative h-72 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

// 3. Gráfico de Barras Apiladas: Ventas por Categoría
export const CategoryStackedBarChart = ({ data }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || !data.labels || data.labels.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    try {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels || [],
          datasets: data.datasets || [],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                padding: 12,
                font: { size: 11 },
              },
            },
            tooltip: {
              backgroundColor: '#1e293b',
              padding: 10,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  return ` ${label}: ${formatCurrency(context.parsed.y)}`;
                },
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: { font: { size: 11, color: '#64748b' } },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.7)' },
              ticks: {
                font: { size: 11, color: '#64748b' },
                callback: (value) => formatCurrency(value),
              },
            },
          },
        },
      });
    } catch (err) {
      console.error('Error al inicializar CategoryStackedBarChart:', err);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data]);

  if (!data || !data.labels || data.labels.length === 0 || !data.datasets || data.datasets.length === 0) {
    return <div className="h-72 flex items-center justify-center text-gray-400">Sin ventas categorizadas en este período</div>;
  }

  return (
    <div className="relative h-80 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

// 4. Gráfico de Tendencia Histórica del Valor del Stock Diario
export const StockTrendLineChart = ({ data, metric = 'all' }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || !data.labels || data.labels.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    try {
      const datasets = [];

      // Dataset 1: Costo del Stock
      if (metric === 'all' || metric === 'cost') {
        const costGradient = ctx.createLinearGradient(0, 0, 0, 320);
        costGradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
        costGradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');

        datasets.push({
          label: 'Costo Stock Bodega ($)',
          data: data.cost_data || [],
          borderColor: '#ef4444',
          backgroundColor: costGradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.25,
          pointBackgroundColor: '#b91c1c',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 3.5,
          pointHoverRadius: 6,
        });
      }

      // Dataset 2: Valor Venta del Stock
      if (metric === 'all' || metric === 'sale') {
        const saleGradient = ctx.createLinearGradient(0, 0, 0, 320);
        saleGradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
        saleGradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

        datasets.push({
          label: 'Valor Venta Catálogo ($)',
          data: data.sale_data || [],
          borderColor: '#3b82f6',
          backgroundColor: saleGradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.25,
          pointBackgroundColor: '#1d4ed8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 3.5,
          pointHoverRadius: 6,
        });
      }

      // Dataset 3: Costo Stock en Tránsito
      if (metric === 'all' || metric === 'transit') {
        datasets.push({
          label: 'Costo en Tránsito ($)',
          data: data.transit_data || [],
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 4],
          fill: false,
          tension: 0.2,
          pointBackgroundColor: '#d97706',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 5,
        });
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels || [],
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 14,
                padding: 12,
                font: { size: 12, weight: 'bold' },
              },
            },
            tooltip: {
              backgroundColor: '#1e293b',
              padding: 12,
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 12 },
              callbacks: {
                label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, color: '#64748b' } },
            },
            y: {
              beginAtZero: false,
              grid: { color: 'rgba(226, 232, 240, 0.7)' },
              ticks: {
                font: { size: 11, color: '#64748b' },
                callback: (value) => formatCurrency(value),
              },
            },
          },
        },
      });
    } catch (err) {
      console.error('Error al inicializar StockTrendLineChart:', err);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, metric]);

  if (!data || !data.labels || data.labels.length === 0) {
    return <div className="h-72 flex items-center justify-center text-gray-400">Sin registros diarios de stock en este período</div>;
  }

  return (
    <div className="relative h-80 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};
