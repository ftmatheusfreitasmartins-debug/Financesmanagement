'use client'

import { motion } from 'framer-motion'
import { Calendar, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { startOfWeek, endOfWeek, startOfDay, endOfDay, differenceInDays, endOfMonth } from 'date-fns'

export default function QuickSummary() {
  const transactions = useFinanceStore(state => state.transactions)
  const salary = useFinanceStore(state => state.salary)
  const getTotalExpenses = useFinanceStore(state => state.getTotalExpenses)
  
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
  const monthEnd = endOfMonth(now)
  
  // Gastos da semana atual
  const weekExpenses = transactions
    .filter(t => {
      const tDate = new Date(t.date)
      return t.type === 'expense' && tDate >= weekStart && tDate <= weekEnd
    })
    .reduce((sum, t) => {
      const amount = t.currency === 'BRL' 
        ? t.amount 
        : t.amount * (t.exchangeRate || 1)
      return sum + amount
    }, 0)
  
  // Calcular quanto pode gastar hoje
  const monthExpenses = getTotalExpenses()
  const daysInMonth = differenceInDays(monthEnd, startOfDay(now)) + 1
  const remainingBudget = salary - monthExpenses
  const dailyBudget = remainingBudget > 0 ? remainingBudget / daysInMonth : 0
  
  // Média de gastos diários
  const avgDailyExpense = monthExpenses > 0 ? monthExpenses / new Date().getDate() : 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-accent-400 to-accent-500 rounded-2xl shadow-lg p-6 mb-8 text-white"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5" />
        <h3 className="text-lg font-bold">Resumo Rápido</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gastos esta semana */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4" />
            <p className="text-sm opacity-90">Gastos esta semana</p>
          </div>
          <p className="text-2xl font-bold">R$ {weekExpenses.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">
            Média: R$ {(weekExpenses / 7).toFixed(2)}/dia
          </p>
        </div>
        
        {/* Pode gastar hoje */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <p className="text-sm opacity-90">Pode gastar hoje</p>
          </div>
          <p className="text-2xl font-bold">R$ {dailyBudget.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">
            Restam {daysInMonth} dias no mês
          </p>
        </div>
        
        {/* Status Orçamento */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm opacity-90">Status Orçamento</p>
          </div>
          <p className="text-2xl font-bold">
            {remainingBudget >= 0 ? '✓ ' : '✗ '}
            {Math.abs((remainingBudget / salary) * 100).toFixed(0)}%
          </p>
          <p className="text-xs opacity-75 mt-1">
            {remainingBudget >= 0 
              ? `Dentro do limite` 
              : `${Math.abs(remainingBudget).toFixed(2)} acima`}
          </p>
        </div>
      </div>
      
      {/* Alerta se estiver gastando muito */}
      {avgDailyExpense > dailyBudget && dailyBudget > 0 && (
        <div className="mt-4 bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Atenção:</strong> Sua média diária (R$ {avgDailyExpense.toFixed(2)}) está acima do recomendado (R$ {dailyBudget.toFixed(2)})
          </p>
        </div>
      )}
    </motion.div>
  )
}
