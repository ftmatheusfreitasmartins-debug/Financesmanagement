'use client'

import { useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Doughnut, Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { useFinanceStore } from '@/store/financeStore'
import { TrendingUp, TrendingDown, Calendar, BarChart3, PieChart, Download } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

type RangeMode = 'week' | 'month' | 'quarter' | 'year' | 'all'
type ViewMode = 'chart' | 'cards' | 'bars'

const PERIODS = {
  week: { label: 'Semana', days: 7 },
  month: { label: 'Mês', days: 30 },
  quarter: { label: 'Trimestre', days: 90 },
  year: { label: 'Ano', days: 365 },
  all: { label: 'Tudo', days: null },
}

function currencyBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function colorFromCategory(category: string, index: number, total: number) {
  const hues = [200, 280, 340, 160, 40, 120, 20, 260, 180, 80]
  const hue = hues[index % hues.length]
  const saturation = 75 + (index % 3) * 5
  const lightness = 55 + (index % 2) * 5
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export default function ExpenseChart() {
  const [range, setRange] = useState<RangeMode>('month')
  const [viewMode, setViewMode] = useState<ViewMode>('chart')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const chartRef = useRef<any>(null)

  const transactions = useFinanceStore((s) => s.transactions)
  const currencies = useFinanceStore((s) => s.currencies)

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const amountInBRL = (t: any) => {
    const amt = Number(t?.amount ?? 0)
    const cur = (t?.currency ?? 'BRL') as 'BRL' | 'USD' | 'EUR'
    if (cur === 'BRL') return amt
    const rate = Number(t?.exchangeRate ?? (currencies as any)?.[cur] ?? 1)
    return amt * rate
  }

  const categoryStats = useMemo(() => {
    const now = new Date()
    const periodDays = PERIODS[range].days
    const startDate = periodDays ? new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000) : null

    // Filtrar transações do período
    const periodExpenses = (transactions as any[]).filter((t) => {
      if (t?.type !== 'expense') return false
      const d = new Date(t?.date)
      return !startDate || d >= startDate
    })

    // Agrupar por categoria
    const byCategory = periodExpenses.reduce((acc: Record<string, any>, t) => {
      const cat = String(t?.category ?? 'Outros')
      if (!acc[cat]) {
        acc[cat] = { total: 0, count: 0, transactions: [] }
      }
      const value = amountInBRL(t)
      acc[cat].total += value
      acc[cat].count += 1
      acc[cat].transactions.push({ ...t, value })
      return acc
    }, {})

    // Transformar em array e calcular estatísticas
    const entries = Object.entries(byCategory)
      .map(([category, data]: [string, any]) => ({
        category,
        total: data.total,
        count: data.count,
        avg: data.total / data.count,
        transactions: data.transactions,
      }))
      .sort((a, b) => b.total - a.total)

    const grandTotal = entries.reduce((sum, e) => sum + e.total, 0)

    const withPercentages = entries.map((e, idx) => ({
      ...e,
      percentage: grandTotal > 0 ? (e.total / grandTotal) * 100 : 0,
      color: colorFromCategory(e.category, idx, entries.length),
    }))

    const topCategory = withPercentages[0]
    const avgPerCategory = grandTotal / (withPercentages.length || 1)

    return {
      categories: withPercentages,
      total: grandTotal,
      topCategory,
      avgPerCategory,
      totalTransactions: periodExpenses.length,
    }
  }, [transactions, currencies, range])

  const chartData = useMemo(() => {
    const top8 = categoryStats.categories.slice(0, 8)
    const others = categoryStats.categories.slice(8)
    const othersTotal = others.reduce((sum, c) => sum + c.total, 0)

    const finalCategories =
      othersTotal > 0
        ? [...top8, { category: 'Outros', total: othersTotal, percentage: (othersTotal / categoryStats.total) * 100, color: 'hsl(0, 0%, 60%)' }]
        : top8

    return {
      labels: finalCategories.map((c) => c.category),
      datasets: [
        {
          data: finalCategories.map((c) => c.total),
          backgroundColor: finalCategories.map((c) => c.color),
          borderColor: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.95)',
          borderWidth: 3,
          hoverOffset: 15,
          hoverBorderWidth: 4,
        },
      ],
    }
  }, [categoryStats, isDark])

const chartOptions = useMemo<ChartOptions<'doughnut'>>(
  () => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        displayColors: false,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#fff' : '#111',
        bodyColor: isDark ? '#e5e7eb' : '#374151',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 16,
        titleFont: { size: 14, weight: 'bold' }, // agora tipado corretamente
        bodyFont: { size: 13 },
        callbacks: {
          title: (items: any) => String(items?.[0]?.label ?? ''),
          label: (ctx: any) => {
            const value = Number(ctx.parsed ?? 0)
            const pct = categoryStats.total > 0 ? (value / categoryStats.total) * 100 : 0
            return `${currencyBRL(value)} (${pct.toFixed(1)}%)`
          },
        },
      },
    },
    animation: { animateRotate: true, animateScale: true, duration: 800 },
    onHover: (_: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index
        setHoveredCategory((chartData as any).labels?.[index] ?? null)
      } else {
        setHoveredCategory(null)
      }
    },
  }),
  [isDark, categoryStats.total, chartData]
)


  const barChartData = useMemo(
    () => ({
      labels: categoryStats.categories.slice(0, 8).map((c) => c.category),
      datasets: [
        {
          label: 'Total gasto',
          data: categoryStats.categories.slice(0, 8).map((c) => c.total),
          backgroundColor: categoryStats.categories.slice(0, 8).map((c) => c.color + 'CC'),
          borderColor: categoryStats.categories.slice(0, 8).map((c) => c.color),
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    }),
    [categoryStats.categories],
  )

  const barChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#fff' : '#111',
          bodyColor: isDark ? '#e5e7eb' : '#374151',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx: any) => `Total: ${currencyBRL(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            callback: (value: any) => currencyBRL(value),
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    }),
    [isDark],
  )

  const downloadChart = () => {
    if (!chartRef.current) return
    const url = chartRef.current.toBase64Image()
    const link = document.createElement('a')
    link.download = `gastos-${range}-${new Date().toISOString().split('T')[0]}.png`
    link.href = url
    link.click()
  }

  if (!categoryStats.categories.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          📊 Análise de Gastos
        </h3>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhuma despesa neste período
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Adicione transações para visualizar análises
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header com controles */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              Análise de Gastos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {categoryStats.totalTransactions} transações • {categoryStats.categories.length} categorias
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Seletor de período */}
            <div className="flex rounded-lg bg-white dark:bg-gray-700 p-1 shadow-sm">
              {(Object.keys(PERIODS) as RangeMode[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setRange(period)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    range === period
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {PERIODS[period].label}
                </button>
              ))}
            </div>

            {/* Seletor de visualização */}
            <div className="flex rounded-lg bg-white dark:bg-gray-700 p-1 shadow-sm">
              <button
                onClick={() => setViewMode('chart')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'chart'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Gráfico de pizza"
              >
                <PieChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('bars')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'bars'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Gráfico de barras"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* Botão de download */}
            <button
              onClick={downloadChart}
              className="p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm transition-all"
              title="Baixar gráfico"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600"
        >
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Total Gasto
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {currencyBRL(categoryStats.total)}
          </div>
        </motion.div>

        {categoryStats.topCategory && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Maior Categoria
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: categoryStats.topCategory.color }}
              />
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {categoryStats.topCategory.category}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currencyBRL(categoryStats.topCategory.total)} ({categoryStats.topCategory.percentage.toFixed(1)}%)
            </div>
          </motion.div>
        )}

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600"
        >
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Média por Categoria
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {currencyBRL(categoryStats.avgPerCategory)}
          </div>
        </motion.div>
      </div>

      {/* Visualização principal */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {viewMode === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            >
              {/* Gráfico */}
              <div className="lg:col-span-3">
                <div className="relative h-80 lg:h-96">
                  {/* Overlay do total no centro */}
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        Total ({PERIODS[range].label})
                      </div>
                      <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
                        {currencyBRL(categoryStats.total)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {categoryStats.categories.length} categorias
                      </div>
                    </div>
                  </div>
                  <Doughnut ref={chartRef} data={chartData} options={chartOptions} />
                </div>
              </div>


              {/* Lista de categorias */}
              <div className="lg:col-span-2 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {categoryStats.categories.slice(0, 10).map((cat, idx) => (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onMouseEnter={() => setHoveredCategory(cat.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      hoveredCategory === cat.category
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-md scale-105'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {cat.category}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {cat.count} {cat.count === 1 ? 'transação' : 'transações'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {currencyBRL(cat.total)}
                        </div>
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {cat.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    {/* Barra de progresso */}
                    <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ delay: idx * 0.05 + 0.2, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {viewMode === 'bars' && (
            <motion.div
              key="bars"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="h-96"
            >
              <Bar data={barChartData} options={barChartOptions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
      `}</style>
    </motion.div>
  )
}
