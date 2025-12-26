'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, AlertCircle, PiggyBank, Receipt } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { startOfDay, endOfMonth, differenceInCalendarDays, startOfMonth, endOfDay } from 'date-fns'
import { validateDate, validateNumber, validateCurrency } from '@/utils/security'

export default function QuickSummary() {
  const transactions = useFinanceStore((state) => state.transactions as any)
  const savedMoney = useFinanceStore((state) => state.savedMoney as any)
  const currencies = useFinanceStore((state) => state.currencies as any)
  const salary = useFinanceStore((state) => state.salary)
  const getAvailableBalance = useFinanceStore((state) => state.getAvailableBalance)
  const getTotalBalance = useFinanceStore((state) => state.getTotalBalance)

  const now = useMemo(() => startOfDay(new Date()), [])
  const monthStart = useMemo(() => startOfMonth(now), [now])
  const monthEnd = useMemo(() => endOfMonth(now), [now])

  const daysLeft = useMemo(() => Math.max(1, differenceInCalendarDays(monthEnd, now) + 1), [monthEnd, now])

  const toBRL = (t: any) => {
    const amt = validateNumber(t?.amount, 0, 999999999)
    const currency = validateCurrency(t?.currency)
    if (currency === 'BRL') return amt
    const rate = validateNumber(t?.exchangeRate ?? currencies?.[currency], 0.01, 1000)
    return amt * rate
  }

  const sumInRange = (start: Date, end: Date, type: 'income' | 'expense') => {
    const s = startOfDay(start).getTime()
    const e = endOfDay(end).getTime()

    return transactions.reduce((acc: number, t: any) => {
      if (!t || t.type !== type) return acc
      const d = validateDate(t.date).getTime()
      if (d < s || d > e) return acc
      return acc + toBRL(t)
    }, 0)
  }

  const savedThisMonth = useMemo(() => {
    const s = startOfDay(monthStart).getTime()
    const e = endOfDay(monthEnd).getTime()

    return savedMoney.reduce((acc: number, item: any) => {
      const d = validateDate(item?.date).getTime()
      if (d < s || d > e) return acc
      return acc + validateNumber(item?.amount, 0, 999999999)
    }, 0)
  }, [savedMoney, monthStart, monthEnd])

  const availableBalance = useMemo(() => {
    try {
      return validateNumber(getAvailableBalance?.() ?? 0, -999999999, 999999999)
    } catch {
      return 0
    }
  }, [getAvailableBalance, transactions, savedMoney])

  const totalBalance = useMemo(() => {
    try {
      return validateNumber(getTotalBalance?.() ?? 0, -999999999, 999999999)
    } catch {
      return 0
    }
  }, [getTotalBalance, transactions])

  const dailyBudgetFromBalance = useMemo(() => (availableBalance > 0 ? availableBalance / daysLeft : 0), [
    availableBalance,
    daysLeft,
  ])

  // ✅ Agora pega o mês inteiro (não só até hoje)
  const monthExpenses = useMemo(() => sumInRange(monthStart, monthEnd, 'expense'), [monthStart, monthEnd, transactions])
  const monthIncome = useMemo(() => sumInRange(monthStart, monthEnd, 'income'), [monthStart, monthEnd, transactions])

  const salaryRef = useMemo(() => validateNumber(salary, 0, 10000000), [salary])
  const salaryUsedPct = useMemo(() => {
    if (!salaryRef) return null
    return (monthExpenses / salaryRef) * 100
  }, [salaryRef, monthExpenses])

  const showAlert = useMemo(() => dailyBudgetFromBalance < 0, [dailyBudgetFromBalance])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-accent-400 to-accent-500 rounded-2xl shadow-lg p-6 mb-8 text-white"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5" />
        <h3 className="text-lg font-bold">Resumo Rápido</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <p className="text-sm opacity-90">Saldo disponível</p>
          </div>
          <p className="text-2xl font-bold">R$ {availableBalance.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">Total (sem guardado): R$ {totalBalance.toFixed(2)}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <p className="text-sm opacity-90">Pode gastar por dia</p>
          </div>
          <p className="text-2xl font-bold">R$ {dailyBudgetFromBalance.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">Restam {daysLeft} dia(s) no mês</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4" />
            <p className="text-sm opacity-90">Gastos no mês</p>
          </div>
          <p className="text-2xl font-bold">R$ {monthExpenses.toFixed(2)}</p>
          {salaryUsedPct !== null && <p className="text-xs opacity-75 mt-1">{salaryUsedPct.toFixed(0)}% do salário</p>}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4" />
            <p className="text-sm opacity-90">Guardado no mês</p>
          </div>
          <p className="text-2xl font-bold">R$ {savedThisMonth.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">Receitas no mês: R$ {monthIncome.toFixed(2)}</p>
        </div>
      </div>

      {showAlert && (
        <div className="mt-4 bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Atenção:</strong> o saldo disponível está baixo para manter gastos diários até o fim do mês.
          </p>
        </div>
      )}
    </motion.div>
  )
}