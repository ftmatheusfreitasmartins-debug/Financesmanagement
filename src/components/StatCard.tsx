import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: number
  delay?: number
  color: 'blue' | 'green' | 'red' | 'yellow'
}

const colorClasses = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  green: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  yellow: 'bg-gradient-to-br from-amber-500 to-amber-600',
}

export default function StatCard({ title, value, icon: Icon, trend, delay = 0, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
          <motion.h3 
            className="text-3xl font-bold text-gray-900 dark:text-white"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
          >
            {value}
          </motion.h3>
          {trend !== undefined && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.4 }}
              className={`text-sm mt-2 font-semibold ${
                trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% este mês
            </motion.p>
          )}
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.3, type: 'spring' }}
          className={`${colorClasses[color]} p-4 rounded-xl shadow-lg`}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
      </div>
    </motion.div>
  )
}
