'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Tag,
  X,
} from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { validateDate } from '@/utils/security'
import TransactionForm from './TransactionForm'

export default function TransactionList() {
  const transactions = useFinanceStore((state) => state.transactions)
  const removeTransaction = useFinanceStore((state) => state.removeTransaction)

  const [editingTransaction, setEditingTransaction] = useState<any | null>(null)
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction: any) => {
        const matchesSearch = String(transaction.description || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

        const matchesType = filterType === 'all' || transaction.type === filterType
        const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory

        return matchesSearch && matchesType && matchesCategory
      })
      .sort((a: any, b: any) => validateDate(b.date).getTime() - validateDate(a.date).getTime())
  }, [transactions, searchTerm, filterType, filterCategory])

  const totalIncome = filteredTransactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

  const totalExpenses = filteredTransactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(transactions.map((t: any) => t.category))).sort()
  }, [transactions])

  const handleEdit = (transaction: any) => setEditingTransaction(transaction)

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setFilterCategory('all')
  }

  const hasActiveFilters =
    searchTerm.length > 0 || filterType !== 'all' || filterCategory !== 'all'

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transações Recentes</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTransactions.length} de {transactions.length} transações
        </span>
      </div>

      {/* Filtros */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent-400 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent-400 outline-none"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Apenas receitas</option>
            <option value="expense">Apenas despesas</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent-400 outline-none"
          >
            <option value="all">Todas as categorias</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            type="button"
          >
            <X className="w-4 h-4" />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400 mb-1">Receitas</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            R$ {totalIncome.toFixed(2)}
          </p>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400 mb-1">Despesas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            R$ {totalExpenses.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence>
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {transactions.length === 0
                ? 'Nenhuma transação registrada. Clique no botão + para adicionar.'
                : 'Nenhuma transação encontrada com esses filtros.'}
            </p>
          ) : (
            filteredTransactions.map((transaction: any) => {
              const dt = validateDate(transaction.date)

              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {transaction.description}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          {format(dt, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                          {transaction.category}
                        </span>
                      </div>

                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {transaction.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 rounded text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {transaction.receipt && (
                        <button
                          onClick={() => setViewingReceipt(transaction.receipt)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          type="button"
                        >
                          <ImageIcon className="w-3 h-3" />
                          Ver comprovante
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p
                        className={`text-lg font-bold ${
                          transaction.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'} R$ {Number(transaction.amount || 0).toFixed(2)}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar"
                          type="button"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeTransaction(transaction.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Excluir"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Modal comprovante */}
      <AnimatePresence>
        {viewingReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingReceipt(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={viewingReceipt}
              alt="Comprovante"
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form de edição */}
      <AnimatePresence>
        {editingTransaction && (
          <TransactionForm
            editingTransaction={editingTransaction}
            onClose={() => setEditingTransaction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
