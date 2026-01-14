'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, TrendingDown, Target, X } from 'lucide-react'
import { useFinanceStore } from '../store/financeStore'

type AlertType = 'warning' | 'danger' | 'success' | 'info'

interface Alert {
  id: string
  type: AlertType
  title: string
  message: string
  icon: any
}

type Toast = Alert & {
  createdAt: number
  expiresAt: number
  paused: boolean
  pauseStartedAt?: number
}

const TTL_MS = 60_000
const MAX_TOASTS = 4

export default function SmartAlerts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [now, setNow] = useState(() => Date.now())

  const transactions = useFinanceStore((s) => s.transactions)
  const getCategoryBudgetStatus = useFinanceStore((s) => s.getCategoryBudgetStatus)
  const goals = useFinanceStore((s) => s.goals)
  const getBalance = useFinanceStore((s) => s.getBalance)

  const candidateAlerts: Alert[] = useMemo(() => {
    const newAlerts: Alert[] = []

    // 1) Orçamento
    const budgets = getCategoryBudgetStatus()
    budgets.forEach((budget: any) => {
      const alertId = `budget-${budget.category}`

      if (budget.percentage > 100) {
        newAlerts.push({
          id: alertId,
          type: 'danger',
          title: 'Orçamento excedido',
          message: `Você gastou ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category}. (R$ ${budget.spent.toFixed(
            2
          )} de R$ ${budget.limit.toFixed(2)})`,
          icon: AlertTriangle,
        })
      } else if (budget.percentage >= 80) {
        newAlerts.push({
          id: alertId,
          type: 'warning',
          title: 'Atenção ao orçamento',
          message: `Você já usou ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category}. Restam R$ ${(
            budget.limit - budget.spent
          ).toFixed(2)}.`,
          icon: AlertTriangle,
        })
      }
    })

    // 2) Meta atingida
    goals.forEach((goal: any) => {
      const alertId = `goal-${goal.id}`
      const percentage = (goal.currentAmount / goal.targetAmount) * 100

      if (percentage >= 100) {
        newAlerts.push({
          id: alertId,
          type: 'success',
          title: 'Meta alcançada',
          message: `Parabéns! Você atingiu a meta ${goal.name} de R$ ${goal.targetAmount.toFixed(2)}!`,
          icon: Target,
        })
      }
    })

    // 3) Saldo negativo
    const balance = getBalance()
    if (balance < 0) {
      newAlerts.push({
        id: 'negative-balance',
        type: 'danger',
        title: 'Saldo negativo',
        message: `Seu saldo está negativo em R$ ${Math.abs(balance).toFixed(2)}. Cuidado com novos gastos!`,
        icon: TrendingDown,
      })
    }

    // 4) Gasto atípico
    if (transactions.length >= 7) {
      const last7 = transactions.slice(0, 7)
      const avgExpense =
        last7.filter((t: any) => t?.type === 'expense').reduce((sum: number, t: any) => sum + (t?.amount ?? 0), 0) / 7

      const last = transactions[0]
      if (last?.type === 'expense' && last.amount > avgExpense * 2) {
        newAlerts.push({
          id: `unusual-${last.id}`,
          type: 'info',
          title: 'Gasto atípico detectado',
          message: `O gasto ${last.description} de R$ ${last.amount.toFixed(2)} é ${(last.amount / avgExpense).toFixed(
            1
          )}x maior que sua média diária.`,
          icon: AlertTriangle,
        })
      }
    }

    return newAlerts
  }, [transactions, getCategoryBudgetStatus, goals, getBalance])

  // Concilia candidates -> toasts (dedupe + update)
  useEffect(() => {
    const now = Date.now()

    setToasts((prev) => {
      const byId = new Map(prev.map((t) => [t.id, t]))

      // adiciona/atualiza os que continuam válidos
      for (const a of candidateAlerts) {
        if (dismissed.includes(a.id)) continue

        const existing = byId.get(a.id)
        if (!existing) {
          byId.set(a.id, {
            ...a,
            createdAt: now,
            expiresAt: now + TTL_MS,
            paused: false,
          })
        } else {
          byId.set(a.id, { ...existing, ...a })
        }
      }

      // remove os que não são mais válidos (ex.: orçamento voltou ao normal)
      for (const id of Array.from(byId.keys())) {
        const stillValid = candidateAlerts.some((a) => a.id === id)
        if (!stillValid) byId.delete(id)
      }

      const next = Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt)
      return next.slice(0, MAX_TOASTS)
    })
  }, [candidateAlerts, dismissed])

  // Tick: atualiza barra + expira toasts
  useEffect(() => {
    const id = window.setInterval(() => {
      const n = Date.now()
      setNow(n)

      setToasts((prev) => prev.filter((t) => t.paused || t.expiresAt > n))
    }, 250)

    return () => window.clearInterval(id)
  }, [])

  const dismissToast = (id: string) => {
    setDismissed((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const pauseToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id && !t.paused ? { ...t, paused: true, pauseStartedAt: Date.now() } : t
      )
    )
  }

  const resumeToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id || !t.paused || !t.pauseStartedAt) return t
        const delta = Date.now() - t.pauseStartedAt
        return { ...t, paused: false, pauseStartedAt: undefined, expiresAt: t.expiresAt + delta }
      })
    )
  }

  if (toasts.length === 0) return null

  const colorClasses: Record<AlertType, string> = {
    danger: 'bg-red-50/95 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50/95 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    success: 'bg-green-50/95 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    info: 'bg-blue-50/95 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  }

  const iconColorClasses: Record<AlertType, string> = {
    danger: 'text-red-600 dark:text-red-300',
    warning: 'text-yellow-600 dark:text-yellow-300',
    success: 'text-green-600 dark:text-green-300',
    info: 'text-blue-600 dark:text-blue-300',
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 w-[92vw] max-w-md space-y-3 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toast.icon
          const remaining = Math.max(0, toast.expiresAt - now)
          const pct = Math.max(0, Math.min(100, (remaining / TTL_MS) * 100))

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={`${colorClasses[toast.type]} pointer-events-auto relative overflow-hidden rounded-xl border shadow-xl backdrop-blur`}
              onMouseEnter={() => pauseToast(toast.id)}
              onMouseLeave={() => resumeToast(toast.id)}
            >
              {/* progress bar */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-1 bg-black/25 dark:bg-white/25"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="p-4 flex items-start gap-3">
                <Icon className={`w-5 h-5 ${iconColorClasses[toast.type]} flex-shrink-0 mt-0.5`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className={`font-semibold ${iconColorClasses[toast.type]} truncate`}>
                      {toast.title}
                    </h4>

                    <button
                      onClick={() => dismissToast(toast.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      aria-label="Fechar notificação"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                    {toast.message}
                  </p>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                    Fecha automaticamente em {Math.ceil(remaining / 1000)}s
                    {toast.paused ? ' (pausado)' : ''}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
