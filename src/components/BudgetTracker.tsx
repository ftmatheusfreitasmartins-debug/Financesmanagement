'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES } from '@/types/finance'

export default function BudgetTracker() {
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [limit, setLimit] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly')
  
  const budgets = useFinanceStore(state => state.budgets)
  const setBudget = useFinanceStore(state => state.setBudget)
  const removeBudget = useFinanceStore(state => state.removeBudget)
  const getCategoryBudgetStatus = useFinanceStore(state => state.getCategoryBudgetStatus)
  
  const budgetStatus = getCategoryBudgetStatus()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBudget(category, parseFloat(limit), period)
    setLimit('')
    setShowForm(false)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-accent-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Orçamentos</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Defina limites de gastos</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-accent-400 text-white rounded-lg hover:bg-accent-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>
      
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mb-6 space-y-4 overflow-hidden"
          >
            <select
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.01"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="Limite (R$)"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'monthly' | 'weekly')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="monthly">Mensal</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="w-full bg-accent-400 text-white py-2 rounded-lg hover:bg-accent-500 transition-colors font-medium"
            >
              Definir Orçamento
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      
      <div className="space-y-4">
        {budgetStatus.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum orçamento definido. Clique no + para adicionar!
          </p>
        ) : (
          budgetStatus.map((budget, index) => {
            const isOverBudget = budget.percentage > 100
            const isWarning = budget.percentage > 80 && budget.percentage <= 100
            
            return (
              <motion.div
                key={budget.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl ${
                  isOverBudget
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : isWarning
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {budget.category}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      isOverBudget
                        ? 'text-red-600 dark:text-red-400'
                        : isWarning
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {budget.percentage}%
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeBudget(budget.category)}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    transition={{ duration: 1 }}
                    className={`absolute h-full rounded-full ${
                      isOverBudget
                        ? 'bg-red-500'
                        : isWarning
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>R$ {budget.spent.toFixed(2)}</span>
                  <span>R$ {budget.limit.toFixed(2)}</span>
                </div>
                
                {isOverBudget && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>Você excedeu o orçamento em R$ {(budget.spent - budget.limit).toFixed(2)}</span>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
