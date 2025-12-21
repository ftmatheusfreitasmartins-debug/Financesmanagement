'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Trash2, TrendingUp } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES, GOAL_COLORS } from '@/types/finance'

export default function GoalsManager() {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  
  const goals = useFinanceStore(state => state.goals)
  const addGoal = useFinanceStore(state => state.addGoal)
  const removeGoal = useFinanceStore(state => state.removeGoal)
  const updateGoalProgress = useFinanceStore(state => state.updateGoalProgress)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    addGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      deadline: new Date(deadline),
      category,
      color: GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)]
    })
    
    setName('')
    setTargetAmount('')
    setDeadline('')
    setShowForm(false)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-accent-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Metas Financeiras</h3>
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
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da meta"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Valor alvo"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full bg-accent-400 text-white py-2 rounded-lg hover:bg-accent-500 transition-colors"
            >
              Adicionar Meta
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      
      <div className="space-y-4">
        <AnimatePresence>
          {goals.map((goal, index) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Meta vencida'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      R$ {goal.currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="absolute h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-right">
                  {percentage.toFixed(0)}% concluído
                </p>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {goals.length === 0 && !showForm && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma meta criada. Clique no + para adicionar!
          </p>
        )}
      </div>
    </motion.div>
  )
}
