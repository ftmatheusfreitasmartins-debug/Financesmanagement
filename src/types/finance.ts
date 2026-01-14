export type Currency = 'BRL' | 'USD' | 'EUR'

export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
  date: Date
  recurring?: boolean
  recurringId?: string
  tags?: string[]
  split?: {
    total: number
    people: number
    sharedWith: string[]
  }
  currency?: Currency
  exchangeRate?: number
  originalAmount?: number
  receipt?: string // Base64 da imagem do comprovante
}

export interface RecurringTransaction {
  id: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate: Date
  endDate?: Date
  lastExecuted?: Date
  tags?: string[]
  currency?: Currency
  active: boolean
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date
  category: string
  color: string
}

export interface Budget {
  category: string
  limit: number
  spent: number
  period: 'monthly' | 'weekly'
}

export interface SavedMoney {
  id: string
  amount: number
  description: string
  date: Date
  goal?: string
}

export interface FinancialProjection {
  month: string
  projectedBalance: number
  projectedIncome: number
  projectedExpenses: number
  confidence: number
}

export interface SpendingPattern {
  dayOfWeek: string
  averageSpending: number
  percentage: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface FinanceState {
  salary: number
  transactions: Transaction[]
  recurringTransactions: RecurringTransaction[]
  goals: Goal[]
  budgets: Budget[]
  savedMoney: SavedMoney[]
  darkMode: boolean
  currencies: {
    USD: number
    EUR: number
    BRL: number
  }

  // Salary
  setSalary: (salary: number) => void

  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  removeTransaction: (id: string) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void

  // Recurring Transactions
  addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id' | 'active' | 'lastExecuted'>) => void
  removeRecurringTransaction: (id: string) => void
  toggleRecurringTransaction: (id: string) => void
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
  processRecurringTransactions: () => void

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void
  removeGoal: (id: string) => void
  updateGoalProgress: (id: string, amount: number) => void

  // Budgets
  setBudget: (category: string, limit: number, period: 'monthly' | 'weekly') => void
  removeBudget: (category: string) => void

  // Savings
  addSavedMoney: (saving: Omit<SavedMoney, 'id'>) => void
  removeSavedMoney: (id: string) => void
  getTotalSaved: () => number

  // Settings
  toggleDarkMode: () => void
  updateCurrency: (currency: 'USD' | 'EUR', rate: number) => void

  // IMPORTANTE: agora retorna boolean e aceita force (manual).
  refreshCurrencyRates: (opts?: { force?: boolean }) => Promise<boolean>

  // Computed
  getBalance: () => number
  getAvailableBalance: () => number
  getTotalBalance: () => number
  getTotalIncome: () => number
  getTotalExpenses: () => number
  getTransactionsByCategory: () => Record<string, number>
  getMonthlyData: () => { month: string; income: number; expenses: number }[]
  getCategoryBudgetStatus: () => { category: string; spent: number; limit: number; percentage: number }[]

  // Advanced Analytics
  getFinancialProjection: (months: number) => FinancialProjection[]
  getSpendingPatterns: () => SpendingPattern[]
  getTaggedTransactions: (tag: string) => Transaction[]
  getAllTags: () => string[]

  // Multi-currency
  convertCurrency: (amount: number, from: Currency, to: Currency) => number

  // Export/Import
  exportData: () => string
  importData: (data: string) => void
  clearAllData: () => void
}

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Contas',
  'Investimentos',
  'Outros',
] as const

export type Category = (typeof CATEGORIES)[number]

export const GOAL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'] as const

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
}
