'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Loader2, LogIn, UserPlus, LogOut } from 'lucide-react'

// Tipagem do Netlify Identity
interface NetlifyUser {
  id: string
  email: string
  user_metadata: {
    full_name?: string
  }
}

// ============================================
// 🔐 NETLIFY IDENTITY MANAGER
// ============================================
class NetlifyAuthManager {
  private static netlifyIdentity: any = null
  private static initialized = false

  static async init(): Promise<void> {
    if (typeof window === 'undefined' || this.initialized) return

    try {
      const netlifyIdentity = await import('netlify-identity-widget')
      this.netlifyIdentity = netlifyIdentity.default || netlifyIdentity
      this.netlifyIdentity.init({ locale: 'pt' })
      
      this.netlifyIdentity.on('login', (user: NetlifyUser) => {
        console.log('✅ Login bem-sucedido:', user.email)
        this.netlifyIdentity.close()
        window.location.reload()
      })

      this.netlifyIdentity.on('logout', () => {
        console.log('✅ Logout bem-sucedido')
        // Limpa TODOS os dados do localStorage
        this.clearAllStorage()
        window.location.reload()
      })

      this.initialized = true
    } catch (error) {
      console.error('❌ Erro ao carregar Netlify Identity:', error)
    }
  }

  static login(): void {
    if (this.netlifyIdentity) this.netlifyIdentity.open('login')
  }

  static signup(): void {
    if (this.netlifyIdentity) this.netlifyIdentity.open('signup')
  }

  static logout(): void {
    if (this.netlifyIdentity) {
      console.log('🔄 Iniciando logout...')
      this.netlifyIdentity.logout()
      // Força limpeza imediata
      setTimeout(() => {
        this.clearAllStorage()
        window.location.href = '/'
      }, 500)
    }
  }

  static getCurrentUser(): NetlifyUser | null {
    return this.netlifyIdentity ? this.netlifyIdentity.currentUser() : null
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  // ✅ NOVA FUNÇÃO: Limpa todo o localStorage
  static clearAllStorage(): void {
    try {
      // Remove dados financeiros
      localStorage.removeItem('finance-storage')
      
      // Remove tokens do Netlify Identity
      localStorage.removeItem('gotrue.user')
      localStorage.removeItem('netlify-identity-user')
      
      // Limpa sessionStorage também
      sessionStorage.clear()
      
      console.log('🧹 LocalStorage limpo')
    } catch (error) {
      console.error('Erro ao limpar storage:', error)
    }
  }
}

// ============================================
// 🎨 COMPONENTE PRINCIPAL
// ============================================
export default function AuthScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<NetlifyUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      await NetlifyAuthManager.init()
      const user = NetlifyAuthManager.getCurrentUser()
      setIsAuthenticated(!!user)
      setCurrentUser(user)
      setLoading(false)
    }

    initAuth()

    // Verifica autenticação a cada 500ms
    const checkAuth = setInterval(() => {
      const user = NetlifyAuthManager.getCurrentUser()
      setIsAuthenticated(!!user)
      setCurrentUser(user)
    }, 500)

    return () => clearInterval(checkAuth)
  }, [])

  // Se está autenticado, não mostra a tela de login
  if (isAuthenticated && currentUser) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="bg-accent-100 dark:bg-accent-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-accent-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Finance Manager Pro
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Sistema de Gestão Financeira</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => NetlifyAuthManager.login()}
            className="w-full py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Entrar
          </button>

          <button
            onClick={() => NetlifyAuthManager.signup()}
            className="w-full py-4 border-2 border-accent-500 text-accent-600 dark:text-accent-400 font-bold rounded-xl hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Criar Conta
          </button>
        </div>

        <div className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            🔐 Autenticação segura via Netlify Identity
          </p>
          <p>Seus dados são criptografados e armazenados com segurança no Netlify.</p>
          <p>Suporte para login via email, Google, GitHub e mais.</p>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================
// 🪝 HOOK PERSONALIZADO useAuth
// ============================================
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<NetlifyUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = NetlifyAuthManager.getCurrentUser()
      setIsAuthenticated(!!currentUser)
      setUser(currentUser)
      setLoading(false)
    }

    // Inicializa o Netlify Identity
    NetlifyAuthManager.init().then(() => {
      checkAuth()
    })

    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  const logout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      NetlifyAuthManager.logout()
    }
  }

  return { isAuthenticated, user, loading, logout }
}
