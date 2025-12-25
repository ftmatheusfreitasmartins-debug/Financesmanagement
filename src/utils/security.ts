/**
 * 🔒 SECURITY UTILITIES
 * Funções centralizadas de segurança
 */

// 1. Sanitização de strings (EXPORTADO)
export function sanitizeString(input: string, maxLength: number = 200): string {
  if (typeof input !== 'string') return ''
  
  // Remove caracteres perigosos
  let sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, maxLength)
  
  return sanitized.trim()
}

// 2. Validação de números
export function validateNumber(
  value: any,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number {
  const num = Number(value)
  
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return 0
  }
  
  if (num < min) return min
  if (num > max) return max
  
  return Math.abs(num)
}

// 3. Validação de datas
export function validateDate(date: any): Date {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return new Date()
  }
  
  const minDate = new Date('2000-01-01')
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 10)
  
  if (d < minDate) return minDate
  if (d > maxDate) return maxDate
  
  return d
}

// 4. Sanitização CSV
export function sanitizeCSV(value: string): string {
  if (typeof value !== 'string') return ''
  
  const dangerous = ['=', '+', '-', '@', '\t', '\r', '\n', '|']
  let sanitized = value
  
  if (dangerous.some(char => sanitized.startsWith(char))) {
    sanitized = `'${sanitized}`
  }
  
  sanitized = sanitized.replace(/"/g, '""')
  return sanitized
}

// 5. Validação de tipo MIME
export function validateImageMIME(base64: string): boolean {
  if (typeof base64 !== 'string') return false
  
  const allowedTypes = [
    'data:image/jpeg',
    'data:image/jpg',
    'data:image/png'
  ]
  
  return allowedTypes.some(type => base64.startsWith(type))
}

// 6. Validação de tamanho
export function validateImageSize(base64: string, maxSizeMB: number = 2): boolean {
  if (typeof base64 !== 'string') return false
  
  const sizeInBytes = (base64.length * 3) / 4
  const sizeInMB = sizeInBytes / (1024 * 1024)
  
  return sizeInMB <= maxSizeMB
}

// 7. Validação de array
export function validateArray<T>(
  value: any,
  maxLength: number = 1000,
  validator?: (item: T) => boolean
): T[] {
  if (!Array.isArray(value)) return []
  
  let arr = value.slice(0, maxLength)
  
  if (validator) {
    arr = arr.filter(validator)
  }
  
  return arr
}

// 8. Rate Limiter
class RateLimiter {
  private timestamps: Map<string, number[]> = new Map()
  
  check(key: string, maxRequests: number = 10, windowMs: number = 1000): boolean {
    const now = Date.now()
    const requests = this.timestamps.get(key) || []
    
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.timestamps.set(key, validRequests)
    
    return true
  }
  
  clear(key: string) {
    this.timestamps.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// 9. Validação de tags
export function validateTags(tags: any): string[] {
  if (!Array.isArray(tags)) return []
  
  return tags
    .filter(tag => typeof tag === 'string')
    .map(tag => sanitizeString(tag, 50))
    .filter(tag => tag.length > 0)
    .slice(0, 10)
}

// 10. Gerador de ID seguro
export function generateSecureId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 11. JSON Parse seguro
export function safeJSONParse(json: string): any {
  try {
    const parsed = JSON.parse(json, (key, value) => {
      if (key === '__proto__' || key === 'constructor') {
        return undefined
      }
      return value
    })
    
    return parsed
  } catch {
    return null
  }
}

// 12. Validação de moeda
export function validateCurrency(currency: any): 'BRL' | 'USD' | 'EUR' {
  const valid = ['BRL', 'USD', 'EUR']
  return valid.includes(currency) ? currency : 'BRL'
}

// 13. Sanitização profunda
export function deepSanitize(obj: any, maxDepth: number = 5): any {
  if (maxDepth === 0) return null
  
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, maxDepth - 1))
  }
  
  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    sanitized[key] = deepSanitize(value, maxDepth - 1)
  }
  
  return sanitized
}
