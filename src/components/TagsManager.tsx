'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, X, Hash } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

export default function TagsManager() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  
  const getAllTags = useFinanceStore(state => state.getAllTags)
  const getTaggedTransactions = useFinanceStore(state => state.getTaggedTransactions)
  
  const allTags = getAllTags()
  
  const tagColors = [
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  ]
  
  const getTagColor = (index: number) => tagColors[index % tagColors.length]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center gap-3 mb-6">
        <Tag className="w-6 h-6 text-accent-400" />
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tags</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Organize suas transações</p>
        </div>
      </div>
      
      {allTags.length === 0 ? (
        <div className="text-center py-8">
          <Hash className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma tag criada ainda. Adicione tags às suas transações!
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.map((tag, index) => {
              const taggedCount = getTaggedTransactions(tag).length
              const isSelected = selectedTag === tag
              
              return (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'ring-2 ring-accent-400 shadow-lg'
                      : ''
                  } ${getTagColor(index)}`}
                >
                  <Hash className="w-4 h-4" />
                  {tag}
                  <span className="bg-white/30 dark:bg-black/20 px-2 py-0.5 rounded-full text-xs">
                    {taggedCount}
                  </span>
                </motion.button>
              )
            })}
          </div>
          
          <AnimatePresence>
            {selectedTag && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Transações com "{selectedTag}"
                    </h4>
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {getTaggedTransactions(selectedTag).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.category}
                          </p>
                        </div>
                        <p className={`font-bold text-sm ${
                          transaction.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        R$ {getTaggedTransactions(selectedTag)
                          .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <strong>💡 Dica:</strong> Use tags como #urgente, #parcelado, #reembolso para organizar melhor suas transações!
        </p>
      </div>
    </motion.div>
  )
}
