'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Settings,
  BarChart3,
  Zap,
  Calculator,
  Receipt,
  LogOut,
} from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { useAuth } from '@/components/AuthScreen'
import AuthScreen from '@/components/AuthScreen'
import CloudSync from "@/components/CloudSync";
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
import AdvancedFilters from '@/components/AdvancedFilters'
import QuickSummary from '@/components/QuickSummary'
import SmartAlerts from '@/components/SmartAlerts'
import RecurringManager from '@/components/RecurringManager'
import RecurringCalendar from '@/components/RecurringCalendar'
import SpendingPatterns from '@/components/SpendingPatterns'
import TagsManager from '@/components/TagsManager'
import SplitExpense from '@/components/SplitExpense'
import CurrencyConverter from '@/components/CurrencyConverter'
import SavingsTracker from '@/components/SavingsTracker'
import { format } from 'date-fns'

interface NetlifyUser {
  email: string
  user_metadata: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
  app_metadata: {
    roles?: string[]
  }
}

declare global {
  interface Window {
    netlifyIdentity: {
      currentUser(): NetlifyUser | null
      on(event: string, callback: (user: NetlifyUser | null) => void): void
      open(tab?: 'signup' | 'login'): void
      close(): void
    }
  }
}

export default function Home() {
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth()

  const [salaryInput, setSalaryInput] = useState('')
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [currentView, setCurrentView] = useState<
    'overview' | 'transactions' | 'analytics' | 'management' | 'tools'
  >('overview')
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all' as 'all' | 'income' | 'expense',
    category: 'all',
    minAmount: '',
    maxAmount: '',
    searchTerm: '',
  })

  const salary = useFinanceStore((state) => state.salary)
  const setSalary = useFinanceStore((state) => state.setSalary)
  const getBalance = useFinanceStore((state) => state.getBalance)
  const getTotalIncome = useFinanceStore((state) => state.getTotalIncome)
  const getTotalExpenses = useFinanceStore((state) => state.getTotalExpenses)
  const refreshCurrencyRates = useFinanceStore((state) => state.refreshCurrencyRates)

  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState('Usuário')
  const [userRole, setUserRole] = useState('Membro')

  useEffect(() => {
    setMounted(true)

    let interval: number | undefined

    const updateUserData = async () => {
      if (typeof window === 'undefined' || !window.netlifyIdentity) return

      const current = window.netlifyIdentity.currentUser() as any
      if (!current) return

      // ✅ IMPORTANTE: força buscar metadata nova (nome) sem deslogar/logar
      try {
        if (typeof current.reload === 'function') {
          await current.reload()
        } else if (typeof current.jwt === 'function') {
          await current.jwt(true)
        }
      } catch {
        // ignore
      }

      const fresh = (window.netlifyIdentity.currentUser() as any) || current

      const name =
        fresh.user_metadata?.full_name ||
        fresh.user_metadata?.name ||
        (typeof fresh.email === 'string' ? fresh.email.split('@')[0] : '') ||
        'Usuário'

      setUserName(name)

      const roles = fresh.app_metadata?.roles || []
      setUserRole(roles.length > 0 ? roles[0] : 'Membro')
    }

    void updateUserData()

    if (typeof window !== 'undefined' && window.netlifyIdentity) {
      window.netlifyIdentity.on('login', () => void updateUserData())
      window.netlifyIdentity.on('init', () => void updateUserData())

      interval = window.setInterval(() => {
        void updateUserData()
      }, 2000)
    }
    
    return () => {
      if (interval) window.clearInterval(interval)
    }
  }, [salary, isAuthenticated])


  // Atualização automática de câmbio (global)
  useEffect(() => {
    const run = () => {
      // evita request em background
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      refreshCurrencyRates()
    }

    run()

    // 10 min + jitter pra evitar bater exatamente no mesmo segundo
    const jitter = Math.floor(Math.random() * 15_000)
    const id = window.setInterval(run, 10 * 60 * 1000 + jitter)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshCurrencyRates])

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  const balance = getBalance()
  const totalIncome = getTotalIncome()
  const totalExpenses = getTotalExpenses()

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(salaryInput)
    if (value > 0) {
      setSalary(value)
      setShowSalaryModal(false)
      setSalaryInput('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 bg-gradient-to-br from-accent-400 to-accent-500 p-2 sm:p-2.5 rounded-xl shadow-lg">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Finance Manager
                </h1>
                <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 truncate">
                  Controle financeiro inteligente
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              <Notifications />
              <DarkModeToggle />
              <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-gray-600"></div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      {userRole}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSalaryModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-2.5 sm:px-3.5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium"
                  title="Configurar Salário"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Salário</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-2.5 sm:px-3.5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium"
                  title="Sair da conta"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden sm:inline">Sair</span>
                </motion.button>
              </div>
            </div>
          </div>
<>
  <CloudSync />
</>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('overview')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                currentView === 'overview'
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('transactions')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                currentView === 'transactions'
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Transações</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                currentView === 'analytics'
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Análises</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('management')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                currentView === 'management'
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Gestão</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('tools')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                currentView === 'tools'
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Ferramentas</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8">
        <SmartAlerts />
        {currentView === 'overview' && <QuickSummary />}

        {currentView === 'overview' && (
          <>
            <div className="mb-8">
              <SavingsTracker />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Saldo Disponível"
                value={`R$ ${balance.toFixed(2)}`}
                icon={Wallet}
                color="blue"
                delay={0}
              />
              <StatCard
                title="Receitas"
                value={`R$ ${totalIncome.toFixed(2)}`}
                icon={TrendingUp}
                color="green"
                delay={0.1}
              />
              <StatCard
                title="Despesas"
                value={`R$ ${totalExpenses.toFixed(2)}`}
                icon={TrendingDown}
                color="red"
                delay={0.2}
              />
              <StatCard
                title="Salário Mensal"
                value={`R$ ${salary.toFixed(2)}`}
                icon={DollarSign}
                color="yellow"
                delay={0.3}
              />
            </div>

            <div className="mb-8">
              <MonthlyChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ExpenseChart />
              <div>
                <AdvancedFilters onFilterChange={setFilters} />
                <TransactionList />
              </div>
            </div>
          </>
        )}

        {currentView === 'transactions' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-accent-500" />
                Gerenciamento de Transações
              </h2>
            </div>

            <div className="mb-8">
              <RecurringCalendar />
            </div>

            <div className="mb-8">
              <RecurringManager />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Histórico Completo
              </h3>
              <AdvancedFilters onFilterChange={setFilters} />
              <TransactionList />
            </div>
          </div>
        )}

        {currentView === 'analytics' && (
          <>
            <div className="mb-8">
              <MonthlyComparison />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SpendingPatterns />
              <SpendingHeatmap />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpenseChart />
              <MonthlyChart />
            </div>
          </>
        )}

        {currentView === 'management' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <GoalsManager />
              <BudgetTracker />
            </div>

            <div className="mb-8">
              <TagsManager />
            </div>

            <ExportImport />
          </>
        )}

        {currentView === 'tools' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <CurrencyConverter />
              <SplitExpense />
            </div>

            <div className="mb-8">
              <SpendingPatterns />
            </div>
          </>
        )}
      </main>

      {showSalaryModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={() => salary > 0 && setShowSalaryModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {salary === 0 ? 'Bem-vindo!' : 'Atualizar Salário'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {salary === 0
                ? 'Para começar a usar o Finance Manager Pro, informe seu salário mensal.'
                : 'Atualize seu salário mensal para recálculos automáticos.'}
            </p>

            <form onSubmit={handleSalarySubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salário Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0,00"
                  required
                  autoFocus
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-accent-400 to-accent-500 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                {salary === 0 ? 'Começar Agora' : 'Atualizar'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}

      <TransactionForm />

<footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 mt-16">
  <div className="container mx-auto px-6 py-8">
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left */}
      <div className="text-center md:text-left">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
          Finance Manager
          <span className="text-gray-500 dark:text-gray-400 font-medium"> • © {new Date().getFullYear()}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Seus dados ficam salvos em nosso servidor com criptografia.
        </p>
      </div>

      {/* Right */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs px-3 py-1 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
          Total privacidade
        </span>

        <span className="text-xs px-3 py-1 rounded-full font-semibold border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300">
          Servidor seguro
        </span>

        <span className="text-xs px-3 py-1 rounded-full font-semibold border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">
          Recursos avançados
        </span>
      </div>
    </div>
  </div>
</footer>

    </div>
  )
}
