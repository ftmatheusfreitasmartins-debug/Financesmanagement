import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  FinanceState,
  Transaction,
  RecurringTransaction,
  Goal,
  Budget,
  SavedMoney,
  FinancialProjection,
  SpendingPattern,
} from '@/types/finance'

import {
  startOfMonth,
  format,
  subMonths,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  getDay,
} from 'date-fns'

 import {
   sanitizeString,
   validateNumber,
   validateDate,
   validateArray,
   validateTags,
   validateCurrency,
   validateImageMIME,
   validateImageSize,
   generateSecureId,
   safeJSONParse,
   deepSanitize,
   rateLimiter,
 } from '@/utils/security'


type NewTransaction = Omit<Transaction, 'id'>
type NewRecurring = Omit<RecurringTransaction, 'id' | 'active' | 'lastExecuted'>
type NewGoal = Omit<Goal, 'id' | 'currentAmount'>
type NewSavedMoney = Omit<SavedMoney, 'id'>

const MAX_TRANSACTIONS = 5000
const MAX_GOALS = 100
const MAX_BUDGETS = 50
const MAX_SAVED_MONEY = 100
const MAX_RECURRING = 200

function amountInBRL(t: any, state: any): number {
  const amt = validateNumber(t?.amount, 0, 999999999)
  const currency = validateCurrency(t?.currency)

  if (currency === 'BRL') return amt

  const rate = validateNumber(t?.exchangeRate ?? state?.currencies?.[currency], 0.01, 1000)
  return amt * rate
}

function normalizeRecurringDates(r: any): RecurringTransaction {
  const start = validateDate(r?.startDate)
  const end = r?.endDate ? validateDate(r.endDate) : undefined
  const last = r?.lastExecuted ? validateDate(r.lastExecuted) : undefined

  const safeEnd = end && end.getTime() < start.getTime() ? undefined : end

  return {
    ...r,
    startDate: start,
    endDate: safeEnd,
    lastExecuted: last,
  } as RecurringTransaction
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      salary: 0,
      transactions: [],
      recurringTransactions: [],
      goals: [],
      budgets: [],
      savedMoney: [],
      darkMode: false,

      currencies: {
        BRL: 1,
        USD: 5.85,
        EUR: 6.15,
      },

      setSalary: (salary: number) => {
        set({ salary: validateNumber(salary, 0, 10000000) })
      },

      addTransaction: (transaction: NewTransaction) => {
        if (!rateLimiter.check('addTransaction', 10, 1000)) return

        set((state) => {
          const sanitized: Transaction = {
            id: generateSecureId(),
            description: sanitizeString(transaction.description, 200),
            amount: validateNumber(transaction.amount, 0, 999999999),
            category: sanitizeString(transaction.category, 50),
            type: transaction.type === 'income' ? 'income' : 'expense',
            date: validateDate(transaction.date),
            currency: validateCurrency((transaction as any).currency),
            exchangeRate: validateNumber((transaction as any).exchangeRate, 0.01, 1000),
            tags: validateTags((transaction as any).tags),
            recurring: Boolean((transaction as any).recurring),
            recurringId: (transaction as any).recurringId
              ? sanitizeString((transaction as any).recurringId, 100)
              : undefined,
            split: (transaction as any).split
              ? {
                  total: validateNumber((transaction as any).split.total, 0, 999999999),
                  people: validateNumber((transaction as any).split.people, 1, 100),
                  sharedWith: validateArray<string>((transaction as any).split.sharedWith, 100).map((s) =>
                    sanitizeString(String(s), 100),
                  ),
                }
              : undefined,
            receipt: (transaction as any).receipt
              ? sanitizeString((transaction as any).receipt, 500000)
              : undefined,
          }

          return {
            transactions: [sanitized, ...state.transactions].slice(0, MAX_TRANSACTIONS),
          }
        })
      },

      removeTransaction: (id: string) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== sanitizeString(id, 100)),
        })),

      updateTransaction: (id: string, updates: Partial<Transaction>) => {
        const sanitizedId = sanitizeString(id, 100)
        set((state) => ({
          transactions: state.transactions.map((t) => {
            if (t.id !== sanitizedId) return t
            return {
              ...t,
              description: updates.description ? sanitizeString(updates.description, 200) : t.description,
              amount: updates.amount !== undefined ? validateNumber(updates.amount, 0, 999999999) : t.amount,
              category: updates.category ? sanitizeString(updates.category, 50) : t.category,
              type: updates.type || t.type,
              date: updates.date ? validateDate(updates.date) : validateDate(t.date),
              tags: updates.tags ? validateTags(updates.tags as any) : t.tags,
              currency: updates.currency ? validateCurrency(updates.currency) : (t as any).currency,
              exchangeRate:
                (updates as any).exchangeRate !== undefined
                  ? validateNumber((updates as any).exchangeRate, 0.01, 1000)
                  : (t as any).exchangeRate,
              receipt: Object.prototype.hasOwnProperty.call(updates as any, 'receipt')
                ? ((updates as any).receipt ? sanitizeString((updates as any).receipt, 500000) : undefined)
                : (t as any).receipt,
            }
          }),
        }))
      },

      addRecurringTransaction: (transaction: NewRecurring) =>
        set((state) => {
          if (state.recurringTransactions.length >= MAX_RECURRING) return state

          const sanitized: RecurringTransaction = normalizeRecurringDates({
            id: generateSecureId(),
            description: sanitizeString(transaction.description, 200),
            amount: validateNumber(transaction.amount, 0, 999999999),
            category: sanitizeString(transaction.category, 50),
            type: transaction.type === 'income' ? 'income' : 'expense',
            frequency: ['daily', 'weekly', 'monthly', 'yearly'].includes(transaction.frequency)
              ? transaction.frequency
              : 'monthly',
            startDate: validateDate(transaction.startDate),
            endDate: transaction.endDate ? validateDate(transaction.endDate) : undefined,
            tags: validateTags((transaction as any).tags),
            currency: validateCurrency((transaction as any).currency),
            active: true,
            lastExecuted: undefined,
          })

          return { recurringTransactions: [...state.recurringTransactions, sanitized] }
        }),

      removeRecurringTransaction: (id: string) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter((r) => r.id !== sanitizeString(id, 100)),
        })),

      toggleRecurringTransaction: (id: string) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((r) =>
            r.id === sanitizeString(id, 100) ? { ...r, active: !r.active } : r,
          ),
        })),

      updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((r) => {
            if (r.id !== sanitizeString(id, 100)) return r
            const merged = { ...r, ...deepSanitize(updates) }
            return normalizeRecurringDates(merged)
          }),
        })),

      processRecurringTransactions: () => {
        const state = get()
        const now = new Date()

        state.recurringTransactions.forEach((recurring) => {
          if (!recurring.active) return

          const lastExecuted = recurring.lastExecuted ? validateDate(recurring.lastExecuted) : null
          const startDate = validateDate(recurring.startDate)

          let nextDate = lastExecuted || startDate
          switch (recurring.frequency) {
            case 'daily':
              nextDate = addDays(nextDate, 1)
              break
            case 'weekly':
              nextDate = addWeeks(nextDate, 1)
              break
            case 'monthly':
              nextDate = addMonths(nextDate, 1)
              break
            case 'yearly':
              nextDate = addYears(nextDate, 1)
              break
          }

          const shouldExecute =
            isBefore(nextDate, now) || nextDate.toDateString() === now.toDateString()

          const endOk = !recurring.endDate || isBefore(now, validateDate(recurring.endDate))

          if (!shouldExecute || !endOk) return

          state.addTransaction({
            description: recurring.description,
            amount: recurring.amount,
            category: recurring.category,
            type: recurring.type,
            date: now,
            recurring: true,
            recurringId: recurring.id,
            tags: recurring.tags,
            currency: recurring.currency || 'BRL',
          } as any)

          set((s) => ({
            recurringTransactions: s.recurringTransactions.map((r) =>
              r.id === recurring.id ? { ...r, lastExecuted: now } : r,
            ),
          }))
        })
      },

      addGoal: (goal: NewGoal) =>
        set((state) => {
          if (state.goals.length >= MAX_GOALS) return state
          const sanitized: Goal = {
            id: generateSecureId(),
            name: sanitizeString(goal.name, 100),
            targetAmount: validateNumber(goal.targetAmount, 1, 999999999),
            currentAmount: 0,
            deadline: validateDate(goal.deadline),
            category: sanitizeString(goal.category, 50),
            color: sanitizeString(goal.color, 20),
          }
          return { goals: [...state.goals, sanitized] }
        }),

      removeGoal: (id: string) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== sanitizeString(id, 100)),
        })),

      updateGoalProgress: (id: string, amount: number) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === sanitizeString(id, 100)
              ? { ...g, currentAmount: validateNumber(g.currentAmount + amount, 0, g.targetAmount) }
              : g,
          ),
        })),

      setBudget: (category: string, limit: number, period: 'monthly' | 'weekly') =>
        set((state) => {
          const sanitizedCategory = sanitizeString(category, 50)
          const validatedLimit = validateNumber(limit, 1, 999999999)
          const existingBudgets = state.budgets.filter((b) => b.category !== sanitizedCategory)
          return {
            budgets: [
              ...existingBudgets,
              { category: sanitizedCategory, limit: validatedLimit, spent: 0, period },
            ],
          }
        }),

      removeBudget: (category: string) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.category !== sanitizeString(category, 50)),
        })),

      addSavedMoney: (saving: NewSavedMoney) =>
        set((state) => {
          const sanitized: SavedMoney = {
            id: generateSecureId(),
            amount: validateNumber(saving.amount, 0, 999999999),
            description: sanitizeString(saving.description, 200),
            date: validateDate(saving.date),
            goal: saving.goal ? sanitizeString(saving.goal, 100) : undefined,
          }
          return { savedMoney: [...state.savedMoney, sanitized].slice(0, MAX_SAVED_MONEY) }
        }),

      removeSavedMoney: (id: string) =>
        set((state) => ({
          savedMoney: state.savedMoney.filter((s) => s.id !== sanitizeString(id, 100)),
        })),

      getTotalSaved: () => {
        const state = get()
        return state.savedMoney.reduce((sum, s) => sum + validateNumber(s.amount, 0), 0)
      },

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      updateCurrency: (currency: 'USD' | 'EUR', rate: number) =>
        set((state) => ({
          currencies: { ...state.currencies, [currency]: validateNumber(rate, 0.01, 1000) },
        })),

refreshCurrencyRates: async (opts?: { force?: boolean }) => {
  const force = !!opts?.force

  // Auto: 1 request / 10 min (por aba)
  // Manual: 1 request / 30s (cooldown do botão)
  const key = force ? 'refreshCurrencyRatesManual' : 'refreshCurrencyRates'
  const windowMs = force ? 30_000 : 10 * 60 * 1000

  if (!rateLimiter.check(key, 1, windowMs)) return false

  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=BRL,USD', {
      cache: 'no-store',
    })
    if (!res.ok) return false

    const data = await res.json()

    const eurToBrl = validateNumber(data?.rates?.BRL, 0.01, 1000) // BRL por 1 EUR
    const eurToUsd = validateNumber(data?.rates?.USD, 0.000001, 1000) // USD por 1 EUR

    // BRL por 1 USD = (BRL/EUR) / (USD/EUR)
    const usdToBrl = validateNumber(eurToBrl / eurToUsd, 0.01, 1000)

    set((state) => ({
      currencies: {
        ...state.currencies,
        BRL: 1,
        USD: usdToBrl,
        EUR: eurToBrl,
      },
    }))

    return true
  } catch {
    // silencioso: mantém a última taxa conhecida
    return false
  }
},


      getBalance: () => {
        const state = get()
        const totalIncome = state.transactions
  .filter((t) => t.type === 'income')
  .reduce((sum, t) => sum + amountInBRL(t, state), 0)

        const totalExpenses = state.transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + amountInBRL(t, state), 0)

        const totalSaved = state.savedMoney.reduce((sum, s) => sum + validateNumber(s.amount, 0), 0)
        return totalIncome - totalExpenses - totalSaved
      },

      getAvailableBalance: () => get().getBalance(),

      getTotalBalance: () => {
        const state = get()
        const totalIncome = state.transactions
  .filter((t) => t.type === 'income')
  .reduce((sum, t) => sum + amountInBRL(t, state), 0)


        const totalExpenses = state.transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + amountInBRL(t, state), 0)

        return totalIncome - totalExpenses
      },

      getTotalIncome: () => {
  const state = get()

  return state.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + amountInBRL(t, state), 0)
},


      getTotalExpenses: () => {
        const state = get()
        return state.transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + amountInBRL(t, state), 0)
      },

      getTransactionsByCategory: () => {
        const state = get()
        return state.transactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, transaction) => {
            const value = amountInBRL(transaction, state)
            acc[transaction.category] = (acc[transaction.category] || 0) + value
            return acc
          }, {} as Record<string, number>)
      },

      getMonthlyData: () => {
        const state = get()
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i)
          return {
            month: format(date, 'MMM/yy'),
            start: startOfMonth(date),
            income: 0,
            expenses: 0,
          }
        })

        state.transactions.forEach((t) => {
          const tDate = validateDate((t as any).date)
          const monthData = last6Months.find((m) => {
            const monthEnd = startOfMonth(addMonths(m.start, 1))
            return tDate >= m.start && tDate < monthEnd
          })
          if (!monthData) return

          const value = amountInBRL(t, state)
          if (t.type === 'income') monthData.income += value
          else monthData.expenses += value
        })

        return last6Months.map(({ month, income, expenses }) => ({ month, income, expenses }))
      },

      getCategoryBudgetStatus: () => {
        const state = get()
        const categoryTotals = state.getTransactionsByCategory()
        return state.budgets.map((budget) => ({
          category: budget.category,
          spent: categoryTotals[budget.category] || 0,
          limit: budget.limit,
          percentage: Math.round(((categoryTotals[budget.category] || 0) / budget.limit) * 100),
        }))
      },

      getFinancialProjection: (months: number): FinancialProjection[] => {
        const state = get()
        const projections: FinancialProjection[] = []

        // Helpers
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

        const median = (arr: number[]) => {
          const a = arr.filter((n) => Number.isFinite(n)).slice().sort((x, y) => x - y)
          if (a.length === 0) return 0
          const mid = Math.floor(a.length / 2)
          return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
        }

        const mean = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0)

        const std = (arr: number[]) => {
          if (arr.length < 2) return 0
          const m = mean(arr)
          const v = mean(arr.map((x) => (x - m) ** 2))
          return Math.sqrt(v)
        }

        const amountRecurringInBRL = (r: any) => {
          const currency = validateCurrency(r?.currency)
          const amt = validateNumber(r?.amount, 0, 999999999)
          if (currency === 'BRL') return amt
          const rate = validateNumber((state.currencies as any)?.[currency], 0.01, 1000)
          return amt * rate
        }

        const addByFreq = (d: Date, freq: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
          switch (freq) {
            case 'daily':
              return addDays(d, 1)
            case 'weekly':
              return addWeeks(d, 1)
            case 'monthly':
              return addMonths(d, 1)
            case 'yearly':
              return addYears(d, 1)
          }
        }

        const countOccurrencesInMonth = (r: any, monthStart: Date, monthEndExclusive: Date) => {
          if (!r?.active) return 0
          const start = validateDate(r.startDate)
          const end = r.endDate ? validateDate(r.endDate) : null
          const freq = (
            r.frequency === 'daily' ||
            r.frequency === 'weekly' ||
            r.frequency === 'monthly' ||
            r.frequency === 'yearly'
          )
            ? r.frequency
            : 'monthly'

          let cur = start
          let guard = 0

          // Avança até o mês-alvo
          while (cur < monthStart && guard < 5000) {
            cur = addByFreq(cur, freq)
            guard++
          }

          let count = 0
          while (cur < monthEndExclusive && guard < 10000) {
            if (!end || cur <= end) count++
            cur = addByFreq(cur, freq)
            guard++
          }

          return count
        }

        // 1) Base mensal do histórico recente (últimos 6 meses)
        const lookbackMonths = 6
        const monthsBack = Array.from({ length: lookbackMonths }, (_, i) => {
          const date = subMonths(new Date(), lookbackMonths - 1 - i)
          return { start: startOfMonth(date), end: startOfMonth(addMonths(date, 1)) }
        })

        const variableIncomeByMonth: number[] = []
        const variableExpensesByMonth: number[] = []

        for (const m of monthsBack) {
          let inc = 0
          let exp = 0

          for (const t of state.transactions as any[]) {
            const d = validateDate(t?.date)
            if (d < m.start || d >= m.end) continue
            if (t?.recurring) continue // evita dupla contagem com recorrências futuras

            const v = amountInBRL(t, state)
            if (t.type === 'income') inc += v
            else exp += v
          }

          variableIncomeByMonth.push(inc)
          variableExpensesByMonth.push(exp)
        }

        const avgVarIncome = mean(variableIncomeByMonth)
        const medVarExpenses = median(variableExpensesByMonth)

        // Tendência simples (delta entre início/fim)
        const trendIncome =
          variableIncomeByMonth.length >= 2
            ? (variableIncomeByMonth[variableIncomeByMonth.length - 1] - variableIncomeByMonth[0]) /
              (variableIncomeByMonth.length - 1)
            : 0

        const trendExpenses =
          variableExpensesByMonth.length >= 2
            ? (variableExpensesByMonth[variableExpensesByMonth.length - 1] - variableExpensesByMonth[0]) /
              (variableExpensesByMonth.length - 1)
            : 0

        // 2) Confiança baseada em volatilidade do saldo variável (receitas - despesas)
        const netVarByMonth = variableIncomeByMonth.map((inc, idx) => inc - (variableExpensesByMonth[idx] ?? 0))
        const netMean = mean(netVarByMonth)
        const netStd = std(netVarByMonth)
        const cv = netStd / (Math.abs(netMean) + 1)
        const baseConfidence = clamp(95 - cv * 35, 30, 95)

        // 3) Projeção mês a mês
        let currentBalance = state.getBalance()

        for (let i = 1; i <= months; i++) {
          const monthStart = startOfMonth(addMonths(new Date(), i))
          const monthEnd = startOfMonth(addMonths(monthStart, 1))

          // Recorrências futuras (somadas de verdade)
          let recurringIncome = 0
          let recurringExpenses = 0

          for (const r of state.recurringTransactions as any[]) {
            if (!r?.active) continue
            const count = countOccurrencesInMonth(r, monthStart, monthEnd)
            const total = count * amountRecurringInBRL(r)
            if (r.type === 'income') recurringIncome += total
            else recurringExpenses += total
          }

          // Variáveis: média/mediana + tendência
          const variableIncome = Math.max(0, avgVarIncome + trendIncome * (i - 1))
          const variableExpenses = Math.max(0, medVarExpenses + trendExpenses * (i - 1))

          const projectedIncome = state.salary + variableIncome + recurringIncome
          const projectedExpenses = variableExpenses + recurringExpenses

          currentBalance += projectedIncome - projectedExpenses

          const confidence = clamp(baseConfidence - i * 3, 20, 95)

          projections.push({
            month: format(addMonths(new Date(), i), 'MMM/yy'),
            projectedBalance: currentBalance,
            projectedIncome,
            projectedExpenses,
            confidence,
          })
        }

        return projections
      },

      getSpendingPatterns: (): SpendingPattern[] => {
        const state = get()
        const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

        const patterns = daysOfWeek.map((dayName, dayIndex) => {
          const dayTransactions = state.transactions.filter(
            (t) => t.type === 'expense' && getDay(validateDate((t as any).date)) === dayIndex,
          )
          const total = dayTransactions.reduce((sum, t) => sum + amountInBRL(t, state), 0)
          const average = dayTransactions.length > 0 ? total / dayTransactions.length : 0
          return { dayOfWeek: dayName, averageSpending: average, percentage: 0, trend: 'stable' as const }
        })

        const totalAvg = patterns.reduce((sum, p) => sum + p.averageSpending, 0)
        return patterns.map((p) => ({
          ...p,
          percentage: totalAvg > 0 ? (p.averageSpending / totalAvg) * 100 : 0,
          trend:
            p.averageSpending > totalAvg * 1.2
              ? 'increasing'
              : p.averageSpending < totalAvg * 0.8
                ? 'decreasing'
                : 'stable',
        }))
      },

      getTaggedTransactions: (tag: string) => {
        const state = get()
        return state.transactions.filter((t) => t.tags?.includes(tag))
      },

      getAllTags: () => {
        const state = get()
        const tags = new Set<string>()
        state.transactions.forEach((t) => t.tags?.forEach((tag) => tags.add(tag)))
        return Array.from(tags)
      },

      convertCurrency: (amount: number, from: 'BRL' | 'USD' | 'EUR', to: 'BRL' | 'USD' | 'EUR') => {
        const state = get()
        if (from === to) return amount
        const amountInBRLValue = from === 'BRL' ? amount : amount * state.currencies[from]
        return to === 'BRL' ? amountInBRLValue : amountInBRLValue / state.currencies[to]
      },

      exportData: () => {
        const state = get()
        return JSON.stringify(
          {
            salary: state.salary,
            transactions: state.transactions,
            recurringTransactions: state.recurringTransactions,
            goals: state.goals,
            budgets: state.budgets,
            savedMoney: state.savedMoney,
            currencies: state.currencies,
            exportDate: new Date().toISOString(),
            version: 2,
          },
          null,
          2,
        )
      },

      importData: (data: string) => {
        try {
          const imported = safeJSONParse(data)
          if (!imported || typeof imported !== 'object') throw new Error('Dados inválidos')

          const sanitized = deepSanitize(imported, 5)

          const validatedTransactions = validateArray<any>(sanitized.transactions, MAX_TRANSACTIONS).map((t) => ({
            id: generateSecureId(),
            description: sanitizeString(t.description, 200),
            amount: validateNumber(t.amount, 0, 999999999),
            category: sanitizeString(t.category, 50),
            type: (t.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
            date: validateDate(t.date),
            currency: validateCurrency(t.currency),
            tags: validateTags(t.tags),
            exchangeRate: validateNumber(t.exchangeRate, 0.01, 1000),
            recurring: Boolean(t.recurring),
            recurringId: t.recurringId ? sanitizeString(t.recurringId, 100) : undefined,
            receipt: t.receipt ? sanitizeString(t.receipt, 500000) : undefined,
          }))

          const validatedRecurring = validateArray<any>(sanitized.recurringTransactions, MAX_RECURRING).map((r) =>
            normalizeRecurringDates({
              id: generateSecureId(),
              description: sanitizeString(r.description, 200),
              amount: validateNumber(r.amount, 0, 999999999),
              category: sanitizeString(r.category, 50),
              type: r.type === 'income' ? 'income' : 'expense',
              frequency: ['daily', 'weekly', 'monthly', 'yearly'].includes(r.frequency) ? r.frequency : 'monthly',
              startDate: validateDate(r.startDate),
              endDate: r.endDate ? validateDate(r.endDate) : undefined,
              lastExecuted: r.lastExecuted ? validateDate(r.lastExecuted) : undefined,
              tags: validateTags(r.tags),
              currency: validateCurrency(r.currency),
              active: Boolean(r.active),
            }),
          )

          const validatedGoals = validateArray<any>(sanitized.goals, MAX_GOALS).map((g) => ({
            id: generateSecureId(),
            name: sanitizeString(g.name, 100),
            targetAmount: validateNumber(g.targetAmount, 1, 999999999),
            currentAmount: validateNumber(g.currentAmount, 0, validateNumber(g.targetAmount, 1, 999999999)),
            deadline: validateDate(g.deadline),
            category: sanitizeString(g.category, 50),
            color: sanitizeString(g.color, 20),
          }))

          const validatedBudgets = validateArray<any>(sanitized.budgets, MAX_BUDGETS).map((b) => ({
            category: sanitizeString(b.category, 50),
            limit: validateNumber(b.limit, 1, 999999999),
            spent: validateNumber(b.spent, 0, 999999999),
            period: (b.period === 'weekly' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
          }))

          const validatedSaved = validateArray<any>(sanitized.savedMoney, MAX_SAVED_MONEY).map((s) => ({
            id: generateSecureId(),
            amount: validateNumber(s.amount, 0, 999999999),
            description: sanitizeString(s.description, 200),
            date: validateDate(s.date),
            goal: s.goal ? sanitizeString(s.goal, 100) : undefined,
          }))

          set({
            salary: validateNumber(sanitized.salary, 0, 10000000),
            transactions: validatedTransactions,
            recurringTransactions: validatedRecurring,
            goals: validatedGoals,
            budgets: validatedBudgets,
            savedMoney: validatedSaved,
            currencies: {
              BRL: 1,
              USD: validateNumber(sanitized.currencies?.USD, 0.01, 1000),
              EUR: validateNumber(sanitized.currencies?.EUR, 0.01, 1000),
            },
          })
        } catch (error) {
          console.error('Erro ao importar:', error)
          alert('Arquivo inválido!')
        }
      },

      clearAllData: () =>
        set({
          salary: 0,
          transactions: [],
          recurringTransactions: [],
          goals: [],
          budgets: [],
          savedMoney: [],
        }),
    }),
    {
      name: 'finance-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        salary: state.salary,
        transactions: state.transactions,
        recurringTransactions: state.recurringTransactions,
        goals: state.goals,
        budgets: state.budgets,
        savedMoney: state.savedMoney,
        darkMode: state.darkMode,
        currencies: state.currencies,
      }),
    },
  ),
)

if (typeof window !== 'undefined') {
  useFinanceStore.getState().processRecurringTransactions()
  setInterval(() => useFinanceStore.getState().processRecurringTransactions(), 3600000)

  window.addEventListener('storage', (e) => {
    if (e.key === 'finance-storage' && e.newValue) {
      try {
        const newState = safeJSONParse(e.newValue)
        if (newState?.state) useFinanceStore.setState(newState.state)
      } catch (error) {
        console.error('Erro:', error)
      }
    }
  })
}
