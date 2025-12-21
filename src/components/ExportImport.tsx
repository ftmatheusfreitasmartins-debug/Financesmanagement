'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload, FileJson, FileText, Trash2 } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

export default function ExportImport() {
  const [importing, setImporting] = useState(false)
  
  const exportData = useFinanceStore(state => state.exportData)
  const importData = useFinanceStore(state => state.importData)
  const clearAllData = useFinanceStore(state => state.clearAllData)
  
  const handleExportJSON = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const handleExportCSV = () => {
    const state = useFinanceStore.getState()
    const transactions = state.transactions
    
    const csv = [
      ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'],
      ...transactions.map(t => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.description,
        t.category,
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.amount.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result as string
      importData(data)
      setImporting(false)
    }
    reader.readAsText(file)
  }
  
  const handleClearAll = () => {
    if (confirm('⚠️ ATENÇÃO! Isso irá apagar TODOS os dados. Tem certeza?')) {
      clearAllData()
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Backup & Dados</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportJSON}
          className="flex items-center gap-2 justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span className="font-medium">Exportar JSON</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportCSV}
          className="flex items-center gap-2 justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Exportar CSV</span>
        </motion.button>
        
        <motion.label
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 justify-center px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium">Importar JSON</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </motion.label>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClearAll}
          className="flex items-center gap-2 justify-center px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          <span className="font-medium">Limpar Tudo</span>
        </motion.button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>💡 Dica:</strong> Faça backups regulares dos seus dados! O arquivo JSON pode ser importado a qualquer momento para restaurar suas informações.
        </p>
      </div>
    </motion.div>
  )
}
