'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useFinanceStore } from '@/store/financeStore'

export default function DarkModeToggle() {
  const darkMode = useFinanceStore(state => state.darkMode)
  const toggleDarkMode = useFinanceStore(state => state.toggleDarkMode)
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])
  
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleDarkMode}
      className="relative w-14 h-7 bg-gray-300 dark:bg-gray-600 rounded-full p-1 transition-colors duration-300"
    >
      <motion.div
        animate={{
          x: darkMode ? 28 : 0
        }}
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
  )
}
