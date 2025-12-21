'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES } from '@/types/finance'

export default function BudgetTracker() {
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState(CATEGORIES[0])
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
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-accent-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Orçamentos</h3>
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
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full bg-accent-400 text-white py-2 rounded-lg hover:bg-accent-500 transition-colors"
            >
              Definir Orçamento
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      
      <div className="space-y-4">
        <AnimatePresence>
          {budgetStatus.map((budget, index) => {
            const isOverBudget = budget.percentage > 100
            const isWarning = budget.percentage > 80 && budget.percentage <= 100
            
            return (
              <motion.div
                key={budget.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{budget.category}</h4>
                    {isOverBudget && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {!isOverBudget && !isWarning && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      isOverBudget ? 'text-red-600 dark:text-red-400' : 
                      isWarning ? 'text-yellow-600 dark:text-yellow-400' : 
                      'text-green-600 dark:text-green-400'
                    }`}>
                      R$ {budget.spent.toFixed(2)} / R$ {budget.limit.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeBudget(budget.category)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`absolute h-full rounded-full ${
                      isOverBudget ? 'bg-red-500' : 
                      isWarning ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                  />
                </div>
                
                <p className={`text-xs mt-2 text-right ${
                  isOverBudget ? 'text-red-600 dark:text-red-400' : 
                  isWarning ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-green-600 dark:text-green-400'
                }`}>
                  {budget.percentage.toFixed(0)}% utilizado
                  {isOverBudget && ' - Orçamento excedido!'}
                  {isWarning && ' - Atenção ao limite!'}
                </p>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {budgetStatus.length === 0 && !showForm && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum orçamento definido. Clique no + para adicionar!
          </p>
        )}
      </div>
    </motion.div>
  )
}
