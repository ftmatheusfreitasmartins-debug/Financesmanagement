import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
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

// Helper para converter valores em BRL considerando moeda e câmbio
function amountInBRL(t: any, state: any) {
  const amt = Number(t?.amount)
  if (!Number.isFinite(amt)) return 0

  const currency = t?.currency ?? 'BRL'
  if (currency === 'BRL') return amt

  const rate = t?.exchangeRate ?? state?.currencies?.[currency] ?? 1
  return Number.isFinite(rate) ? amt * rate : amt
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

      // Salary
      setSalary: (salary: number) => set({ salary }),

      // Transactions
      addTransaction: (transaction: Omit<Transaction, 'id'>) =>
        set((state) => {
          const amt = Number(transaction.amount)
          const currency = transaction.currency ?? 'BRL'
          const exchangeRate =
            currency === 'BRL'
              ? 1
              : transaction.exchangeRate ?? state.currencies[currency] ?? 1

          return {
            transactions: [
              {
                ...transaction,
                id: crypto.randomUUID(),
                amount: Number.isFinite(amt) ? amt : 0,
                currency,
                exchangeRate,
              },
              ...state.transactions,
            ],
          }
        }),

      removeTransaction: (id: string) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      updateTransaction: (id: string, updates: Partial<Transaction>) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),

      // Recurring Transactions
      addRecurringTransaction: (
        transaction: Omit<RecurringTransaction, 'id' | 'lastExecuted' | 'active'>,
      ) =>
        set((state) => ({
          recurringTransactions: [
            ...state.recurringTransactions,
            {
              ...transaction,
              id: crypto.randomUUID(),
              active: true,
              lastExecuted: undefined,
            },
          ],
        })),

      removeRecurringTransaction: (id: string) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter(
            (r) => r.id !== id,
          ),
        })),

      toggleRecurringTransaction: (id: string) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((r) =>
            r.id === id ? { ...r, active: !r.active } : r,
          ),
        })),

      updateRecurringTransaction: (
        id: string,
        updates: Partial<RecurringTransaction>,
      ) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        })),

      processRecurringTransactions: () => {
        const state = get()
        const now = new Date()

        state.recurringTransactions.forEach((recurring) => {
          if (!recurring.active) return

          const lastExecuted = recurring.lastExecuted
            ? new Date(recurring.lastExecuted)
            : null
          const startDate = new Date(recurring.startDate)

          let shouldExecute = false
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

          shouldExecute =
            isBefore(nextDate, now) ||
            nextDate.toDateString() === now.toDateString()

          if (
            shouldExecute &&
            (!recurring.endDate || isBefore(now, new Date(recurring.endDate)))
          ) {
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
            })

            set((s) => ({
              recurringTransactions: s.recurringTransactions.map((r) =>
                r.id === recurring.id ? { ...r, lastExecuted: now } : r,
              ),
            }))
          }
        })
      },

      // Goals
      addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) =>
        set((state) => ({
          goals: [
            ...state.goals,
            { ...goal, id: crypto.randomUUID(), currentAmount: 0 },
          ],
        })),

      removeGoal: (id: string) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      updateGoalProgress: (id: string, amount: number) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: g.currentAmount + amount }
              : g,
          ),
        })),

      // Budgets
      setBudget: (
        category: string,
        limit: number,
        period: 'monthly' | 'weekly',
      ) =>
        set((state) => {
          const existingBudgets = state.budgets.filter(
            (b) => b.category !== category,
          )
          return {
            budgets: [
              ...existingBudgets,
              { category, limit, spent: 0, period },
            ],
          }
        }),

      removeBudget: (category: string) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.category !== category),
        })),

      // Savings
      addSavedMoney: (saving: Omit<SavedMoney, 'id'>) =>
        set((state) => ({
          savedMoney: [
            ...state.savedMoney,
            { ...saving, id: crypto.randomUUID() },
          ],
        })),

      removeSavedMoney: (id: string) =>
        set((state) => ({
          savedMoney: state.savedMoney.filter((s) => s.id !== id),
        })),

      getTotalSaved: () => {
        const state = get()
        return state.savedMoney.reduce((sum, s) => sum + s.amount, 0)
      },

      // Settings
      toggleDarkMode: () =>
        set((state) => ({ darkMode: !state.darkMode })),

      updateCurrency: (currency: 'USD' | 'EUR', rate: number) =>
        set((state) => ({
          currencies: { ...state.currencies, [currency]: rate },
        })),

      // Computed
      getBalance: () => {
        const state = get()

        const totalIncome =
          state.salary +
          state.transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + amountInBRL(t, state), 0)

        const totalExpenses = state.transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + amountInBRL(t, state), 0)

        const totalSaved = state.savedMoney.reduce(
          (sum, s) => sum + s.amount,
          0,
        )

        return totalIncome - totalExpenses - totalSaved
      },

      getAvailableBalance: () => get().getBalance(),

      getTotalBalance: () => {
        const state = get()

        const totalIncome =
          state.salary +
          state.transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + amountInBRL(t, state), 0)

        const totalExpenses = state.transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + amountInBRL(t, state), 0)

        return totalIncome - totalExpenses
      },

      getTotalIncome: () => {
        const state = get()
        return (
          state.salary +
          state.transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + amountInBRL(t, state), 0)
        )
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
            acc[transaction.category] =
              (acc[transaction.category] || 0) + value
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
          const monthData = last6Months.find((m) => {
            const tDate = new Date(t.date)
            return (
              tDate >= m.start &&
              tDate < startOfMonth(addMonths(m.start, 1))
            )
          })

          if (monthData) {
            const value = amountInBRL(t, state)
            if (t.type === 'income') {
              monthData.income += value
            } else {
              monthData.expenses += value
            }
          }
        })

        return last6Months.map(({ month, income, expenses }) => ({
          month,
          income,
          expenses,
        }))
      },

      getCategoryBudgetStatus: () => {
        const state = get()
        const categoryTotals = state.getTransactionsByCategory()

        return state.budgets.map((budget) => ({
          category: budget.category,
          spent: categoryTotals[budget.category] || 0,
          limit: budget.limit,
          percentage: Math.round(
            ((categoryTotals[budget.category] || 0) / budget.limit) *
              100,
          ),
        }))
      },

      // Advanced Analytics – projeção mais útil e precisa
      getFinancialProjection: (months: number): FinancialProjection[] => {
        const state = get()
        const monthlyData = state.getMonthlyData()

        // Pouco histórico → fallback simples
        if (monthlyData.length < 2) {
          const projections: FinancialProjection[] = []
          let currentBalance = state.getBalance()

          for (let i = 1; i <= months; i++) {
            const projectedIncome = state.salary
            const projectedExpenses = state.salary * 0.7
            currentBalance += projectedIncome - projectedExpenses

            projections.push({
              month: format(addMonths(new Date(), i), 'MMM/yy'),
              projectedBalance: currentBalance,
              projectedIncome,
              projectedExpenses,
              confidence: 30,
            })
          }

          return projections
        }

        const avgIncome =
          monthlyData.reduce((sum, m) => sum + m.income, 0) /
          monthlyData.length
        const avgExpenses =
          monthlyData.reduce((sum, m) => sum + m.expenses, 0) /
          monthlyData.length

        const expenseTrend =
          monthlyData.length > 1
            ? (monthlyData[monthlyData.length - 1].expenses -
                monthlyData[0].expenses) /
              monthlyData.length
            : 0

        const expenseVariances = monthlyData.map((m) =>
          Math.pow(m.expenses - avgExpenses, 2),
        )
        const expenseStdDev = Math.sqrt(
          expenseVariances.reduce((a, b) => a + b, 0) /
            monthlyData.length,
        )
        const volatilityFactor =
          avgExpenses > 0 ? expenseStdDev / avgExpenses : 0

        const getRecurringImpact = (monthsAhead: number) => {
          let futureIncome = 0
          let futureExpenses = 0

          state.recurringTransactions
            .filter((r) => r.active)
            .forEach((recurring) => {
              let occurrences = 0

              switch (recurring.frequency) {
                case 'monthly':
                  occurrences = monthsAhead
                  break
                case 'weekly':
                  occurrences = monthsAhead * 4
                  break
                case 'daily':
                  occurrences = monthsAhead * 30
                  break
                case 'yearly':
                  occurrences = monthsAhead >= 12 ? 1 : 0
                  break
              }

              const amount = recurring.amount * occurrences
              if (recurring.type === 'income') {
                futureIncome += amount
              } else {
                futureExpenses += amount
              }
            })

          return { futureIncome, futureExpenses }
        }

        const projections: FinancialProjection[] = []
        let currentBalance = state.getBalance()

        for (let i = 1; i <= months; i++) {
          const projectedExpenses = Math.max(
            0,
            avgExpenses + expenseTrend * i,
          )

          const extraIncome = avgIncome - state.salary
          const projectedIncome = state.salary + extraIncome

          const recurring = getRecurringImpact(i)
          const totalIncome = projectedIncome + recurring.futureIncome
          const totalExpenses =
            projectedExpenses + recurring.futureExpenses

          const monthlyChange = totalIncome - totalExpenses
          currentBalance += monthlyChange

          const timeDecay = Math.max(100 - i * 8, 40)
          const volatilityPenalty = Math.max(
            0,
            20 - volatilityFactor * 100,
          )
          const confidence = Math.min(
            timeDecay - volatilityPenalty,
            95,
          )

          projections.push({
            month: format(addMonths(new Date(), i), 'MMM/yy'),
            projectedBalance: currentBalance,
            projectedIncome: totalIncome,
            projectedExpenses: totalExpenses,
            confidence: Math.round(confidence),
          })
        }

        return projections
      },

      getSpendingPatterns: (): SpendingPattern[] => {
        const state = get()
        const daysOfWeek = [
          'Domingo',
          'Segunda',
          'Terça',
          'Quarta',
          'Quinta',
          'Sexta',
          'Sábado',
        ]

        const patterns = daysOfWeek.map((dayName, dayIndex) => {
          const dayTransactions = state.transactions.filter(
            (t) =>
              t.type === 'expense' &&
              getDay(new Date(t.date)) === dayIndex,
          )

          const total = dayTransactions.reduce(
            (sum, t) => sum + amountInBRL(t, state),
            0,
          )
          const average =
            dayTransactions.length > 0
              ? total / dayTransactions.length
              : 0

          return {
            dayOfWeek: dayName,
            averageSpending: average,
            percentage: 0,
            trend: 'stable' as const,
          }
        })

        const totalAvg = patterns.reduce(
          (sum, p) => sum + p.averageSpending,
          0,
        )

        return patterns.map((p) => ({
          ...p,
          percentage:
            totalAvg > 0 ? (p.averageSpending / totalAvg) * 100 : 0,
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
        state.transactions.forEach((t) => {
          t.tags?.forEach((tag) => tags.add(tag))
        })
        return Array.from(tags)
      },

      // Multi-currency
      convertCurrency: (
        amount: number,
        from: 'BRL' | 'USD' | 'EUR',
        to: 'BRL' | 'USD' | 'EUR',
      ) => {
        const state = get()
        if (from === to) return amount

        const amountInBRL =
          from === 'BRL' ? amount : amount * state.currencies[from]
        return to === 'BRL'
          ? amountInBRL
          : amountInBRL / state.currencies[to]
      },

      // Export/Import
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
          },
          null,
          2,
        )
      },

      importData: (data: string) => {
        try {
          const imported = JSON.parse(data)
          set({
            salary: imported.salary || 0,
            transactions: imported.transactions || [],
            recurringTransactions:
              imported.recurringTransactions || [],
            goals: imported.goals || [],
            budgets: imported.budgets || [],
            savedMoney: imported.savedMoney || [],
            currencies:
              imported.currencies || {
                BRL: 1,
                USD: 5.85,
                EUR: 6.15,
              },
          })
        } catch (error) {
          console.error('Erro ao importar dados:', error)
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
      migrate: (persisted: any) => {
        if (!persisted?.state) return persisted

        const cur =
          persisted.state.currencies || {
            BRL: 1,
            USD: 5.85,
            EUR: 6.15,
          }

        const txs = (persisted.state.transactions || []).map(
          (t: any) => {
            const amount = Number(t.amount)
            const currency = t.currency || 'BRL'
            const rate =
              currency === 'BRL'
                ? 1
                : t.exchangeRate ?? cur[currency] ?? 1

            return {
              ...t,
              amount: Number.isFinite(amount) ? amount : 0,
              currency,
              exchangeRate: rate,
            }
          },
        )

        const rec = (
          persisted.state.recurringTransactions || []
        ).map((r: any) => ({
          ...r,
          currency: r.currency || 'BRL',
        }))

        return {
          ...persisted,
          state: {
            ...persisted.state,
            transactions: txs,
            recurringTransactions: rec,
            savedMoney: persisted.state.savedMoney || [],
          },
        }
      },
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

// Processar transações recorrentes ao iniciar e sincronizar abas
if (typeof window !== 'undefined') {
  useFinanceStore.getState().processRecurringTransactions()

  setInterval(() => {
    useFinanceStore.getState().processRecurringTransactions()
  }, 3600000)

  window.addEventListener('storage', (e) => {
    if (e.key === 'finance-storage' && e.newValue) {
      const newState = JSON.parse(e.newValue)
      useFinanceStore.setState(newState.state)
    }
  })
}
