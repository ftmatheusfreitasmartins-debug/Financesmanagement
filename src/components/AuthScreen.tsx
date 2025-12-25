'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Loader2, LogIn, UserPlus } from 'lucide-react'

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

  static async init(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const netlifyIdentity = await import('netlify-identity-widget')
      this.netlifyIdentity = netlifyIdentity.default || netlifyIdentity

      this.netlifyIdentity.init({ locale: 'pt' })

      this.netlifyIdentity.on('login', (user: NetlifyUser) => {
        console.log('Login:', user.email)
        this.netlifyIdentity.close()
        window.location.reload()
      })

      this.netlifyIdentity.on('logout', () => {
        console.log('Logout')
        window.location.reload()
      })
    } catch (error) {
      console.error('Erro ao carregar Netlify Identity:', error)
    }
  }

  static login(): void {
    if (this.netlifyIdentity) this.netlifyIdentity.open('login')
  }

  static signup(): void {
    if (this.netlifyIdentity) this.netlifyIdentity.open('signup')
  }

  static logout(): void {
    if (this.netlifyIdentity) this.netlifyIdentity.logout()
  }

  static getCurrentUser(): NetlifyUser | null {
    return this.netlifyIdentity ? this.netlifyIdentity.currentUser() : null
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}

// ============================================
// 🎨 COMPONENTE
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

    const checkAuth = setInterval(() => {
      const user = NetlifyAuthManager.getCurrentUser()
      setIsAuthenticated(!!user)
      setCurrentUser(user)
    }, 500)

    return () => clearInterval(checkAuth)
  }, [])

  if (isAuthenticated && currentUser) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-semibold">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-accent-500/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Finance Manager Pro</h1>
          <p className="text-accent-100">Sistema de Gestão Financeira</p>
        </div>

        <div className="p-8 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
              🔐 Autenticação segura via Netlify Identity
            </p>
          </div>

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

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
              <p>
                Seus dados são criptografados e armazenados com segurança no Netlify.
                Suporte para login via email, Google, GitHub e mais.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<NetlifyUser | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = NetlifyAuthManager.getCurrentUser()
      setIsAuthenticated(!!currentUser)
      setUser(currentUser)
    }

    checkAuth()
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  const logout = () => {
    NetlifyAuthManager.logout()
  }

  return { isAuthenticated, user, logout }
}
