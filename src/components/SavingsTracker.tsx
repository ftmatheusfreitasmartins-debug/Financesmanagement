'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PiggyBank, Plus, Trash2, X, Calendar, Target } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SavingsTracker() {
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedGoal, setSelectedGoal] = useState('')
  
  const savedMoney = useFinanceStore(state => state.savedMoney)
  const addSavedMoney = useFinanceStore(state => state.addSavedMoney)
  const removeSavedMoney = useFinanceStore(state => state.removeSavedMoney)
  const getTotalSaved = useFinanceStore(state => state.getTotalSaved)
  const goals = useFinanceStore(state => state.goals)
  const getBalance = useFinanceStore(state => state.getBalance)
  
  const totalSaved = getTotalSaved()
  const balance = getBalance()
  const savingsRate = balance > 0 ? (totalSaved / balance) * 100 : 0
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description) return
    
    addSavedMoney({
      amount: parseFloat(amount),
      description,
      date: new Date(date),
      goal: selectedGoal || undefined
    })
    
    // Reset
    setAmount('')
    setDescription('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setSelectedGoal('')
    setShowModal(false)
  }
  
  // Agrupar por mês
  const savingsByMonth = savedMoney.reduce((acc, saving) => {
    const monthKey = format(new Date(saving.date), 'MMMM yyyy', { locale: ptBR })
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push(saving)
    return acc
  }, {} as Record<string, typeof savedMoney>)
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-lg p-8 border border-green-200 dark:border-green-800"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-3 rounded-xl">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dinheiro Guardado</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalSaved > 0 
                  ? `${savingsRate.toFixed(1)}% do seu saldo total`
                  : 'Comece a guardar dinheiro hoje!'}
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Guardar Dinheiro
          </motion.button>
        </div>
        
        {/* Total guardado */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Guardado</p>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                R$ {totalSaved.toFixed(2)}
              </p>
            </div>
            {totalSaved > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo Disponível</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {balance.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Histórico */}
        {totalSaved === 0 ? (
          <div className="text-center py-8">
            <PiggyBank className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Você ainda não guardou nenhum dinheiro
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Clique em "Guardar Dinheiro" para começar a economizar!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Histórico de Economia
            </h4>
            
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {Object.entries(savingsByMonth).reverse().map(([month, savings]) => (
                <div key={month} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase">
                    {month}
                  </p>
                  <div className="space-y-2">
                    {savings.map((saving) => (
                      <div
                        key={saving.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {saving.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(saving.date), 'dd/MM/yyyy')}
                            </p>
                            {saving.goal && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {saving.goal}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            R$ {saving.amount.toFixed(2)}
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeSavedMoney(saving.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Dica */}
        <div className="mt-6 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-3">
          <p className="text-sm text-green-900 dark:text-green-300">
            <strong>💡 Dica:</strong> Tente guardar pelo menos 20% da sua renda mensal para ter uma reserva de emergência!
          </p>
        </div>
      </motion.div>
      
      {/* Modal Guardar Dinheiro */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <PiggyBank className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Guardar Dinheiro</h2>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quanto você quer guardar?
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="R$ 0,00"
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição / Motivo
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: Reserva de emergência, Viagem..."
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Meta (opcional)
                      </label>
                      <select
                        value={selectedGoal}
                        onChange={(e) => setSelectedGoal(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Nenhuma</option>
                        {goals.map(goal => (
                          <option key={goal.id} value={goal.name}>{goal.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <p className="text-sm text-green-900 dark:text-green-300">
                      💰 Após guardar, você terá <strong>R$ {(totalSaved + parseFloat(amount || '0')).toFixed(2)}</strong> economizados!
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    >
                      💰 Guardar
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
