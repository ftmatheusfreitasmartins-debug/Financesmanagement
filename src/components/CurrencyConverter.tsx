'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { CURRENCY_SYMBOLS, type Currency } from '@/types/finance'

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState<Currency>('BRL')
  const [toCurrency, setToCurrency] = useState<Currency>('USD')

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  const currencies = useFinanceStore((state) => state.currencies)
  const convertCurrency = useFinanceStore((state) => state.convertCurrency)
  const refreshCurrencyRates = useFinanceStore((state) => state.refreshCurrencyRates)

  // Atualiza "now" para o countdown renderizar
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  const convertedAmount = useMemo(() => {
    const v = Number(amount)
    if (!Number.isFinite(v) || Number.isNaN(v) || v <= 0) return 0
    return convertCurrency(v, fromCurrency, toCurrency)
  }, [amount, fromCurrency, toCurrency, convertCurrency])

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  const disabled = isRefreshing || cooldownLeft > 0

  const currencyOptions = [
    { code: 'BRL' as const, name: 'Real Brasileiro', flag: '🇧🇷' },
    { code: 'USD' as const, name: 'Dólar Americano', flag: '🇺🇸' },
    { code: 'EUR' as const, name: 'Euro', flag: '🇪🇺' },
  ]

  const updateRates = async () => {
    if (disabled) return

    setIsRefreshing(true)
    const didRun = await refreshCurrencyRates({ force: true })
    setIsRefreshing(false)

    // Se executou de verdade, aplica cooldown igual ao limiter manual (30s)
    if (didRun) setCooldownUntil(Date.now() + 30_000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-accent-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Conversor de Moedas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Para viagens e compras internacionais</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <motion.button
            whileHover={!disabled ? { rotate: 180 } : undefined}
            transition={{ duration: 0.3 }}
            onClick={updateRates}
            disabled={disabled}
            title={disabled ? (isRefreshing ? 'Atualizando...' : `Aguarde ${cooldownLeft}s`) : 'Atualizar câmbio agora'}
            className={`p-2 rounded-lg transition-colors ${
              disabled
                ? 'bg-gray-200 dark:bg-gray-700 opacity-60 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          {cooldownLeft > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">Aguarde {cooldownLeft}s</span>}
        </div>
      </div>

      {/* Taxa de Câmbio Atual */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">🇺🇸 USD → BRL</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">R$ {currencies.USD.toFixed(2)}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">🇪🇺 EUR → BRL</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">R$ {currencies.EUR.toFixed(2)}</p>
        </div>
      </div>

      {/* Conversor */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">De</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {currencyOptions.map((curr) => (
              <button
                key={curr.code}
                onClick={() => setFromCurrency(curr.code)}
                className={`py-2 px-3 rounded-lg font-medium transition-all ${
                  fromCurrency === curr.code
                    ? 'bg-accent-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {curr.flag} {curr.code}
              </button>
            ))}
          </div>

          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full px-4 py-3 text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none"
          />
        </div>

        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setFromCurrency(toCurrency)
              setToCurrency(fromCurrency)
            }}
            className="p-3 bg-accent-400 text-white rounded-full shadow-lg hover:bg-accent-500 transition-colors"
          >
            <TrendingUp className="w-5 h-5 rotate-90" />
          </motion.button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Para</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {currencyOptions.map((curr) => (
              <button
                key={curr.code}
                onClick={() => setToCurrency(curr.code)}
                className={`py-2 px-3 rounded-lg font-medium transition-all ${
                  toCurrency === curr.code
                    ? 'bg-accent-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {curr.flag} {curr.code}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-accent-400 to-accent-500 rounded-xl p-4">
          <p className="text-sm text-white/80 mb-1">Resultado:</p>
          <p className="text-3xl font-bold text-white">
            {CURRENCY_SYMBOLS[toCurrency]} {convertedAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-900 dark:text-yellow-300">
          <strong>💡 Dica:</strong> Use ao cadastrar despesas em viagens! Converta para BRL e veja o impacto real no seu
          orçamento.
        </p>
      </div>
    </motion.div>
  )
}
