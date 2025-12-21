'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat, Plus, Trash2, Play, Pause, Calendar } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES } from '@/types/finance'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function RecurringManager() {
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  const recurringTransactions = useFinanceStore(state => state.recurringTransactions)
  const addRecurringTransaction = useFinanceStore(state => state.addRecurringTransaction)
  const removeRecurringTransaction = useFinanceStore(state => state.removeRecurringTransaction)
  const toggleRecurringTransaction = useFinanceStore(state => state.toggleRecurringTransaction)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    addRecurringTransaction({
      description,
      amount: parseFloat(amount),
      category,
      type,
      frequency,
      startDate: new Date(startDate)
    })
    
    setDescription('')
    setAmount('')
    setShowForm(false)
  }
  
  const frequencyLabels = {
    daily: 'Diariamente',
    weekly: 'Semanalmente',
    monthly: 'Mensalmente',
    yearly: 'Anualmente'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Repeat className="w-6 h-6 text-accent-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transações Recorrentes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatize seus gastos fixos</p>
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  type === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  type === 'income'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Receita
              </button>
            </div>
            
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, Netflix, Salário..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Valor (R$)"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
                <option value="yearly">Anualmente</option>
              </select>
              
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-accent-400 text-white py-2 rounded-lg hover:bg-accent-500 transition-colors font-medium"
            >
              Adicionar Recorrência
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      
      <div className="space-y-3">
        <AnimatePresence>
          {recurringTransactions.map((recurring, index) => (
            <motion.div
              key={recurring.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl group transition-all ${
                recurring.active 
                  ? 'bg-gray-50 dark:bg-gray-700/50' 
                  : 'bg-gray-100 dark:bg-gray-700/30 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    recurring.type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <Repeat className={`w-4 h-4 ${
                      recurring.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {recurring.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                        {frequencyLabels[recurring.frequency]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {recurring.category}
                      </span>
                      {recurring.lastExecuted && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Último: {format(new Date(recurring.lastExecuted), 'dd/MM', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      recurring.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {recurring.type === 'income' ? '+' : '-'} R$ {recurring.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleRecurringTransaction(recurring.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      recurring.active
                        ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    {recurring.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeRecurringTransaction(recurring.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {recurringTransactions.length === 0 && !showForm && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma transação recorrente. Clique no + para adicionar!
          </p>
        )}
      </div>
    </motion.div>
  )
}
