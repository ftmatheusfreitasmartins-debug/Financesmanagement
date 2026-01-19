'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Eye, EyeOff } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

const PRIVACY_KEY = 'fm_privacy_mode'
const BLUR_ATTR = 'data-privacy-blur'

function isBlurCandidate(el: Element): boolean {
  const tag = el.tagName.toLowerCase()

  // Evitar elementos que não fazem sentido borrar
  if (
    tag === 'script' ||
    tag === 'style' ||
    tag === 'svg' ||
    tag === 'path' ||
    tag === 'button' ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    tag === 'option'
  ) {
    return false
  }

  const ht = el as HTMLElement

  // Só blur em "folhas" (evita borrar containers inteiros)
  if (ht.children && ht.children.length > 0) return false

  const text = (ht.textContent || '').trim()
  if (!text) return false

  // Borrar apenas valores monetários claros (R$ ...)
  return /\bR\$\s*[\d.,]+/.test(text)
}

function applyBlurToTree(root: ParentNode) {
  const all = root.querySelectorAll('*')
  all.forEach((el) => {
    if (!(el instanceof HTMLElement)) return
    if (el.getAttribute(BLUR_ATTR) === '1') return

    if (isBlurCandidate(el)) {
      el.setAttribute(BLUR_ATTR, '1')
      el.style.filter = 'blur(6px)'
      el.style.userSelect = 'none'
    }
  })
}

function clearBlur(root: ParentNode) {
  const blurred = root.querySelectorAll(`[${BLUR_ATTR}="1"]`)
  blurred.forEach((el) => {
    if (!(el instanceof HTMLElement)) return
    el.removeAttribute(BLUR_ATTR)
    el.style.filter = ''
    el.style.userSelect = ''
  })
}

export default function DarkModeToggle() {
  const darkMode = useFinanceStore((state) => state.darkMode)
  const toggleDarkMode = useFinanceStore((state) => state.toggleDarkMode)

  const [privacyMode, setPrivacyMode] = useState(false)
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Carrega privacidade do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRIVACY_KEY)
      setPrivacyMode(raw === '1')
    } catch {
      // ignore
    }
  }, [])

  // Aplica/remove blur + mantém via MutationObserver
  useEffect(() => {
    if (typeof document === 'undefined') return

    // Persistir
    try {
      localStorage.setItem(PRIVACY_KEY, privacyMode ? '1' : '0')
    } catch {
      // ignore
    }

    // Limpa observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (!privacyMode) {
      clearBlur(document.body)
      return
    }

    // Aplica imediatamente
    applyBlurToTree(document.body)

    // Mantém blur para conteúdo que aparece depois (listas, abas, modais, etc.)
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return

          if (isBlurCandidate(node)) {
            node.setAttribute(BLUR_ATTR, '1')
            node.style.filter = 'blur(6px)'
            node.style.userSelect = 'none'
          }

          applyBlurToTree(node)
        })
      }
    })

    obs.observe(document.body, { subtree: true, childList: true })
    observerRef.current = obs

    return () => {
      obs.disconnect()
      observerRef.current = null
    }
  }, [privacyMode])

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Toggle tema (igual o seu) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleDarkMode}
        className="relative w-14 h-7 bg-gray-300 dark:bg-gray-600 rounded-full p-1 transition-colors duration-300"
        title={darkMode ? 'Tema escuro (clique para claro)' : 'Tema claro (clique para escuro)'}
        aria-label={darkMode ? 'Tema escuro (clique para claro)' : 'Tema claro (clique para escuro)'}
      >
        <motion.div
          animate={{ x: darkMode ? 28 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
        >
          {darkMode ? (
            <Moon className="w-3 h-3 text-gray-700" />
          ) : (
            <Sun className="w-3 h-3 text-yellow-500" />
          )}
        </motion.div>
      </motion.button>

      {/* Toggle privacidade (embaixo do tema, mesma animação) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setPrivacyMode((v) => !v)}
        className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
          privacyMode ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        title={privacyMode ? 'Modo privacidade ativado (clique para desativar)' : 'Modo privacidade desativado (clique para ativar)'}
        aria-label={privacyMode ? 'Modo privacidade ativado (clique para desativar)' : 'Modo privacidade desativado (clique para ativar)'}
      >
        <motion.div
          animate={{ x: privacyMode ? 28 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
        >
          {privacyMode ? (
            <EyeOff className="w-3 h-3 text-gray-700" />
          ) : (
            <Eye className="w-3 h-3 text-gray-500" />
          )}
        </motion.div>
      </motion.button>
    </div>
  )
}
