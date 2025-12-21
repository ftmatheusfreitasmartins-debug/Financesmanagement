'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, TrendingDown, DollarSign, Settings, BarChart3, Zap, Calculator } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
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
import FinancialProjection from '@/components/FinancialProjection'
import SpendingPatterns from '@/components/SpendingPatterns'
import TagsManager from '@/components/TagsManager'
import SplitExpense from '@/components/SplitExpense'
import CurrencyConverter from '@/components/CurrencyConverter'
import SavingsTracker from '@/components/SavingsTracker'

export default function Home() {
  const [salaryInput, setSalaryInput] = useState('')
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [currentView, setCurrentView] = useState<'overview' | 'analytics' | 'management' | 'tools'>('overview')
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all' as 'all' | 'income' | 'expense',
    category: 'all',
    minAmount: '',
    maxAmount: '',
    searchTerm: ''
  })
  
  const salary = useFinanceStore(state => state.salary)
  const setSalary = useFinanceStore(state => state.setSalary)
  const getBalance = useFinanceStore(state => state.getBalance)
  const getTotalIncome = useFinanceStore(state => state.getTotalIncome)
  const getTotalExpenses = useFinanceStore(state => state.getTotalExpenses)
  
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    if (salary === 0) {
      setShowSalaryModal(true)
    }
  }, [salary])
  
  if (!mounted) return null
  
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
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-accent-400 to-accent-500 p-2 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Manager Pro</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sistema completo de gestão financeira</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Notifications />
              <DarkModeToggle />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSalaryModal(true)}
                className="flex items-center gap-2 bg-primary-900 dark:bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Salário</span>
              </motion.button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setCurrentView('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                currentView === 'overview'
                  ? 'bg-accent-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Visão Geral
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                currentView === 'analytics'
                  ? 'bg-accent-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Análises
            </button>
            <button
              onClick={() => setCurrentView('management')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                currentView === 'management'
                  ? 'bg-accent-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Settings className="w-4 h-4" />
              Gestão
            </button>
            <button
              onClick={() => setCurrentView('tools')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                currentView === 'tools'
                  ? 'bg-accent-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Ferramentas
            </button>
          </div>
        </div>
      </motion.header>
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Smart Alerts */}
        <SmartAlerts />
        
        {/* Quick Summary */}
        {currentView === 'overview' && <QuickSummary />}
        
        {/* ===== VISÃO GERAL ===== */}
        {currentView === 'overview' && (
          <>
            {/* Stats Cards - 4 CARDS EM CIMA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Saldo Total"
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
            
            {/* Dinheiro Guardado - COMPONENTE COMPLETO EMBAIXO */}
            <div className="mb-8">
              <SavingsTracker />
            </div>
            
            {/* Monthly Trend */}
            <div className="mb-8">
              <MonthlyChart />
            </div>
            
            {/* Charts & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ExpenseChart />
              <div>
                <AdvancedFilters onFilterChange={setFilters} />
                <TransactionList filters={filters} />
              </div>
            </div>
          </>
        )}
        
        {/* ===== ANÁLISES ===== */}
        {currentView === 'analytics' && (
          <>
            <div className="mb-8">
              <FinancialProjection />
            </div>
            
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
        
        {/* ===== GESTÃO ===== */}
        {currentView === 'management' && (
          <>
            <div className="mb-8">
              <RecurringManager />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <GoalsManager />
              <BudgetTracker />
            </div>
            
            <div className="mb-8">
              <TagsManager />
            </div>
            
            <ExportImport />
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Gerenciar Transações
              </h2>
              <AdvancedFilters onFilterChange={setFilters} />
              <TransactionList filters={filters} />
            </div>
          </>
        )}
        
        {/* ===== FERRAMENTAS ===== */}
        {currentView === 'tools' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <CurrencyConverter />
              <SplitExpense />
            </div>
            
            <div className="mb-8">
              <FinancialProjection />
            </div>
            
            <div className="mb-8">
              <SpendingPatterns />
            </div>
          </>
        )}
      </main>
      
      {/* Salary Modal */}
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
              {salary === 0 ? 'Bem-vindo! 👋' : 'Atualizar Salário'}
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
                {salary === 0 ? '🚀 Começar Agora' : '✓ Atualizar'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
      
      {/* Transaction Form FAB */}
      <TransactionForm />
      
      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
              © 2025 Finance Manager Pro. Todos os dados salvos localmente no seu navegador.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                🔒 100% Privado
              </span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                ⚡ Tempo Real
              </span>
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Avançado
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
