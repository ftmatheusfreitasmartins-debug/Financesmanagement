'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Loader2, LogIn, UserPlus } from 'lucide-react'

interface NetlifyUser {
  id?: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
  app_metadata?: {
    roles?: string[]
  }
}

class NetlifyAuthManager {
  private static widget: any = null
  private static initialized = false
  private static initPromise: Promise<void> | null = null

  static async init(): Promise<void> {
    if (typeof window === 'undefined') return
    if (NetlifyAuthManager.initialized) return
    if (NetlifyAuthManager.initPromise) return NetlifyAuthManager.initPromise

    NetlifyAuthManager.initPromise = (async () => {
      const mod = await import('netlify-identity-widget')
      NetlifyAuthManager.widget = (mod as any).default || mod

      // Inicia o widget
      NetlifyAuthManager.widget.init({ locale: 'pt' })

      // Eventos
      NetlifyAuthManager.widget.on('login', () => {
        try {
          NetlifyAuthManager.widget.close()
        } catch {
          // ignore
        }
        window.location.reload()
      })

      NetlifyAuthManager.widget.on('logout', () => {
        NetlifyAuthManager.clearAllStorage()
        window.location.href = '/'
      })

      NetlifyAuthManager.initialized = true
    })().catch((err) => {
      // Se falhar, libera uma nova tentativa futura
      NetlifyAuthManager.initPromise = null
      NetlifyAuthManager.initialized = false
      throw err
    })

    return NetlifyAuthManager.initPromise
  }

  static async login(): Promise<void> {
    // Segurança: garante init antes de abrir modal
    await NetlifyAuthManager.init().catch(() => {})
    if (!NetlifyAuthManager.widget) return
    NetlifyAuthManager.widget.open('login')
  }

  static async signup(): Promise<void> {
    await NetlifyAuthManager.init().catch(() => {})
    if (!NetlifyAuthManager.widget) return
    NetlifyAuthManager.widget.open('signup')
  }

  static logout(): void {
    try {
      // Segurança: limpa imediatamente também
      NetlifyAuthManager.clearAllStorage()
      NetlifyAuthManager.widget?.logout?.()
    } catch {
      NetlifyAuthManager.clearAllStorage()
      if (typeof window !== 'undefined') window.location.href = '/'
    }
  }

  static getCurrentUser(): NetlifyUser | null {
    try {
      return NetlifyAuthManager.widget ? NetlifyAuthManager.widget.currentUser() : null
    } catch {
      return null
    }
  }

  static isAuthenticated(): boolean {
    return NetlifyAuthManager.getCurrentUser() !== null
  }

  static clearAllStorage(): void {
    try {
      // Remove estado persistido do app
      localStorage.removeItem('finance-storage')

      // Remove tokens do Identity (GoTrue)
      localStorage.removeItem('gotrue.user')
      localStorage.removeItem('netlify-identity-user')

      // Limpa sessão
      sessionStorage.clear()
    } catch {
      // ignore
    }
  }
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 flex items-center justify-center p-4">
      <div className="text-white text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium">Carregando...</p>
        <p className="text-sm opacity-80 mt-1">Preparando seu acesso</p>
      </div>
    </div>
  )
}

export default function AuthScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<NetlifyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  const pollMs = useMemo(() => 1000, [])

  useEffect(() => {
    let alive = true

    const syncAuthState = () => {
      const user = NetlifyAuthManager.getCurrentUser()
      if (!alive) return
      setIsAuthenticated(!!user)
      setCurrentUser(user)
    }

    const boot = async () => {
      try {
        await NetlifyAuthManager.init()
        syncAuthState()
      } catch {
        if (!alive) return
        setInitError('Não foi possível iniciar o acesso agora. Tente recarregar a página.')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    boot()
    const interval = window.setInterval(syncAuthState, pollMs)

    return () => {
      alive = false
      window.clearInterval(interval)
    }
  }, [pollMs])

  if (isAuthenticated && currentUser) return null
  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Glow sutil (mantendo a paleta) */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent-200/40 blur-3xl dark:bg-accent-400/10" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-700/10" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 md:p-8">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:grid-cols-2">
          {/* Painel “privado” (sem divulgação) */}
          <div className="hidden md:flex flex-col justify-between p-10">
            <div>
              <div className="mb-6 inline-flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="text-white">
                  <p className="text-sm/5 font-semibold tracking-wide opacity-90">Finance Manager Pro</p>
                  <p className="text-xs opacity-75">Seu painel financeiro</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white leading-tight">
                Acesse sua conta para continuar.
              </h2>
              <p className="mt-3 text-white/80 text-sm leading-relaxed max-w-md">
                Tudo em um só lugar: transações, metas e análises.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-white/85">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="font-semibold">Organização</p>
                  <p className="opacity-80 mt-1">Categorias, tags e filtros.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="font-semibold">Clareza</p>
                  <p className="opacity-80 mt-1">Visão rápida do mês.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="font-semibold">Controle</p>
                  <p className="opacity-80 mt-1">Orçamentos e alertas.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="font-semibold">Projeção</p>
                  <p className="opacity-80 mt-1">Planeje os próximos meses.</p>
                </div>
              </div>
            </div>

            <div className="text-white/70 text-xs">
              <p>© 2025 Finance Manager Pro</p>
            </div>
          </div>

          {/* Card login */}
          <div className="p-6 sm:p-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-3xl bg-white/90 dark:bg-gray-900/80 border border-white/40 dark:border-white/10 shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-100 dark:bg-accent-900/30 border border-accent-200/60 dark:border-accent-800/40">
                  <Shield className="h-8 w-8 text-accent-600 dark:text-accent-300" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Acessar</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Entre ou crie sua conta.
                </p>
              </div>

              {initError ? (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                  <p className="font-semibold">Falha ao iniciar</p>
                  <p className="mt-1">{initError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 w-full rounded-xl bg-red-600 text-white py-3 font-semibold hover:bg-red-700 transition-colors"
                  >
                    Recarregar
                  </button>
                </div>
              ) : null}

              <div className="space-y-3">
                {/* IMPORTANTE: agora chamamos via arrow para não perder contexto */}
                <button
                  onClick={() => NetlifyAuthManager.login()}
                  className="w-full py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Entrar
                </button>

                <button
                  onClick={() => NetlifyAuthManager.signup()}
                  className="w-full py-4 border-2 border-accent-500 text-accent-700 dark:text-accent-300 font-bold rounded-xl hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Criar conta
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
                Ao sair, os dados locais desta sessão podem ser limpos.
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<NetlifyUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const checkAuth = () => {
      const currentUser = NetlifyAuthManager.getCurrentUser()
      if (!alive) return
      setIsAuthenticated(!!currentUser)
      setUser(currentUser)
      setLoading(false)
    }

    NetlifyAuthManager.init()
      .then(() => checkAuth())
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    const interval = window.setInterval(checkAuth, 1000)
    return () => {
      alive = false
      window.clearInterval(interval)
    }
  }, [])

  const logout = () => {
    if (typeof window !== 'undefined' && window.confirm('Tem certeza que deseja sair?')) {
      NetlifyAuthManager.logout()
    }
  }

  return { isAuthenticated, user, loading, logout }
}
