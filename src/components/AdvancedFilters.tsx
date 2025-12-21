'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, Calendar, DollarSign } from 'lucide-react'
import { CATEGORIES } from '@/types/finance'
import { format } from 'date-fns'

interface FilterOptions {
  startDate: string
  endDate: string
  type: 'all' | 'income' | 'expense'
  category: string
  minAmount: string
  maxAmount: string
  searchTerm: string
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
}

export default function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    type: 'all',
    category: 'all',
    minAmount: '',
    maxAmount: '',
    searchTerm: ''
  })
  
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  const clearFilters = () => {
    const emptyFilters: FilterOptions = {
      startDate: '',
      endDate: '',
      type: 'all',
      category: 'all',
      minAmount: '',
      maxAmount: '',
      searchTerm: ''
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }
  
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    value && value !== 'all' && value !== ''
  ).length
  
  return (
    <div className="mb-6">
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 Buscar transações (ex: uber, mercado, ifood)..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none transition-all"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative px-6 py-3 bg-gradient-to-r from-accent-400 to-accent-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Filter className="w-5 h-5" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </motion.button>
      </div>
      
      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtros Avançados</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
                  />
                </div>
                
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
                  >
                    <option value="all">Todos</option>
                    <option value="income">Receitas</option>
                    <option value="expense">Despesas</option>
                  </select>
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
                  >
                    <option value="all">Todas</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Valor Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Valor Máximo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    placeholder="R$ 999999,00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
                  />
                </div>
              </div>
              
              {/* Quick Filters */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtros Rápidos:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const today = format(new Date(), 'yyyy-MM-dd')
                      handleFilterChange('startDate', today)
                      handleFilterChange('endDate', today)
                    }}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date()
                      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                      handleFilterChange('startDate', format(weekAgo, 'yyyy-MM-dd'))
                      handleFilterChange('endDate', format(now, 'yyyy-MM-dd'))
                    }}
                    className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    Última Semana
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date()
                      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
                      handleFilterChange('startDate', format(monthAgo, 'yyyy-MM-dd'))
                      handleFilterChange('endDate', format(now, 'yyyy-MM-dd'))
                    }}
                    className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    Este Mês
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
