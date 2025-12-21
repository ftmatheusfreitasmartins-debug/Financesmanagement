'use client'

import { Line } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

export default function FinancialProjection() {
  const transactions = useFinanceStore(state => state.transactions)
  const getFinancialProjection = useFinanceStore(state => state.getFinancialProjection)
  
  const projections = getFinancialProjection(6)
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  
  const finalProjection = projections[projections.length - 1]
  const isPositive = finalProjection.projectedBalance > 0
  
  const data = {
    labels: projections.map(p => p.month),
    datasets: [
      {
        label: 'Saldo Projetado',
        data: projections.map(p => p.projectedBalance),
        borderColor: isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)',
        backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      }
    ]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: function(context: any) {
            return `Saldo: R$ ${context.parsed.y.toFixed(2)}`
          },
          afterLabel: function(context: any) {
            const projection = projections[context.dataIndex]
            return [
              `Receitas: R$ ${projection.projectedIncome.toFixed(2)}`,
              `Despesas: R$ ${projection.projectedExpenses.toFixed(2)}`,
              `Confiança: ${projection.confidence}%`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          callback: function(value: any) {
            return 'R$ ' + value.toFixed(0)
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
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Projeção Financeira</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Previsão para os próximos 6 meses</p>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Em 6 meses você terá:</p>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <p className={`text-2xl font-bold ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              R$ {finalProjection.projectedBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="h-[300px] mb-4">
        <Line data={data} options={options} />
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
            Como calculamos?
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Baseado na média dos últimos 6 meses de receitas e despesas, com ajuste de tendência. 
            A confiança diminui quanto mais distante no futuro (máximo 6 meses).
          </p>
        </div>
      </div>
    </motion.div>
  )
}
