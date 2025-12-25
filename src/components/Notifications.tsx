'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, AlertTriangle, TrendingUp, Target, CheckCircle } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

interface Notification {
  id: string
  type: 'warning' | 'success' | 'info'
  message: string
  timestamp: number
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  
  const getCategoryBudgetStatus = useFinanceStore(state => state.getCategoryBudgetStatus)
  const goals = useFinanceStore(state => state.goals)
  const getBalance = useFinanceStore(state => state.getBalance)

  useEffect(() => {
    const checkNotifications = () => {
      const newNotifications: Notification[] = []
      const now = Date.now()

      // Check budgets
      try {
        const budgets = getCategoryBudgetStatus()
        budgets.forEach(budget => {
          if (budget.percentage > 100) {
            newNotifications.push({
              id: `budget-${budget.category}`,
              type: 'warning',
              message: `Orçamento de ${budget.category} excedido em ${(budget.percentage - 100).toFixed(0)}%!`,
              timestamp: now
            })
          } else if (budget.percentage > 80) {
            newNotifications.push({
              id: `budget-warning-${budget.category}`,
              type: 'warning',
              message: `Você já usou ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category}`,
              timestamp: now
            })
          }
        })
      } catch (e) {
        console.error('Erro ao verificar orçamentos:', e)
      }

      // Check goals
      try {
        goals.forEach(goal => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100
          if (percentage >= 100) {
            newNotifications.push({
              id: `goal-${goal.id}`,
              type: 'success',
              message: `Parabéns! Você alcançou a meta "${goal.name}"! 🎉`,
              timestamp: now
            })
          }
        })
      } catch (e) {
        console.error('Erro ao verificar metas:', e)
      }

      // Check balance
      try {
        const balance = getBalance()
        if (balance < 0) {
          newNotifications.push({
            id: 'negative-balance',
            type: 'warning',
            message: `Saldo negativo! Você está R$ ${Math.abs(balance).toFixed(2)} no vermelho.`,
            timestamp: now
          })
        }
      } catch (e) {
        console.error('Erro ao verificar saldo:', e)
      }

      setNotifications(newNotifications)
    }

    checkNotifications()
    const interval = setInterval(checkNotifications, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [getCategoryBudgetStatus, goals, getBalance])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.length

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {showPanel && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPanel(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, x: 20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, y: -10 }}
              className="absolute right-0 top-14 w-96 max-h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Notificações
                  </h3>
                  <button
                    onClick={() => setShowPanel(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <CheckCircle className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium">Nenhuma notificação</p>
                    <p className="text-xs mt-1">Você está em dia! 🎉</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notif) => {
                      const Icon = notif.type === 'success' ? Target : 
                                   notif.type === 'warning' ? AlertTriangle : 
                                   TrendingUp

                      const colorClass = notif.type === 'success' 
                        ? 'text-green-500 bg-green-100 dark:bg-green-900/20'
                        : notif.type === 'warning'
                        ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/20'
                        : 'text-blue-500 bg-blue-100 dark:bg-blue-900/20'

                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {notif.message}
                                </p>
                                <button
                                  onClick={() => removeNotification(notif.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
