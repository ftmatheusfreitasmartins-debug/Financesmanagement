'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Calculator, Copy, Check } from 'lucide-react'

export default function SplitExpense() {
  const [totalAmount, setTotalAmount] = useState('')
  const [numberOfPeople, setNumberOfPeople] = useState('2')
  const [sharedWith, setSharedWith] = useState('')
  const [copied, setCopied] = useState(false)
  
  const amountPerPerson = totalAmount ? parseFloat(totalAmount) / parseInt(numberOfPeople) : 0
  
  const handleCopy = () => {
    const text = `Divisão de despesa:\nTotal: R$ ${parseFloat(totalAmount).toFixed(2)}\nPessoas: ${numberOfPeople}\nValor por pessoa: R$ ${amountPerPerson.toFixed(2)}\n${sharedWith ? `Dividido com: ${sharedWith}` : ''}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-accent-400" />
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dividir Despesa</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Calcule quanto cada um paga</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valor Total (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0,00"
            className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número de Pessoas
          </label>
          <input
            type="number"
            min="1"
            value={numberOfPeople}
            onChange={(e) => setNumberOfPeople(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dividido com (opcional)
          </label>
          <input
            type="text"
            value={sharedWith}
            onChange={(e) => setSharedWith(e.target.value)}
            placeholder="Ex: João, Maria, Pedro"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
          />
        </div>
        
        {totalAmount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-accent-400 to-accent-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-3">
              <Calculator className="w-6 h-6" />
              <p className="text-sm font-medium">Valor por pessoa:</p>
            </div>
            <p className="text-4xl font-bold mb-4">
              R$ {amountPerPerson.toFixed(2)}
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/80">Total:</p>
                <p className="font-semibold">R$ {parseFloat(totalAmount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-white/80">Pessoas:</p>
                <p className="font-semibold">{numberOfPeople}</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              className="w-full mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Resumo
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-purple-900 dark:text-purple-300">
          <strong>💡 Exemplo:</strong> Pizza de R$ 60 dividida entre 3 pessoas = R$ 20 cada
        </p>
      </div>
    </motion.div>
  )
}
