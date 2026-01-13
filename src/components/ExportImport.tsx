'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload, FileJson, FileText, Trash2 } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { sanitizeCSV } from '@/utils/security'

export default function ExportImport() {
  const [importing, setImporting] = useState(false)

  const exportData = useFinanceStore((state) => state.exportData)
  const importData = useFinanceStore((state) => state.importData)
  const clearAllData = useFinanceStore((state) => state.clearAllData)

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

    const rows: (string | number)[][] = [
      ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'],
      ...transactions.map((t: any) => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.description ?? '',
        t.category ?? '',
        t.type === 'income' ? 'Receita' : 'Despesa',
        Number(t.amount ?? 0).toFixed(2),
      ]),
    ]

    // CSV seguro: escapa aspas e neutraliza fórmulas (CSV injection)
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${sanitizeCSV(String(cell ?? ''))}"`)
          .join(','),
      )
      .join('\n')

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

    // Limite básico (backup pode crescer, mas evita “payload acidental gigante”)
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      alert('Arquivo muito grande! (máx. 5MB)')
      e.target.value = ''
      return
    }

    setImporting(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = (event.target?.result as string) ?? ''
      importData(data)
      setImporting(false)
      e.target.value = ''
    }
    reader.onerror = () => {
      setImporting(false)
      alert('Falha ao ler o arquivo.')
      e.target.value = ''
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Backup & Dados</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleExportJSON}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold hover:from-accent-600 hover:to-accent-700 transition-all"
        >
          <FileJson className="w-5 h-5" />
          Exportar JSON
        </button>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-accent-500 text-accent-700 dark:text-accent-300 font-semibold hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-all"
        >
          <FileText className="w-5 h-5" />
          Exportar CSV
        </button>

        <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer">
          <Upload className="w-5 h-5" />
          {importing ? 'Importando...' : 'Importar JSON'}
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>

        <button
          onClick={handleClearAll}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all"
        >
          <Trash2 className="w-5 h-5" />
          Limpar Tudo
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Dica: guarde seu backup em um local seguro.
      </p>
    </motion.div>
  )
}
