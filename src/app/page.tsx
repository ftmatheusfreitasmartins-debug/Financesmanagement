'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, TrendingDown, DollarSign, Settings, BarChart3, Calculator, Receipt, LogOut, User } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import AuthScreen, { useAuth } from '@/components/AuthScreen'
import StatCard from '@/components/StatCard'
import TransactionForm from '@/components/TransactionForm'
import TransactionList from '@/components/TransactionList'
import ExpenseChart from '@/components/ExpenseChart'
import MonthlyChart from '@/components/MonthlyChart'
import MonthlyComparison from '@/components/MonthlyComparison'
import SpendingHeatmap from '@/components/SpendingHeatmap'
import GoalsManager from '@/components/GoalsManager'
import BudgetTracker from '@/components/BudgetTracker'
import ExportImport from '@/components/ExportImport'
import DarkModeToggle from '@/components/DarkModeToggle'
import Notifications from '@/components/Notifications'
import QuickSummary from '@/components/QuickSummary'
import SmartAlerts from '@/components/SmartAlerts'
import RecurringManager from '@/components/RecurringManager'
import RecurringCalendar from '@/components/RecurringCalendar'
import FinancialProjection from '@/components/FinancialProjection'
import SpendingPatterns from '@/components/SpendingPatterns'
import TagsManager from '@/components/TagsManager'
import SplitExpense from '@/components/SplitExpense'
import CurrencyConverter from '@/components/CurrencyConverter'
import SavingsTracker from '@/components/SavingsTracker'

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth()
  
  const [salaryInput, setSalaryInput] = useState('')
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [currentView, setCurrentView] = useState<'overview' | 'transactions' | 'analytics' | 'management' | 'tools'>('overview')

  const salary = useFinanceStore(state => state.salary)
  const setSalary = useFinanceStore(state => state.setSalary)
  const getBalance = useFinanceStore(state => state.getBalance)
  const getTotalIncome = useFinanceStore(state => state.getTotalIncome)
  const getTotalExpenses = useFinanceStore(state => state.getTotalExpenses)
  const processRecurringTransactions = useFinanceStore(state => state.processRecurringTransactions)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (salary === 0) {
      setShowSalaryModal(true)
    }
    processRecurringTransactions()
  }, [salary, processRecurringTransactions])

  if (!mounted) return null

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(salaryInput)
    if (value > 0) {
      setSalary(value)
      setShowSalaryModal(false)
      setSalaryInput('')
    }
  }

  const balance = getBalance()
  const totalIncome = getTotalIncome()
  const totalExpenses = getTotalExpenses()

  const views = {
    overview: {
      icon: Wallet,
      label: 'Visão Geral',
      color: 'from-blue-500 to-blue-600'
    },
    transactions: {
      icon: Receipt,
      label: 'Transações',
      color: 'from-purple-500 to-purple-600'
    },
    analytics: {
      icon: BarChart3,
      label: 'Análises',
      color: 'from-green-500 to-green-600'
    },
    management: {
      icon: Settings,
      label: 'Gestão',
      color: 'from-orange-500 to-orange-600'
    },
    tools: {
      icon: Calculator,
      label: 'Ferramentas',
      color: 'from-pink-500 to-pink-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-accent-400 to-accent-500 rounded-2xl shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Finance Manager Pro
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sistema completo de gestão financeira
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 rounded-xl border border-accent-200 dark:border-accent-700">
                <div className="p-2 bg-accent-500 rounded-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Bem-vindo(a)</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.user_metadata?.full_name || user?.email || 'Usuário'}
                  </p>
                </div>
              </div>

              <DarkModeToggle />
              <Notifications />

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/50 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {(Object.keys(views) as Array<keyof typeof views>).map((view) => {
              const ViewIcon = views[view].icon
              return (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    currentView === view
                      ? `bg-gradient-to-r ${views[view].color} text-white shadow-lg`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <ViewIcon className="w-5 h-5" />
                  {views[view].label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSalaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Configure seu Salário
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Informe seu salário mensal para começar.
                </p>
              </div>

              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Salário Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold"
                    placeholder="0,00"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex gap-3">
                  {salary > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSalaryModal(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Saldo Disponível" value={`R$ ${balance.toFixed(2)}`} icon={Wallet} color={balance >= 0 ? 'green' : 'red'} delay={0} />
          <StatCard title="Receitas" value={`R$ ${totalIncome.toFixed(2)}`} icon={TrendingUp} color="blue" delay={0.1} />
          <StatCard title="Despesas" value={`R$ ${totalExpenses.toFixed(2)}`} icon={TrendingDown} color="red" delay={0.2} />
          <StatCard title="Salário" value={`R$ ${salary.toFixed(2)}`} icon={DollarSign} color="yellow" delay={0.3} />
        </div>

        <SmartAlerts />

        <div className="space-y-8">
          {currentView === 'overview' && (
            <>
              <QuickSummary />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ExpenseChart />
                <MonthlyChart />
              </div>
              <TransactionList />
            </>
          )}

          {currentView === 'transactions' && (
            <>
              <TransactionList />
              <RecurringManager />
              <RecurringCalendar />
            </>
          )}

          {currentView === 'analytics' && (
            <>
              <FinancialProjection />
              <MonthlyComparison />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SpendingHeatmap />
                <SpendingPatterns />
              </div>
              <ExpenseChart />
            </>
          )}

          {currentView === 'management' && (
            <>
              <GoalsManager />
              <BudgetTracker />
              <SavingsTracker />
              <TagsManager />
            </>
          )}

          {currentView === 'tools' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CurrencyConverter />
                <SplitExpense />
              </div>
              <ExportImport />
            </>
          )}
        </div>
      </main>

      <TransactionForm />
    </div>
  )
}
