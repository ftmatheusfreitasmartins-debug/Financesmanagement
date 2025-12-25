'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Sparkles, Tag, Users, Globe, Calendar as CalendarIcon, Image, Upload, Trash2 } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES, type Category } from '@/types/finance'
import { suggestCategory } from '@/utils/autoCategory'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TransactionFormProps {
  editingTransaction?: {
    id: string
    description: string
    amount: number
    category: string
    type: 'income' | 'expense'
    date: Date
    tags?: string[]
    currency?: 'BRL' | 'USD' | 'EUR'
    split?: { total: number; people: number; sharedWith: string[] }
    receipt?: string
  } | null
  onClose?: () => void
}

export default function TransactionForm({ editingTransaction, onClose }: TransactionFormProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>(CATEGORIES[0])
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [date, setDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [autoSuggested, setAutoSuggested] = useState(false)

  // Advanced features
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSplit, setIsSplit] = useState(false)
  const [splitPeople, setSplitPeople] = useState('2')
  const [splitWith, setSplitWith] = useState('')
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL')
  const [receipt, setReceipt] = useState('')
  const [receiptPreview, setReceiptPreview] = useState('')

  const addTransaction = useFinanceStore(state => state.addTransaction)
  const updateTransaction = useFinanceStore(state => state.updateTransaction)
  const currencies = useFinanceStore(state => state.currencies)

  // Modo edição
  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description)
      setAmount(editingTransaction.amount.toString())
      setCategory(editingTransaction.category as Category)
      setType(editingTransaction.type)
      setDate(new Date(editingTransaction.date))
      setTags(editingTransaction.tags || [])
      setCurrency(editingTransaction.currency || 'BRL')
      setReceipt(editingTransaction.receipt || '')
      setReceiptPreview(editingTransaction.receipt || '')
      if (editingTransaction.split) {
        setIsSplit(true)
        setSplitPeople(editingTransaction.split.people.toString())
        setSplitWith(editingTransaction.split.sharedWith.join(', '))
      }
      setIsOpen(true)
    }
  }, [editingTransaction])

  // Auto-sugestão de categoria
  useEffect(() => {
    if (description.length > 3 && !editingTransaction) {
      const suggested = suggestCategory(description)
      if (suggested !== 'Outros') {
        setCategory(suggested as Category)
        setAutoSuggested(true)
        setTimeout(() => setAutoSuggested(false), 2000)
      }
    }
  }, [description, editingTransaction])

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  // Upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limita tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande! Máximo 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setReceipt(base64)
      setReceiptPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const removeReceipt = () => {
    setReceipt('')
    setReceiptPreview('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount) return

    const finalAmount = parseFloat(amount)
    const splitAmount = isSplit ? finalAmount / parseInt(splitPeople) : finalAmount

    const transactionData = {
      description,
      amount: splitAmount,
      category,
      type,
      date,
      tags: tags.length > 0 ? tags : undefined,
      split: isSplit ? {
        total: finalAmount,
        people: parseInt(splitPeople),
        sharedWith: splitWith.split(',').map(s => s.trim()).filter(Boolean)
      } : undefined,
      currency,
      receipt: receipt || undefined,
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData)
      onClose?.()
    } else {
      addTransaction(transactionData)
    }

    // Reset
    resetForm()
    setIsOpen(false)
  }

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setCategory(CATEGORIES[0])
    setType('expense')
    setDate(new Date())
    setAutoSuggested(false)
    setTags([])
    setIsSplit(false)
    setSplitPeople('2')
    setSplitWith('')
    setCurrency('BRL')
    setReceipt('')
    setReceiptPreview('')
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForm()
    onClose?.()
  }

  // Calendário personalizado
  const renderCalendar = () => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDayOfWeek = monthStart.getDay()

    return (
      <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 z-50 border border-gray-200 dark:border-gray-700">
        {/* Header do calendário */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ←
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
            {format(date, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button
            type="button"
            onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Dias do mês */}
          {days.map((day) => {
            const isSelected = isSameDay(day, date)
            const isTodayDate = isToday(day)
            const isFuture = day > new Date()

            return (
              <motion.button
                key={day.toISOString()}
                type="button"
                whileHover={{ scale: isFuture ? 1 : 1.1 }}
                whileTap={{ scale: isFuture ? 1 : 0.95 }}
                onClick={() => {
                  setDate(day)
                  setShowCalendar(false)
                }}
                disabled={isFuture}
                className={`
                  aspect-square p-2 text-sm rounded-lg transition-all
                  ${isSelected
                    ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white font-bold shadow-lg scale-110'
                    : isTodayDate
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : isFuture
                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {format(day, 'd')}
              </motion.button>
            )
          })}
        </div>

        {/* Botões rápidos */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              setDate(new Date())
              setShowCalendar(false)
            }}
            className="flex-1 py-2 px-3 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setShowCalendar(false)}
            className="flex-1 py-2 px-3 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Botão flutuante (apenas se não estiver editando) */}
      {!editingTransaction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-accent-400 to-accent-500 text-white p-4 rounded-full shadow-2xl hover:shadow-accent-400/50 transition-shadow z-50"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Modal Container - CENTRALIZADO */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-accent-500 to-accent-600 p-6 rounded-t-2xl flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-white">
                    {editingTransaction ? '✏️ Editar Transação' : '➕ Nova Transação'}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Tipo: Despesa / Receita */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={`py-3 px-4 rounded-xl font-semibold transition-all ${
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
                      className={`py-3 px-4 rounded-xl font-semibold transition-all ${
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
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💱 Equivalente: R$ {(parseFloat(amount) * currencies[currency]).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Categoria e Data */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Categoria
                        {autoSuggested && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            <Sparkles className="w-3 h-3 inline" /> Sugerida!
                          </span>
                        )}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Data
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex items-center justify-between hover:border-accent-400 transition-all"
                      >
                        <span>{format(date, 'dd/MM/yyyy')}</span>
                        <CalendarIcon className="w-5 h-5" />
                      </button>
                      {showCalendar && renderCalendar()}
                    </div>
                  </div>

                  {/* Upload de Comprovante */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Comprovante (opcional)
                    </label>
                    {!receiptPreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-accent-400 transition-colors bg-gray-50 dark:bg-gray-700/50">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Clique para enviar imagem</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG até 2MB</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    ) : (
                      <div className="relative">
                        <img src={receiptPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={removeReceipt}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      🏷️ Tags (opcional)
                    </label>
                    <div className="flex gap-2">
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
                        className="px-4 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-colors"
                      >
                        <Tag className="w-5 h-5" />
                      </button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-lg text-sm flex items-center gap-2">
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
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <Users className="w-4 h-4 inline mr-1" />
                        Dividir despesa
                      </span>
                    </label>
                    {isSplit && (
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <input
                          type="number"
                          min="2"
                          value={splitPeople}
                          onChange={(e) => setSplitPeople(e.target.value)}
                          placeholder="Nº pessoas"
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        {amount && splitPeople && (
                          <div className="col-span-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                            💰 R$ {(parseFloat(amount) / parseInt(splitPeople)).toFixed(2)}/pessoa
                          </div>
                        )}
                        <input
                          type="text"
                          value={splitWith}
                          onChange={(e) => setSplitWith(e.target.value)}
                          placeholder="Dividido com (ex: João, Maria)"
                          className="col-span-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Botão Submit */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl text-lg"
                  >
                    {editingTransaction ? '💾 Salvar Alterações' : '✅ Adicionar Transação'}
                  </button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
