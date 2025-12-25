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
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0])
  
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
      color: selectedColor,
    })
    
    // Reset form
    setName('')
    setTargetAmount('')
    setDeadline('')
    setCategory(CATEGORIES[0])
    setSelectedColor(GOAL_COLORS[0])
    setShowForm(false)
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
          <Target className="w-6 h-6 text-accent-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Metas Financeiras</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Defina e acompanhe seus objetivos</p>
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
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da meta (ex: Viagem)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Valor alvo (R$)"
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
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cor da meta
              </label>
              <div className="flex gap-2">
                {GOAL_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      selectedColor === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-accent-400 text-white py-2 rounded-lg hover:bg-accent-500 transition-colors font-medium"
            >
              Criar Meta
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      
      <div className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma meta definida. Clique no + para adicionar!
          </p>
        ) : (
          goals.map((goal, index) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: goal.color }}
                      />
                      {goal.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {goal.category} • {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo expirado'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const amount = prompt('Quanto você quer adicionar a esta meta?')
                        if (amount) updateGoalProgress(goal.id, parseFloat(amount))
                      }}
                      className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeGoal(goal.id)}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1 }}
                    className="absolute h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    R$ {goal.currentAmount.toFixed(2)}
                  </span>
                  <span className="font-semibold" style={{ color: goal.color }}>
                    {progress.toFixed(0)}%
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    R$ {goal.targetAmount.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
