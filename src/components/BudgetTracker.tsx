'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Trash2, AlertCircle, Edit3, X } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES } from '@/types/finance'


type Period = 'monthly' | 'weekly'

export default function BudgetTracker() {
  const [showForm, setShowForm] = useState(false)

  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [limit, setLimit] = useState('')
  const [period, setPeriod] = useState<Period>('monthly')

  // Modal de edição
  const [editOpen, setEditOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<string | null>(null)
  const [editLimit, setEditLimit] = useState('')
  const [editPeriod, setEditPeriod] = useState<Period>('monthly')
  const [editError, setEditError] = useState<string | null>(null)

  const budgets = useFinanceStore((state) => state.budgets)
  const setBudget = useFinanceStore((state) => state.setBudget)
  const removeBudget = useFinanceStore((state) => state.removeBudget)
  const getCategoryBudgetStatus = useFinanceStore((state) => state.getCategoryBudgetStatus)

  const budgetStatus = getCategoryBudgetStatus()

  const rows = useMemo(() => {
    // junta status (spent/percentage) com budgets (period) pra render/editar
    return budgets.map((b) => {
      const st = budgetStatus.find((s) => s.category === b.category)
      return {
        category: b.category,
        period: b.period,
        limit: st?.limit ?? b.limit,
        spent: st?.spent ?? 0,
        percentage: st?.percentage ?? 0,
      }
    })
  }, [budgets, budgetStatus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = Number(limit)
    if (!Number.isFinite(v) || v <= 0) return

    setBudget(category, v, period)
    setLimit('')
    setShowForm(false)
  }

  const openEdit = (cat: string) => {
    const b = budgets.find((x) => x.category === cat)
    if (!b) return

    setEditCategory(cat)
    setEditLimit(String(b.limit ?? ''))
    setEditPeriod(b.period ?? 'monthly')
    setEditError(null)
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditCategory(null)
    setEditLimit('')
    setEditPeriod('monthly')
    setEditError(null)
  }

  const saveEdit = () => {
    setEditError(null)
    if (!editCategory) {
      setEditError('Orçamento inválido.')
      return
    }
    const v = Number(editLimit)
    if (!Number.isFinite(v) || v <= 0) {
      setEditError('Informe um limite maior que 0.')
      return
    }

    setBudget(editCategory, v, editPeriod)
    closeEdit()
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
          title="Criar orçamento"
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
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
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
                onChange={(e) => setPeriod(e.target.value as Period)}
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
        {rows.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum orçamento definido. Clique no + para adicionar!
          </p>
        ) : (
          rows.map((budget, index) => {
            const isOverBudget = budget.percentage > 100
            const isWarning = budget.percentage >= 80 && budget.percentage <= 100

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
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{budget.category}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {budget.period === 'weekly' ? 'Semanal' : 'Mensal'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isOverBudget
                          ? 'text-red-600 dark:text-red-400'
                          : isWarning
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {budget.percentage}%
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEdit(budget.category)}
                      className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Editar orçamento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeBudget(budget.category)}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Remover orçamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`absolute h-full rounded-full ${
                      isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
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

      {/* Modal: Editar orçamento */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeEdit}
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
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Editar orçamento</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{editCategory ?? ''}</p>
                </div>

                <button
                  onClick={closeEdit}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Limite (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
                placeholder="0,00"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
              />

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">Período</label>
              <select
                value={editPeriod}
                onChange={(e) => setEditPeriod(e.target.value as Period)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="monthly">Mensal</option>
                <option value="weekly">Semanal</option>
              </select>

              {editError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{editError}</p>}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={saveEdit}
                  className="py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white transition-colors font-semibold"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
