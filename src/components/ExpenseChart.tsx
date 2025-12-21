'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { useFinanceStore } from '@/store/financeStore'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function ExpenseChart() {
  // Atualização em tempo real - sempre que transactions mudar, o componente re-renderiza
  const transactions = useFinanceStore(state => state.transactions)
  const getTransactionsByCategory = useFinanceStore(state => state.getTransactionsByCategory)
  const categoryData = getTransactionsByCategory()
  
  const labels = Object.keys(categoryData)
  const values = Object.values(categoryData)
  
  const data = {
    labels,
    datasets: [{
      label: 'Gastos por Categoria',
      data: values,
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
      borderColor: [
        'rgb(239, 68, 68)',
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(139, 92, 246)',
        'rgb(236, 72, 153)',
        'rgb(20, 184, 166)',
        'rgb(251, 146, 60)',
        'rgb(14, 165, 233)',
        'rgb(168, 85, 247)',
      ],
      borderWidth: 2,
    }]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
          },
          color: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            return `${label}: R$ ${value.toFixed(2)}`
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
      }
    }
  }
  
  if (labels.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 h-[400px] flex items-center justify-center"
      >
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Nenhuma despesa registrada ainda.<br/>
          Adicione transações para visualizar o gráfico.
        </p>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      key={transactions.length} // Força re-render quando transactions mudar
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Gastos por Categoria</h3>
      <div className="h-[350px]">
        <Doughnut data={data} options={options} />
      </div>
    </motion.div>
  )
}
