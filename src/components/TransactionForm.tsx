'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Upload, Trash2, Calendar as CalendarIcon, Tag, Users } from 'lucide-react'

import { useFinanceStore } from '@/store/financeStore'
import { CATEGORIES, type Category } from '@/types/finance'
import { suggestCategory } from '@/utils/autoCategory'
import {
  sanitizeString,
  validateNumber,
  validateTags,
  validateImageMIME,
  validateImageSize,
  validateCurrency,
} from '@/utils/security'

type TxType = 'income' | 'expense'

interface TransactionFormProps {
  editingTransaction?: {
    id: string
    description: string
    amount: number
    category: string
    type: TxType
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

  const [type, setType] = useState<TxType>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>(CATEGORIES[0])
  const [date, setDate] = useState(() => new Date())

  const [autoSuggested, setAutoSuggested] = useState(false)

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL')

  const [isSplit, setIsSplit] = useState(false)
  const [splitPeople, setSplitPeople] = useState('2')
  const [splitWith, setSplitWith] = useState('')

  const [receipt, setReceipt] = useState('')
  const [receiptPreview, setReceiptPreview] = useState('')

  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const updateTransaction = useFinanceStore((s) => s.updateTransaction)
  const currencies = useFinanceStore((s) => s.currencies)

  // Edit mode
  useEffect(() => {
    if (!editingTransaction) return

    setType(editingTransaction.type)
    setDescription(editingTransaction.description ?? '')
    setAmount(String(editingTransaction.amount ?? ''))
    setCategory((editingTransaction.category as Category) ?? CATEGORIES[0])
    setDate(new Date(editingTransaction.date))
    setTags(editingTransaction.tags ?? [])
    setCurrency(editingTransaction.currency ?? 'BRL')
    setReceipt(editingTransaction.receipt ?? '')
    setReceiptPreview(editingTransaction.receipt ?? '')

    if (editingTransaction.split) {
      setIsSplit(true)
      setSplitPeople(String(editingTransaction.split.people ?? 2))
      setSplitWith((editingTransaction.split.sharedWith ?? []).join(', '))
    } else {
      setIsSplit(false)
      setSplitPeople('2')
      setSplitWith('')
    }

    setIsOpen(true)
  }, [editingTransaction])

  // Auto-sugestão de categoria
  useEffect(() => {
    if (editingTransaction) return
    const clean = sanitizeString(description, 200)
    if (clean.length <= 3) return

    const suggested = suggestCategory(clean)
    if (suggested && suggested !== 'Outros') {
      setCategory(suggested as Category)
      setAutoSuggested(true)
      const t = setTimeout(() => setAutoSuggested(false), 1800)
      return () => clearTimeout(t)
    }
  }, [description, editingTransaction])

  const dateValue = useMemo(() => {
    // yyyy-mm-dd para input date
    const d = date
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [date])

  const handleAddTag = () => {
    const clean = sanitizeString(tagInput, 50)
    if (!clean) return
    const next = validateTags([...(tags ?? []), clean])
    setTags(next)
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // pré-check rápido (antes do base64)
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande! Máximo 2MB.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = String(reader.result ?? '')

      if (!validateImageMIME(base64)) {
        alert('Formato inválido. Use PNG, JPG ou WEBP.')
        e.target.value = ''
        return
      }
      if (!validateImageSize(base64, 2)) {
        alert('Imagem muito grande! Máximo 2MB.')
        e.target.value = ''
        return
      }

      setReceipt(base64)
      setReceiptPreview(base64)
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const removeReceipt = () => {
    setReceipt('')
    setReceiptPreview('')
  }

  const resetForm = () => {
    setType('expense')
    setDescription('')
    setAmount('')
    setCategory(CATEGORIES[0])
    setDate(new Date())
    setAutoSuggested(false)
    setTags([])
    setTagInput('')
    setCurrency('BRL')
    setIsSplit(false)
    setSplitPeople('2')
    setSplitWith('')
    setReceipt('')
    setReceiptPreview('')
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForm()
    onClose?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const cleanDesc = sanitizeString(description, 200)
    const cleanCat = sanitizeString(category, 50) as Category
    const amt = validateNumber(amount, 0, 999999999)
    const people = Math.max(1, Math.floor(validateNumber(splitPeople, 1, 100)))
    const cur = validateCurrency(currency)

    if (!cleanDesc || !Number.isFinite(amt) || amt <= 0) return

    const finalAmount = amt
    const splitAmount = isSplit ? finalAmount / people : finalAmount

    const sharedWith = isSplit
      ? splitWith
          .split(',')
          .map((s) => sanitizeString(s, 100))
          .filter(Boolean)
          .slice(0, 100)
      : undefined

    const payload: any = {
      description: cleanDesc,
      amount: splitAmount,
      category: cleanCat,
      type,
      date,
      tags: tags.length ? validateTags(tags) : undefined,
      currency: cur,
      split: isSplit
        ? {
            total: finalAmount,
            people,
            sharedWith: sharedWith ?? [],
          }
        : undefined,
      receipt: receipt || undefined,
    }

    if (editingTransaction?.id) {
      updateTransaction(editingTransaction.id, payload)
      onClose?.()
    } else {
      addTransaction(payload)
    }

    setIsOpen(false)
    resetForm()
  }

  const convertedBRL =
    currency !== 'BRL' && amount
      ? (validateNumber(amount, 0, 999999999) * validateNumber((currencies as any)[currency], 0.01, 1000)).toFixed(2)
      : null

  return (
    <>
      {!editingTransaction && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-accent-400 to-accent-500 text-white p-4 rounded-full shadow-2xl hover:shadow-accent-400/50 transition-shadow z-50"
          aria-label="Adicionar transação"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={handleClose}
            />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={handleClose}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingTransaction ? 'Editar transação' : 'Nova transação'}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Tipo */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                        type === 'expense'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Despesa
                    </button>

                    <button
                      type="button"
                      onClick={() => setType('income')}
                      className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                        type === 'income'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: Uber, iFood, Mercado..."
                      required
                    />
                  </div>

                  {/* Valor / Moeda */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Valor
                      </label>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="BRL">BRL (R$)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>

                    {convertedBRL && (
                      <p className="sm:col-span-3 text-sm text-gray-600 dark:text-gray-300">
                        Equivalente: <span className="font-semibold">R$ {convertedBRL}</span>
                      </p>
                    )}
                  </div>

                  {/* Categoria / Data */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Categoria {autoSuggested ? <span className="text-accent-600">• sugerida</span> : null}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <CalendarIcon className="w-4 h-4" />
                        Data
                      </label>
                      <input
                        type="date"
                        value={dateValue}
                        onChange={(e) => setDate(new Date(e.target.value + 'T00:00:00'))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Comprovante */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Comprovante (opcional)
                    </label>

                    {!receiptPreview ? (
                      <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-accent-400 transition-colors bg-gray-50 dark:bg-gray-700/30">
                        <Upload className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Enviar imagem (PNG/JPG/WEBP até 2MB)
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    ) : (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4">
                        <img src={receiptPreview} alt="Comprovante" className="w-full max-h-64 object-contain rounded-xl" />
                        <button
                          type="button"
                          onClick={removeReceipt}
                          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover comprovante
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Tag className="w-4 h-4" />
                      Tags (opcional)
                    </label>

                    <div className="flex gap-2">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag()
                          }
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Ex: urgente, parcelado..."
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2.5 rounded-xl bg-accent-500 text-white font-semibold hover:bg-accent-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="px-3 py-1.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-200 text-xs font-semibold hover:bg-accent-200 dark:hover:bg-accent-900/50 transition-colors"
                            title="Remover tag"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Split */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                      <Users className="w-4 h-4" />
                      <input
                        type="checkbox"
                        checked={isSplit}
                        onChange={(e) => setIsSplit(e.target.checked)}
                        className="w-4 h-4 text-accent-500 rounded focus:ring-accent-400"
                      />
                      Dividir despesa
                    </label>

                    {isSplit && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          value={splitPeople}
                          onChange={(e) => setSplitPeople(e.target.value)}
                          type="number"
                          min={1}
                          className="sm:col-span-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="Pessoas"
                        />
                        <input
                          value={splitWith}
                          onChange={(e) => setSplitWith(e.target.value)}
                          className="sm:col-span-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="Dividido com (ex: João, Maria)"
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    {editingTransaction ? 'Salvar alterações' : 'Adicionar transação'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
