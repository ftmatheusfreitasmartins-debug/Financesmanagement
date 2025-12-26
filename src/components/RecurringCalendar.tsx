'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Check,
  Filter,
  TrendingDown,
  TrendingUp,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
  Repeat,
  CheckCircle,
} from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import {
  format,
  addDays,
  isToday,
  isTomorrow,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isSameDay,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CATEGORIES } from '@/types/finance'
import { validateDate } from '@/utils/security'

type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
type RecurringType = 'income' | 'expense'

type RecurringMinimal = {
  id: string
  description: string
  amount: number
  category: string
  type: RecurringType
  frequency: RecurrenceFrequency
  startDate: string | Date
  endDate?: string | Date
  active: boolean
  currency?: 'BRL' | 'USD' | 'EUR'
}

export default function RecurringCalendar() {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'upcoming' | 'monthly'>('upcoming')

  const [selectedPayment, setSelectedPayment] = useState<{
    date: Date
    recurring: RecurringMinimal
  } | null>(null)

  const recurringTransactions = useFinanceStore((state) => state.recurringTransactions) as any[]
  const transactions = useFinanceStore((state) => state.transactions) as any[]
  const addTransaction = useFinanceStore((state) => state.addTransaction)

  const isPaymentPaid = (recurringId: string, date: Date) => {
    return transactions.some(
      (t) => t.recurringId === recurringId && isSameDay(validateDate(t.date), date),
    )
  }

  const getRecurrencesForDate = (date: Date) => {
    const day = startOfDay(date)
    const recurrences: RecurringMinimal[] = []

    recurringTransactions.forEach((recurring: any) => {
      if (!recurring?.active) return

      const startDate = startOfDay(validateDate(recurring.startDate))
      const endDate = recurring.endDate
        ? endOfDay(validateDate(recurring.endDate))
        : endOfDay(addDays(new Date(), 365))

      if (day < startDate || day > endDate) return

      let shouldShow = false

      switch (recurring.frequency as RecurrenceFrequency) {
        case 'daily':
          shouldShow = true
          break

        case 'weekly': {
          const weeksDiff = Math.floor(
            (day.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
          )
          shouldShow = weeksDiff >= 0 && day.getDay() === startDate.getDay()
          break
        }

        case 'monthly':
          shouldShow = day.getDate() === startDate.getDate()
          break

        case 'yearly':
          shouldShow =
            day.getDate() === startDate.getDate() && day.getMonth() === startDate.getMonth()
          break
      }

      if (shouldShow) recurrences.push(recurring as RecurringMinimal)
    })

    return recurrences
  }

  const handleMarkAsPaid = (recurring: RecurringMinimal, date: Date) => {
    const d = startOfDay(date)
    d.setHours(12, 0, 0, 0)

    addTransaction({
      description: recurring.description,
      amount: recurring.amount,
      category: recurring.category,
      type: recurring.type,
      date: d,
      recurring: true,
      recurringId: recurring.id,
      currency: (recurring.currency || 'BRL') as 'BRL' | 'USD' | 'EUR',
    } as any)

    setSelectedPayment(null)
  }

  const upcomingPayments = useMemo(() => {
    const payments: { date: Date; recurring: any }[] = []

    for (let i = 0; i < 30; i++) {
      const date = startOfDay(addDays(new Date(), i))
      const recurrences = getRecurrencesForDate(date)

      recurrences.forEach((recurring) => {
        if (filterType !== 'all' && recurring.type !== filterType) return
        if (filterCategory !== 'all' && recurring.category !== filterCategory) return
        payments.push({ date, recurring })
      })
    }

    return payments
  }, [recurringTransactions, filterType, filterCategory, transactions])

  const monthlyPayments = useMemo(() => {
    const payments: { date: Date; recurring: any }[] = []

    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    daysInMonth.forEach((date) => {
      const recurrences = getRecurrencesForDate(startOfDay(date))
      recurrences.forEach((recurring) => {
        if (filterType !== 'all' && recurring.type !== filterType) return
        if (filterCategory !== 'all' && recurring.category !== filterCategory) return
        payments.push({ date: startOfDay(date), recurring })
      })
    })

    return payments
  }, [recurringTransactions, selectedMonth, filterType, filterCategory, transactions])

  const currentPayments = viewMode === 'upcoming' ? upcomingPayments : monthlyPayments

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoje'
    if (isTomorrow(date)) return 'Amanhã'
    const diff = differenceInDays(date, new Date())
    if (diff >= 0 && diff <= 7) return `Em ${diff} dias`
    return format(date, "d 'de' MMMM", { locale: ptBR })
  }

  const totalAmount = currentPayments.reduce((sum, p) => {
    return sum + (p.recurring.type === 'expense' ? -p.recurring.amount : p.recurring.amount)
  }, 0)

  const totalExpenses = currentPayments
    .filter((p) => p.recurring.type === 'expense')
    .reduce((sum, p) => sum + p.recurring.amount, 0)

  const totalIncome = currentPayments
    .filter((p) => p.recurring.type === 'income')
    .reduce((sum, p) => sum + p.recurring.amount, 0)

  const activeFiltersCount = (filterType !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0)

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
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-50 dark:bg-accent-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {viewMode === 'upcoming' ? 'Próximos Pagamentos' : 'Pagamentos do Mês'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentPayments.length} agendamento{currentPayments.length !== 1 ? 's' : ''}{' '}
                encontrado{currentPayments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`relative px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeFiltersCount > 0
                  ? 'bg-accent-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              type="button"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Seletor de Visualização */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('upcoming')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              viewMode === 'upcoming'
                ? 'bg-accent-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            type="button"
          >
            Próximos 30 dias
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              viewMode === 'monthly'
                ? 'bg-accent-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            type="button"
          >
            Por Mês
          </button>
        </div>

        {/* Seletor de mês */}
        {viewMode === 'monthly' && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>

            <div className="text-center">
              <h4 className="text-base font-bold text-gray-900 dark:text-white capitalize">
                {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isSameMonth(selectedMonth, new Date()) ? 'Mês atual' : ''}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              type="button"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        )}

        {/* Resumo financeiro */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Despesas</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">R$ {totalExpenses.toFixed(2)}</p>
            <p className="text-xs text-red-600 dark:text-red-400">
              {currentPayments.filter((p) => p.recurring.type === 'expense').length} itens
            </p>
          </div>

          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Receitas</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">R$ {totalIncome.toFixed(2)}</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {currentPayments.filter((p) => p.recurring.type === 'income').length} itens
            </p>
          </div>

          <div
            className={`text-center p-3 rounded-xl border ${
              totalAmount < 0
                ? 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 border-orange-200 dark:border-orange-800'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800'
            }`}
          >
            <p
              className={`text-xs font-semibold mb-1 ${
                totalAmount < 0 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {totalAmount < 0 ? 'Déficit' : 'Superávit'}
            </p>
            <p
              className={`text-lg font-bold ${
                totalAmount < 0 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              R$ {Math.abs(totalAmount).toFixed(2)}
            </p>
            <p
              className={`text-xs ${
                totalAmount < 0 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              Balanço
            </p>
          </div>
        </div>

        {/* Filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Tipo de Transação
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        filterType === 'all'
                          ? 'bg-accent-500 text-white shadow-md'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                      }`}
                      type="button"
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setFilterType('expense')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        filterType === 'expense'
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                      }`}
                      type="button"
                    >
                      Despesas
                    </button>
                    <button
                      onClick={() => setFilterType('income')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        filterType === 'income'
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                      }`}
                      type="button"
                    >
                      Receitas
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Categoria
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
                  >
                    <option value="all">Todas as categorias</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterType('all')
                      setFilterCategory('all')
                    }}
                    className="w-full py-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors font-medium"
                    type="button"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista */}
      <div className="p-5 max-h-[500px] overflow-y-auto custom-scrollbar">
        {currentPayments.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Nenhum pagamento encontrado
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {activeFiltersCount > 0 ? 'Tente ajustar os filtros' : 'Adicione transações recorrentes para visualizar'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentPayments.map((payment, index) => {
              const isDayToday = isToday(payment.date)
              const isDayTomorrow = isTomorrow(payment.date)
              const isPaid = isPaymentPaid(payment.recurring.id, payment.date)

              return (
                <motion.div
                  key={`${payment.recurring.id}-${payment.date.toISOString()}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  onClick={() => setSelectedPayment(payment)}
                  className={`group relative p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                    isPaid
                      ? 'border-green-400 dark:border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                      : isDayToday
                        ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/20 hover:border-accent-500'
                        : payment.recurring.type === 'expense'
                          ? 'border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300 dark:hover:border-red-700'
                          : 'border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isPaid ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : payment.recurring.type === 'expense' ? (
                          <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {payment.recurring.description}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                        <span className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full">
                          {payment.recurring.category}
                        </span>
                        <span>•</span>
                        <span
                          className={`${
                            isDayToday || isDayTomorrow
                              ? 'font-semibold text-accent-600 dark:text-accent-400'
                              : ''
                          }`}
                        >
                          {getDateLabel(payment.date)}
                        </span>
                        {isPaid && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              Pago
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-base font-bold ${
                          isPaid
                            ? 'text-green-600 dark:text-green-400'
                            : payment.recurring.type === 'expense'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        R$ {payment.recurring.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPayment(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {(() => {
                  const isPaid = isPaymentPaid(selectedPayment.recurring.id, selectedPayment.date)

                  return (
                    <>
                      {/* Header */}
                      <div
                        className={`p-6 border-b-4 ${
                          isPaid
                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30'
                            : selectedPayment.recurring.type === 'expense'
                              ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30'
                              : 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {isPaid ? (
                              <div className="p-3 bg-green-500 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                            ) : selectedPayment.recurring.type === 'expense' ? (
                              <div className="p-3 bg-red-500 rounded-xl">
                                <TrendingDown className="w-6 h-6 text-white" />
                              </div>
                            ) : (
                              <div className="p-3 bg-green-500 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-white" />
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                {isPaid
                                  ? 'Pagamento Realizado'
                                  : selectedPayment.recurring.type === 'expense'
                                    ? 'Despesa'
                                    : 'Receita'}
                              </p>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedPayment.recurring.description}
                              </h3>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedPayment(null)}
                            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                            type="button"
                          >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor</p>
                            <p
                              className={`text-4xl font-bold ${
                                isPaid
                                  ? 'text-green-600 dark:text-green-400'
                                  : selectedPayment.recurring.type === 'expense'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              R$ {selectedPayment.recurring.amount.toFixed(2)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {format(selectedPayment.date, "d 'de' MMMM", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detalhes */}
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                Categoria
                              </p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {selectedPayment.recurring.category}
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <Repeat className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                Frequência
                              </p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {frequencyLabels[selectedPayment.recurring.frequency as RecurrenceFrequency]}
                            </p>
                          </div>
                        </div>

                        {isPaid ? (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <p className="text-sm font-bold text-green-900 dark:text-green-300">
                                Pagamento já realizado
                              </p>
                            </div>
                            <p className="text-xs text-green-800 dark:text-green-400 leading-relaxed">
                              Este pagamento já foi registrado no seu histórico de transações.
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                              <strong>Informação:</strong> Esta é uma transação recorrente{' '}
                              {frequencyLabels[selectedPayment.recurring.frequency as RecurrenceFrequency].toLowerCase()}
                              . Ao marcar como paga, será criada uma transação real no seu histórico.
                            </p>
                          </div>
                        )}

                        {/* Botões */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPayment(null)}
                            className="py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
                            type="button"
                          >
                            {isPaid ? 'Fechar' : 'Cancelar'}
                          </motion.button>

                          {!isPaid && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleMarkAsPaid(selectedPayment.recurring, selectedPayment.date)}
                              className="py-3 px-4 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                              type="button"
                            >
                              <Check className="w-5 h-5" />
                              Marcar como Pago
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}