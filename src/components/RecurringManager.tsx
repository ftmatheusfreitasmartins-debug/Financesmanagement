'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Repeat,
  Plus,
  Trash2,
  Play,
  Pause,
  Edit2,
  Calendar,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES } from '@/types/finance'
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { validateDate } from '@/utils/security'

type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
type RecurringType = 'income' | 'expense'

export default function RecurringManager() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [type, setType] = useState<RecurringType>('expense')
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly')
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd'),
  )
  const [endDate, setEndDate] = useState<string>('')
  const [showCalendar, setShowCalendar] = useState<string | null>(null)

  const recurringTransactions = useFinanceStore((state) => state.recurringTransactions)
  const addRecurringTransaction = useFinanceStore((state) => state.addRecurringTransaction)
  const removeRecurringTransaction = useFinanceStore((state) => state.removeRecurringTransaction)
  const toggleRecurringTransaction = useFinanceStore((state) => state.toggleRecurringTransaction)
  const updateRecurringTransaction = useFinanceStore((state) => state.updateRecurringTransaction)

  function resetForm() {
    setDescription('')
    setAmount('')
    setCategory(CATEGORIES[0])
    setType('expense')
    setFrequency('monthly')
    setStartDate(format(new Date(), 'yyyy-MM-dd'))
    setEndDate('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsedAmount = Number.parseFloat(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return

    const data = {
      description,
      amount: parsedAmount,
      category,
      type,
      frequency,
      // meio-dia para reduzir bugs de timezone quando salva/serializa
      startDate: validateDate(`${startDate}T12:00:00`),
      endDate: endDate ? validateDate(`${endDate}T12:00:00`) : undefined,
    }

    if (editingId) {
      updateRecurringTransaction(editingId, data)
      setEditingId(null)
    } else {
      addRecurringTransaction(data as any)
    }

    resetForm()
    setShowForm(false)
  }

  function handleEdit(recurring: any) {
    setEditingId(recurring.id)
    setDescription(String(recurring.description ?? ''))
    setAmount(String(recurring.amount ?? ''))
    setCategory(String(recurring.category ?? CATEGORIES[0]))
    setType(recurring.type === 'income' ? 'income' : 'expense')
    setFrequency(
      (['daily', 'weekly', 'monthly', 'yearly'].includes(recurring.frequency)
        ? recurring.frequency
        : 'monthly') as RecurrenceFrequency,
    )

    const start = validateDate(recurring.startDate)
    setStartDate(format(start, 'yyyy-MM-dd'))

    if (recurring.endDate) {
      const end = validateDate(recurring.endDate)
      setEndDate(format(end, 'yyyy-MM-dd'))
    } else {
      setEndDate('')
    }

    setShowForm(true)
  }

  function calculateNextExecutions(recurring: any, limit = 12): Date[] {
    const executions: Date[] = []

    const startBase = recurring?.lastExecuted ?? recurring?.startDate
    const start = validateDate(startBase)
    const end = recurring?.endDate ? validateDate(recurring.endDate) : addYears(start, 1)

    let currentDate = new Date(start)

    // trava de segurança contra loop infinito por dados estranhos
    let guard = 0
    while (executions.length < limit && isBefore(currentDate, end) && guard < 2000) {
      guard++

      switch (recurring?.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1)
          break
        case 'weekly':
          currentDate = addWeeks(currentDate, 1)
          break
        case 'yearly':
          currentDate = addYears(currentDate, 1)
          break
        case 'monthly':
        default:
          currentDate = addMonths(currentDate, 1)
          break
      }

      if (isBefore(currentDate, end)) executions.push(new Date(currentDate))
    }

    return executions
  }

  function calculateTotalImpact() {
    let totalExpenses = 0
    let totalIncome = 0

    recurringTransactions.forEach((recurring: any) => {
      if (!recurring?.active) return
      const executions = calculateNextExecutions(recurring, 12)
      const total = executions.length * Number(recurring.amount ?? 0)

      if (recurring.type === 'expense') totalExpenses += total
      else totalIncome += total
    })

    return { totalExpenses, totalIncome, balance: totalIncome - totalExpenses }
  }

  const impact = calculateTotalImpact()

  const frequencyLabels: Record<RecurrenceFrequency, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual',
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Transações Recorrentes
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure gastos e receitas automáticas
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm()
            setEditingId(null)
            setShowForm(!showForm)
          }}
          className="p-2 bg-accent-400 text-white rounded-lg hover:bg-accent-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {recurringTransactions.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">
                Despesas Futuras
              </p>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              R$ {impact.totalExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Próximos 12 meses
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">
                Receitas Futuras
              </p>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              R$ {impact.totalIncome.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Próximos 12 meses
            </p>
          </div>

          <div
            className={`border rounded-xl p-4 ${
              impact.balance >= 0
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Repeat
                className={`w-4 h-4 ${
                  impact.balance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              />
              <p
                className={`text-xs font-semibold uppercase ${
                  impact.balance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                Impacto Total
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${
                impact.balance >= 0
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-orange-700 dark:text-orange-300'
              }`}
            >
              R$ {impact.balance.toFixed(2)}
            </p>
            <p
              className={`text-xs mt-1 ${
                impact.balance >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              Balanço projetado
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mb-6 space-y-4 overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                {editingId ? 'Editar Transação Recorrente' : 'Nova Transação Recorrente'}
              </h4>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    type === 'expense'
                      ? 'bg-red-500 text-white shadow-lg'
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
                      ? 'bg-green-500 text-white shadow-lg'
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
                placeholder="Descrição (ex: Netflix, Aluguel)"
                className="w-full px-4 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />

              <div className="grid grid-cols-2 gap-4 mb-3">
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
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Data Fim (opcional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      resetForm()
                      setShowForm(false)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                )}

                <button
                  type="submit"
                  className="flex-1 bg-accent-400 text-white py-2 rounded-lg hover:bg-accent-500 transition-colors font-medium"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Recorrente'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {recurringTransactions.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma transação recorrente. Clique no + para adicionar!
          </p>
        ) : (
          recurringTransactions.map((recurring: any, index: number) => {
            const nextExecutions = calculateNextExecutions(recurring, 6)
            const showingCalendar = showCalendar === recurring.id

            const start = validateDate(recurring?.startDate)
            const end = recurring?.endDate ? validateDate(recurring.endDate) : null
            const last = recurring?.lastExecuted ? validateDate(recurring.lastExecuted) : null

            return (
              <motion.div
                key={recurring.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl border-2 transition-all ${
                  recurring.active
                    ? 'bg-white dark:bg-gray-700/50 border-accent-200 dark:border-accent-800'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {recurring.description}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            recurring.type === 'income'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {recurring.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                        <span className="font-bold text-gray-900 dark:text-white">
                          R$ {Number(recurring.amount ?? 0).toFixed(2)}
                        </span>
                        <span>•</span>
                        <span>{recurring.category}</span>
                        <span>•</span>
                        <span>{frequencyLabels[recurring.frequency as RecurrenceFrequency] ?? 'Mensal'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-1 flex-wrap">
                        <span>Início: {format(start, 'dd/MM/yyyy')}</span>
                        {end && <span>• Fim: {format(end, 'dd/MM/yyyy')}</span>}
                      </div>

                      {last && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Última execução: {format(last, 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowCalendar(showingCalendar ? null : recurring.id)}
                        className="p-2 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                        title="Ver calendário"
                      >
                        <Calendar className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(recurring)}
                        className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleRecurringTransaction(recurring.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          recurring.active
                            ? 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                            : 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30'
                        }`}
                        title={recurring.active ? 'Pausar' : 'Ativar'}
                      >
                        {recurring.active ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeRecurringTransaction(recurring.id)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showingCalendar && nextExecutions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Próximas {nextExecutions.length} Execuções
                      </h5>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {nextExecutions.map((date, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                recurring.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="text-gray-900 dark:text-white font-medium">
                              {format(date, 'dd/MM/yyyy')}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              {format(date, 'EEE', { locale: ptBR })}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        Total projetado:{' '}
                        <strong>
                          R$ {(nextExecutions.length * Number(recurring.amount ?? 0)).toFixed(2)}
                        </strong>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {recurringTransactions.length > 0 && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>Dicas</strong>: As transações recorrentes são processadas automaticamente nas datas programadas. Use o botão de pausa para
            desativar temporariamente e o calendário para ver as próximas execuções.
          </p>
        </div>
      )}
    </motion.div>
  )
}
