'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Sparkles, Tag, Users, Globe, Calendar } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES } from '@/types/finance'
import { suggestCategory } from '@/utils/autoCategory'
import { format } from 'date-fns'

export default function TransactionForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [autoSuggested, setAutoSuggested] = useState(false)
  
  // Advanced features
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSplit, setIsSplit] = useState(false)
  const [splitPeople, setSplitPeople] = useState('2')
  const [splitWith, setSplitWith] = useState('')
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL')
  
  const addTransaction = useFinanceStore(state => state.addTransaction)
  const currencies = useFinanceStore(state => state.currencies)
  
  // Auto-sugestão de categoria
  useEffect(() => {
    if (description.length > 3) {
      const suggested = suggestCategory(description)
      if (suggested !== 'Outros') {
        setCategory(suggested)
        setAutoSuggested(true)
        setTimeout(() => setAutoSuggested(false), 2000)
      }
    }
  }, [description])
  
  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description || !amount) return
    
    const finalAmount = parseFloat(amount)
    const splitAmount = isSplit ? finalAmount / parseInt(splitPeople) : finalAmount
    
    addTransaction({
      description,
      amount: splitAmount,
      category,
      type,
      date: new Date(date),
      tags: tags.length > 0 ? tags : undefined,
      split: isSplit ? {
        total: finalAmount,
        people: parseInt(splitPeople),
        sharedWith: splitWith.split(',').map(s => s.trim()).filter(Boolean)
      } : undefined,
      currency,
    })
    
    // Reset
    setDescription('')
    setAmount('')
    setCategory(CATEGORIES[0])
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setAutoSuggested(false)
    setTags([])
    setIsSplit(false)
    setSplitPeople('2')
    setSplitWith('')
    setCurrency('BRL')
    setIsOpen(false)
  }
  
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-accent-400 to-accent-500 text-white p-4 rounded-full shadow-2xl hover:shadow-accent-400/50 transition-shadow z-50"
      >
        <Plus className="w-8 h-8" />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Transação</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Tipo: Despesa / Receita */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                        type === 'expense'
                          ? 'bg-red-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('income')}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                        type === 'income'
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Receita
                    </button>
                  </div>
                  
                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: Uber, iFood, Mercado..."
                      required
                    />
                  </div>
                  
                  {/* Valor e Moeda */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="0,00"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Moeda
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as any)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="BRL">🇧🇷 BRL (R$)</option>
                        <option value="USD">🇺🇸 USD ($)</option>
                        <option value="EUR">🇪🇺 EUR (€)</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Conversão de moeda */}
                  {currency !== 'BRL' && amount && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                      <p className="text-sm text-blue-900 dark:text-blue-300">
                        💱 Equivalente: <strong>R$ {(parseFloat(amount) * currencies[currency]).toFixed(2)}</strong>
                      </p>
                    </div>
                  )}
                  
                  {/* Categoria e Data */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        Categoria
                        <AnimatePresence>
                          {autoSuggested && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-1 text-xs text-accent-500 dark:text-accent-400"
                            >
                              <Sparkles className="w-3 h-3" />
                              Sugerida!
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Data
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags (opcional)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="Ex: urgente, parcelado..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Split Expense */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSplit}
                        onChange={(e) => setIsSplit(e.target.checked)}
                        className="w-4 h-4 text-accent-500 rounded focus:ring-accent-400"
                      />
                      <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dividir despesa
                      </span>
                    </label>
                    
                    <AnimatePresence>
                      {isSplit && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-3 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              min="2"
                              value={splitPeople}
                              onChange={(e) => setSplitPeople(e.target.value)}
                              placeholder="Nº pessoas"
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            {amount && splitPeople && (
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2 flex items-center justify-center">
                                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                  R$ {(parseFloat(amount) / parseInt(splitPeople)).toFixed(2)}/pessoa
                                </p>
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={splitWith}
                            onChange={(e) => setSplitWith(e.target.value)}
                            placeholder="Dividido com (ex: João, Maria)"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-accent-400 to-accent-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Adicionar Transação
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
