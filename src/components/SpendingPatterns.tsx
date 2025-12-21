'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

export default function SpendingPatterns() {
  const transactions = useFinanceStore(state => state.transactions)
  const getSpendingPatterns = useFinanceStore(state => state.getSpendingPatterns)
  
  const patterns = getSpendingPatterns()
  const maxSpending = Math.max(...patterns.map(p => p.averageSpending))
  
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Padrões de Gastos</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Análise por dia da semana</p>
        </div>
        <Calendar className="w-6 h-6 text-accent-400" />
      </div>
      
      <div className="space-y-4">
        {patterns.map((pattern, index) => {
          const widthPercentage = maxSpending > 0 ? (pattern.averageSpending / maxSpending) * 100 : 0
          
          const getTrendIcon = () => {
            if (pattern.trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />
            if (pattern.trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-500" />
            return <Minus className="w-4 h-4 text-gray-400" />
          }
          
          const getTrendColor = () => {
            if (pattern.trend === 'increasing') return 'bg-red-500'
            if (pattern.trend === 'decreasing') return 'bg-green-500'
            return 'bg-blue-500'
          }
          
          return (
            <motion.div
              key={pattern.dayOfWeek}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-20">
                    {pattern.dayOfWeek}
                  </span>
                  {getTrendIcon()}
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pattern.percentage.toFixed(1)}% do total
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[100px] text-right">
                    R$ {pattern.averageSpending.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`absolute h-full ${getTrendColor()} rounded-full`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Acima da média</p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {patterns.filter(p => p.trend === 'increasing').length} dia(s)
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Minus className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Na média</p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {patterns.filter(p => p.trend === 'stable').length} dia(s)
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Abaixo da média</p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {patterns.filter(p => p.trend === 'decreasing').length} dia(s)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
