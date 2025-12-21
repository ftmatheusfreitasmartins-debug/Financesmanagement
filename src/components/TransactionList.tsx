'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { format, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFinanceStore } from '@/store/financeStore'
import { Transaction } from '@/types/finance'

interface FilterOptions {
  startDate: string
  endDate: string
  type: 'all' | 'income' | 'expense'
  category: string
  minAmount: string
  maxAmount: string
  searchTerm: string
}

interface TransactionListProps {
  filters?: FilterOptions
}

export default function TransactionList({ filters }: TransactionListProps) {
  const transactions = useFinanceStore(state => state.transactions)
  const removeTransaction = useFinanceStore(state => state.removeTransaction)
  
  // Aplicar filtros
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]
    
    if (filters) {
      // Filtro de busca
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        result = result.filter(t => 
          t.description.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term)
        )
      }
      
      // Filtro de tipo
      if (filters.type !== 'all') {
        result = result.filter(t => t.type === filters.type)
      }
      
      // Filtro de categoria
      if (filters.category !== 'all') {
        result = result.filter(t => t.category === filters.category)
      }
      
      // Filtro de data
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate)
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        
        result = result.filter(t => 
          isWithinInterval(new Date(t.date), { start, end })
        )
      }
      
      // Filtro de valor
      if (filters.minAmount) {
        result = result.filter(t => t.amount >= parseFloat(filters.minAmount))
      }
      if (filters.maxAmount) {
        result = result.filter(t => t.amount <= parseFloat(filters.maxAmount))
      }
    }
    
    // Ordenar por data (mais recente primeiro)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, filters])
  
  // Calcular totais dos filtrados
  const filteredIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const filteredExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  if (filteredTransactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Transações Recentes</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          {transactions.length === 0 
            ? 'Nenhuma transação registrada. Clique no botão + para adicionar.'
            : 'Nenhuma transação encontrada com esses filtros.'
          }
        </p>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transações Recentes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredTransactions.length} transação(ões) encontrada(s)
          </p>
        </div>
        
        {/* Summary */}
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Receitas</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              R$ {filteredIncome.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Despesas</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              R$ {filteredExpenses.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {filteredTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'income' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{transaction.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(transaction.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                      {transaction.category}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.type === 'income' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeTransaction(transaction.id)}
                className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
