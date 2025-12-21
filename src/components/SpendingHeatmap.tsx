'use client'

import { motion } from 'framer-motion'
import { useFinanceStore } from '@/store/financeStore'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SpendingHeatmap() {
  const transactions = useFinanceStore(state => state.transactions)
  
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Calcular gastos por dia
  const dailyExpenses = daysInMonth.map(day => {
    const dayExpenses = transactions
      .filter(t => t.type === 'expense' && isSameDay(new Date(t.date), day))
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      day: format(day, 'd'),
      dayName: format(day, 'EEE', { locale: ptBR }),
      amount: dayExpenses,
      date: day
    }
  })
  
  // Encontrar max para escala de cores
  const maxExpense = Math.max(...dailyExpenses.map(d => d.amount), 1)
  
  const getIntensity = (amount: number) => {
    if (amount === 0) return 'bg-gray-100 dark:bg-gray-700'
    const percentage = (amount / maxExpense) * 100
    
    if (percentage < 20) return 'bg-red-200 dark:bg-red-900/40'
    if (percentage < 40) return 'bg-red-300 dark:bg-red-800/50'
    if (percentage < 60) return 'bg-red-400 dark:bg-red-700/60'
    if (percentage < 80) return 'bg-red-500 dark:bg-red-600/70'
    return 'bg-red-600 dark:bg-red-500/80'
  }
  
  // Agrupar por semana
  const weeks: typeof dailyExpenses[] = []
  for (let i = 0; i < dailyExpenses.length; i += 7) {
    weeks.push(dailyExpenses.slice(i, i + 7))
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Mapa de Calor - {format(now, 'MMMM yyyy', { locale: ptBR })}
      </h3>
      
      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-2">
            {week.map((day, dayIndex) => (
              <motion.div
                key={dayIndex}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (weekIndex * 7 + dayIndex) * 0.02 }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                className="relative group flex-1"
              >
                <div
                  className={`aspect-square rounded-lg ${getIntensity(day.amount)} border border-gray-200 dark:border-gray-600 transition-all cursor-pointer flex items-center justify-center`}
                >
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {day.day}
                  </span>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                    <p className="font-medium">{format(day.date, "dd 'de' MMMM", { locale: ptBR })}</p>
                    <p className="text-gray-300">R$ {day.amount.toFixed(2)}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Intensidade de gastos:</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Menos</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700"></div>
              <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900/40"></div>
              <div className="w-4 h-4 rounded bg-red-300 dark:bg-red-800/50"></div>
              <div className="w-4 h-4 rounded bg-red-400 dark:bg-red-700/60"></div>
              <div className="w-4 h-4 rounded bg-red-500 dark:bg-red-600/70"></div>
              <div className="w-4 h-4 rounded bg-red-600 dark:bg-red-500/80"></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Mais</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
