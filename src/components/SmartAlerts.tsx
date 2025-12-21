'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, TrendingDown, Target, X } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

interface Alert {
  id: string
  type: 'warning' | 'danger' | 'success' | 'info'
  title: string
  message: string
  icon: any
}

export default function SmartAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  
  const transactions = useFinanceStore(state => state.transactions)
  const getCategoryBudgetStatus = useFinanceStore(state => state.getCategoryBudgetStatus)
  const goals = useFinanceStore(state => state.goals)
  const getBalance = useFinanceStore(state => state.getBalance)
  
  useEffect(() => {
    const newAlerts: Alert[] = []
    
    // 1. Alerta de orçamento excedido
    const budgets = getCategoryBudgetStatus()
    budgets.forEach(budget => {
      const alertId = `budget-${budget.category}`
      if (budget.percentage > 100 && !dismissed.includes(alertId)) {
        newAlerts.push({
          id: alertId,
          type: 'danger',
          title: 'Orçamento Excedido!',
          message: `Você gastou ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category}. (R$ ${budget.spent.toFixed(2)} de R$ ${budget.limit.toFixed(2)})`,
          icon: AlertTriangle
        })
      } else if (budget.percentage > 80 && budget.percentage <= 100 && !dismissed.includes(alertId)) {
        newAlerts.push({
          id: alertId,
          type: 'warning',
          title: 'Atenção ao Orçamento',
          message: `Você já usou ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category}. Restam R$ ${(budget.limit - budget.spent).toFixed(2)}.`,
          icon: AlertTriangle
        })
      }
    })
    
    // 2. Alerta de meta atingida
    goals.forEach(goal => {
      const alertId = `goal-${goal.id}`
      const percentage = (goal.currentAmount / goal.targetAmount) * 100
      if (percentage >= 100 && !dismissed.includes(alertId)) {
        newAlerts.push({
          id: alertId,
          type: 'success',
          title: '🎉 Meta Alcançada!',
          message: `Parabéns! Você atingiu a meta "${goal.name}" de R$ ${goal.targetAmount.toFixed(2)}!`,
          icon: Target
        })
      }
    })
    
    // 3. Alerta de saldo negativo
    const balance = getBalance()
    const balanceAlertId = 'negative-balance'
    if (balance < 0 && !dismissed.includes(balanceAlertId)) {
      newAlerts.push({
        id: balanceAlertId,
        type: 'danger',
        title: 'Saldo Negativo',
        message: `Seu saldo está negativo em R$ ${Math.abs(balance).toFixed(2)}. Cuidado com novos gastos!`,
        icon: TrendingDown
      })
    }
    
    // 4. Alerta de gasto atípico (> 2x a média diária)
    if (transactions.length > 7) {
      const last7Days = transactions.slice(0, 7)
      const avgExpense = last7Days
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) / 7
      
      const lastTransaction = transactions[0]
      if (lastTransaction && lastTransaction.type === 'expense' && lastTransaction.amount > avgExpense * 2) {
        const unusualAlertId = `unusual-${lastTransaction.id}`
        if (!dismissed.includes(unusualAlertId)) {
          newAlerts.push({
            id: unusualAlertId,
            type: 'info',
            title: 'Gasto Atípico Detectado',
            message: `O gasto "${lastTransaction.description}" de R$ ${lastTransaction.amount.toFixed(2)} é ${(lastTransaction.amount / avgExpense).toFixed(1)}x maior que sua média diária.`,
            icon: AlertTriangle
          })
        }
      }
    }
    
    setAlerts(newAlerts)
  }, [transactions, getCategoryBudgetStatus, goals, getBalance, dismissed])
  
  const dismissAlert = (id: string) => {
    setDismissed([...dismissed, id])
  }
  
  if (alerts.length === 0) return null
  
  const colorClasses = {
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  }
  
  const iconColorClasses = {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400'
  }
  
  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {alerts.map((alert, index) => {
          const Icon = alert.icon
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`${colorClasses[alert.type]} border rounded-xl p-4 flex items-start gap-3`}
            >
              <Icon className={`w-5 h-5 ${iconColorClasses[alert.type]} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <h4 className={`font-semibold ${iconColorClasses[alert.type]} mb-1`}>
                  {alert.title}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                aria-label="Dispensar alerta"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
