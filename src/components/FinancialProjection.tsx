'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, Info, BarChart3, LineChart as LineChartIcon } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

type Scenario = 'pessimistic' | 'realistic' | 'optimistic'

export default function FinancialProjection() {
  const [selectedMonths, setSelectedMonths] = useState(6)
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('realistic')
  
  const getFinancialProjection = useFinanceStore(state => state.getFinancialProjection)
  const salary = useFinanceStore(state => state.salary)
  const recurringTransactions = useFinanceStore(state => state.recurringTransactions)
  const getBalance = useFinanceStore(state => state.getBalance)

  const baseProjections = getFinancialProjection(selectedMonths)
  
  // Calcula cenários diferentes
  const scenarios = useMemo(() => {
    return {
      pessimistic: baseProjections.map(p => ({
        ...p,
        projectedBalance: p.projectedBalance - (p.projectedExpenses * 0.15),
        projectedExpenses: p.projectedExpenses * 1.15,
        projectedIncome: p.projectedIncome * 0.95,
      })),
      realistic: baseProjections,
      optimistic: baseProjections.map(p => ({
        ...p,
        projectedBalance: p.projectedBalance + (p.projectedExpenses * 0.10),
        projectedExpenses: p.projectedExpenses * 0.90,
        projectedIncome: p.projectedIncome * 1.05,
      }))
    }
  }, [baseProjections])

  const projections = scenarios[selectedScenario]
  const finalProjection = projections[projections.length - 1]
  const currentBalance = getBalance()
  const balanceChange = finalProjection.projectedBalance - currentBalance
  const avgMonthlyChange = balanceChange / selectedMonths

  // Prepara dados para os gráficos
  const chartData = projections.map(p => ({
    month: p.month,
    Saldo: p.projectedBalance,
    Receitas: p.projectedIncome,
    Despesas: p.projectedExpenses,
    Confiança: p.confidence
  }))

  // Análise de risco
  const riskLevel = useMemo(() => {
    const negativeMonths = projections.filter(p => p.projectedBalance < 0).length
    const percentNegative = (negativeMonths / projections.length) * 100
    
    if (percentNegative > 50) return { level: 'high', text: 'Alto Risco', color: 'red' }
    if (percentNegative > 25) return { level: 'medium', text: 'Risco Moderado', color: 'orange' }
    return { level: 'low', text: 'Baixo Risco', color: 'green' }
  }, [projections])

  const activeRecurring = recurringTransactions.filter(r => r.active)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Projeção Financeira Avançada
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Análise preditiva com múltiplos cenários
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Período */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Período de projeção
          </label>
          <select
            value={selectedMonths}
            onChange={(e) => setSelectedMonths(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={9}>9 meses</option>
            <option value={12}>12 meses</option>
          </select>
        </div>

        {/* Cenário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cenário
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value as Scenario)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="pessimistic">😰 Pessimista (+15% gastos)</option>
            <option value="realistic">😐 Realista (tendência atual)</option>
            <option value="optimistic">😊 Otimista (-10% gastos)</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Saldo Projetado */}
        <div className={`p-4 rounded-xl border-2 ${
          finalProjection.projectedBalance >= 0 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        }`}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Saldo em {selectedMonths} meses
          </p>
          <p className={`text-2xl font-bold ${
            finalProjection.projectedBalance >= 0 
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            R$ {finalProjection.projectedBalance.toFixed(2)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {balanceChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-xs font-medium ${
              balanceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {balanceChange >= 0 ? '+' : ''}R$ {balanceChange.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Média Mensal */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Variação mensal média
          </p>
          <p className={`text-2xl font-bold ${
            avgMonthlyChange >= 0 
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            {avgMonthlyChange >= 0 ? '+' : ''}R$ {avgMonthlyChange.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {avgMonthlyChange >= 0 ? 'Economizando' : 'Gastando mais que ganha'}
          </p>
        </div>

        {/* Nível de Risco */}
        <div className={`p-4 rounded-xl border-2 ${
          riskLevel.level === 'low' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : riskLevel.level === 'medium'
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 text-${riskLevel.color}-600`} />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Análise de Risco
            </p>
          </div>
          <p className={`text-xl font-bold text-${riskLevel.color}-600 dark:text-${riskLevel.color}-400`}>
            {riskLevel.text}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Confiança média: {Math.round(projections.reduce((sum, p) => sum + p.confidence, 0) / projections.length)}%
          </p>
        </div>
      </div>

      {/* Gráfico de Evolução do Saldo */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <LineChartIcon className="w-5 h-5 text-purple-600" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Evolução do Saldo Projetado
          </h4>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Saldo']}
            />
            <Area
              type="monotone"
              dataKey="Saldo"
              stroke="#8b5cf6"
              strokeWidth={3}
              fill="url(#colorSaldo)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Receitas vs Despesas */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Receitas vs Despesas Projetadas
          </h4>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <Bar dataKey="Receitas" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Como Calculamos */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                💡 Como calculamos
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Análise dos últimos 6 meses de histórico</li>
                <li>• Tendência de crescimento/diminuição de gastos</li>
                <li>• {activeRecurring.length} transações recorrentes futuras incluídas</li>
                <li>• Volatilidade histórica afeta a confiança</li>
                <li>• Regressão linear para projeção de despesas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recomendações */}
        <div className={`p-4 rounded-xl border ${
          balanceChange >= 0
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        }`}>
          <div className="flex items-start gap-2">
            <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              balanceChange >= 0 ? 'text-green-600' : 'text-orange-600'
            }`} />
            <div>
              <p className={`text-sm font-semibold mb-1 ${
                balanceChange >= 0 
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-orange-800 dark:text-orange-300'
              }`}>
                {balanceChange >= 0 ? '✅ Tendência Positiva!' : '⚠️ Atenção Necessária'}
              </p>
              <p className={`text-xs ${
                balanceChange >= 0 
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-orange-700 dark:text-orange-400'
              }`}>
                {balanceChange >= 0 
                  ? `Continue assim! Você está economizando R$ ${avgMonthlyChange.toFixed(2)}/mês em média.`
                  : `Reduza gastos em R$ ${Math.abs(avgMonthlyChange).toFixed(2)}/mês para evitar saldo negativo.`
                }
              </p>
              {activeRecurring.filter(r => r.type === 'expense').length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  💡 {activeRecurring.filter(r => r.type === 'expense').length} despesas recorrentes ativas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
