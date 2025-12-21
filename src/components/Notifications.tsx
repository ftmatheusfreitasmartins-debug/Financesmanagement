'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, AlertTriangle, TrendingUp, Target } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

interface Notification {
  id: string
  type: 'warning' | 'success' | 'info'
  message: string
  icon: any
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
      
      // Check budgets
      const budgets = getCategoryBudgetStatus()
      budgets.forEach(budget => {
        if (budget.percentage > 100) {
          newNotifications.push({
            id: `budget-${budget.category}`,
            type: 'warning',
            message: `Orçamento de ${budget.category} excedido em ${(budget.percentage - 100).toFixed(0)}%!`,
            icon: AlertTriangle
          })
        } else if (budget.percentage > 80) {
          newNotifications.push({
            id: `budget-warning-${budget.category}`,
            type: 'warning',
            message: `Você já usou ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category}!`,
            icon: AlertTriangle
          })
        }
      })
      
      // Check goals
      goals.forEach(goal => {
        const percentage = (goal.currentAmount / goal.targetAmount) * 100
        if (percentage >= 100) {
          newNotifications.push({
            id: `goal-${goal.id}`,
            type: 'success',
            message: `Parabéns! Você alcançou a meta "${goal.name}"! 🎉`,
            icon: Target
          })
        }
      })
      
      // Check balance
      const balance = getBalance()
      if (balance < 0) {
        newNotifications.push({
          id: 'negative-balance',
          type: 'warning',
          message: `Saldo negativo! Você está R$ ${Math.abs(balance).toFixed(2)} no vermelho.`,
          icon: TrendingUp
        })
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
  
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {notifications.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {notifications.length}
          </motion.span>
        )}
      </motion.button>
      
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma notificação
                </p>
              ) : (
                notifications.map((notif) => {
                  const Icon = notif.icon
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${
                        notif.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                        notif.type === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                        'bg-blue-100 dark:bg-blue-900/20'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          notif.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          notif.type === 'success' ? 'text-green-600 dark:text-green-400' :
                          'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {notif.message}
                      </p>
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
