'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PiggyBank, Plus, Trash2, X, Info } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SavingsTracker() {
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedGoal, setSelectedGoal] = useState('')

  const savedMoney = useFinanceStore(state => state.savedMoney)
  const goals = useFinanceStore(state => state.goals)
  const addSavedMoney = useFinanceStore(state => state.addSavedMoney)
  const removeSavedMoney = useFinanceStore(state => state.removeSavedMoney)
  const getTotalSaved = useFinanceStore(state => state.getTotalSaved)
  const salary = useFinanceStore(state => state.salary)

  const totalSaved = getTotalSaved()
  const savingsPercentage = salary > 0 ? (totalSaved / salary) * 100 : 0

  // Agrupa por mês
  const groupedSavings = useMemo(() => {
    const groups: Record<string, typeof savedMoney> = {}
    savedMoney.forEach(saving => {
      const monthKey = format(new Date(saving.date), 'MMMM yyyy', { locale: ptBR })
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(saving)
    })
    return groups
  }, [savedMoney])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description) return

    addSavedMoney({
      amount: parseFloat(amount),
      description,
      date: new Date(date + 'T12:00:00'),
      goal: selectedGoal || undefined
    })

    // Reset
    setAmount('')
    setDescription('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setSelectedGoal('')
    setShowModal(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-8 rounded-2xl border border-green-200 dark:border-green-800 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-xl">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dinheiro Guardado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reserve para emergências e metas
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg hover:shadow-green-500/50"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Guardar Dinheiro</span>
          </button>
        </div>

        {/* Stats Card - Apenas Total Guardado */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <PiggyBank className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Guardado</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    R$ {totalSaved.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {savedMoney.length} {savedMoney.length === 1 ? 'reserva' : 'reservas'}
                </p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {savingsPercentage.toFixed(1)}% do salário
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico */}
        {savedMoney.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700">
            <PiggyBank className="w-16 h-16 text-green-300 dark:text-green-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Nenhum dinheiro guardado ainda
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Clique em "Guardar Dinheiro" para criar sua primeira reserva
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSavings).map(([month, savings]) => (
              <div key={month} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {month}
                  </h4>
                  <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                    R$ {savings.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  {savings.map((saving, idx) => (
                    <motion.div
                      key={saving.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <PiggyBank className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {saving.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(saving.date), 'dd/MM/yyyy')}
                            </span>
                            {saving.goal && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                                {goals.find(g => g.id === saving.goal)?.name || 'Meta'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          R$ {saving.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeSavedMoney(saving.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dica - Azul como as outras */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
                💡 Como funciona
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                O dinheiro guardado é automaticamente descontado do seu saldo disponível, 
                mas continua contando no saldo total. Isso ajuda a não gastar sua reserva sem perceber.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <PiggyBank className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Guardar Dinheiro</h3>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Valor a guardar
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: Reserva de emergência, viagem..."
                      required
                    />
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Meta Associada (Opcional) */}
                  {goals.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Associar a uma meta (opcional)
                      </label>
                      <select
                        value={selectedGoal}
                        onChange={(e) => setSelectedGoal(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Nenhuma meta</option>
                        {goals.map(goal => (
                          <option key={goal.id} value={goal.id}>
                            {goal.name} - R$ {goal.targetAmount.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Info - Azul */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 Este valor será descontado automaticamente do seu saldo disponível.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-lg hover:shadow-green-500/50"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
