'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Trash2, TrendingUp, X } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES, GOAL_COLORS } from '@/types/finance'

type GoalLike = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: any
  category: string
  color: string
}

export default function GoalsManager() {
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [selectedColor, setSelectedColor] = useState<string>(GOAL_COLORS[0])

  // Modal "Adicionar progresso"
  const [progressOpen, setProgressOpen] = useState(false)
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null)
  const [progressValue, setProgressValue] = useState('')
  const [progressError, setProgressError] = useState<string | null>(null)

  const goals = useFinanceStore((state) => state.goals) as unknown as GoalLike[]
  const addGoal = useFinanceStore((state) => state.addGoal)
  const removeGoal = useFinanceStore((state) => state.removeGoal)
  const updateGoalProgress = useFinanceStore((state) => state.updateGoalProgress)

  const selectedGoal = useMemo(() => {
    if (!progressGoalId) return null
    return goals.find((g) => g.id === progressGoalId) ?? null
  }, [progressGoalId, goals])

  const closeProgressModal = () => {
    setProgressOpen(false)
    setProgressGoalId(null)
    setProgressValue('')
    setProgressError(null)
  }

  const openProgressModal = (goalId: string) => {
    setProgressGoalId(goalId)
    setProgressValue('')
    setProgressError(null)
    setProgressOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const value = Number(targetAmount)
    if (!Number.isFinite(value) || value <= 0) return

    addGoal({
      name,
      targetAmount: value,
      deadline: new Date(deadline),
      category,
      color: selectedColor,
    } as any)

    setName('')
    setTargetAmount('')
    setDeadline('')
    setCategory(CATEGORIES[0])
    setSelectedColor(GOAL_COLORS[0])
    setShowForm(false)
  }

  const handleAddProgress = () => {
    setProgressError(null)
    const v = Number(progressValue)
    if (!Number.isFinite(v) || v <= 0) {
      setProgressError('Informe um valor maior que 0.')
      return
    }
    if (!selectedGoal) {
      setProgressError('Meta inválida.')
      return
    }

    updateGoalProgress(selectedGoal.id, v)
    closeProgressModal()
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
          title="Criar nova meta"
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
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor da meta</label>
              <div className="flex gap-2">
                {GOAL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      selectedColor === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Selecionar cor ${color}`}
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
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
            const deadlineDate = new Date(goal.deadline as any)
            const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

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
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
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
                      onClick={() => openProgressModal(goal.id)}
                      className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                      title="Adicionar progresso"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeGoal(goal.id)}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Remover meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className="absolute h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">R$ {goal.currentAmount.toFixed(2)}</span>
                  <span className="font-semibold" style={{ color: goal.color }}>
                    {progress.toFixed(0)}%
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">R$ {goal.targetAmount.toFixed(2)}</span>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Modal: Adicionar progresso */}
      <AnimatePresence>
        {progressOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeProgressModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 6, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Adicionar progresso</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedGoal ? `Meta: ${selectedGoal.name}` : 'Meta não encontrada'}
                  </p>
                </div>

                <button
                  onClick={closeProgressModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder="0,00"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
              />

              {progressError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{progressError}</p>}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeProgressModal}
                  className="py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleAddProgress}
                  className="py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white transition-colors font-semibold"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
