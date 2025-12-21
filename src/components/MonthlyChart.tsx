'use client'

import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { motion } from 'framer-motion'
import { useFinanceStore } from '@/store/financeStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function MonthlyChart() {
  // Atualização em tempo real
  const transactions = useFinanceStore(state => state.transactions)
  const getMonthlyData = useFinanceStore(state => state.getMonthlyData)
  const monthlyData = getMonthlyData()
  
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  
  const data = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Receitas',
        data: monthlyData.map(d => d.income),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Despesas',
        data: monthlyData.map(d => d.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
          },
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          callback: function(value: any) {
            return 'R$ ' + value
          }
        }
      },
      x: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        }
      }
    }
  }
  
  return (
    <motion.div
      key={transactions.length} // Força re-render
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Tendência Mensal</h3>
      <div className="h-[300px]">
        <Line data={data} options={options} />
      </div>
    </motion.div>
  )
}
