'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { motion } from 'framer-motion'
import { useFinanceStore } from '@/store/financeStore'
import { TrendingUp, TrendingDown } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function MonthlyComparison() {
  const transactions = useFinanceStore(state => state.transactions)
  const getMonthlyData = useFinanceStore(state => state.getMonthlyData)
  const monthlyData = getMonthlyData()
  
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  
  // Comparação com mês anterior
  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]
  
  const incomeChange = previousMonth 
    ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 
    : 0
  const expenseChange = previousMonth 
    ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 
    : 0
  
  const data = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Receitas',
        data: monthlyData.map(d => d.income),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
      },
      {
        label: 'Despesas',
        data: monthlyData.map(d => d.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
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
          usePointStyle: true,
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          display: false,
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        }
      }
    }
  }
  
  return (
    <motion.div
      key={transactions.length}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Comparação Mensal</h3>
        
        {previousMonth && (
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Receitas vs mês anterior</p>
              <p className={`text-sm font-bold flex items-center gap-1 ${
                incomeChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {incomeChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(incomeChange).toFixed(1)}%
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Despesas vs mês anterior</p>
              <p className={`text-sm font-bold flex items-center gap-1 ${
                expenseChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {expenseChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(expenseChange).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="h-[300px]">
        <Bar data={data} options={options} />
      </div>
    </motion.div>
  )
}
