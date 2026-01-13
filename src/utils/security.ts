/**
 * SECURITY UTILITIES
 * Funções centralizadas de segurança (client-side).
 *
 * Observação importante:
 * - Essas funções ajudam a reduzir riscos (XSS, prototype pollution, CSV injection, etc),
 *   mas não substituem validação/controle no servidor quando existir backend.
 */

export type Currency = 'BRL' | 'USD' | 'EUR'

/** Remove caracteres de controle e normaliza unicode para evitar bypass por confusáveis. */
function normalizeInput(input: string): string {
  // Remove caracteres de controle (inclui NULL) e normaliza.
  return input
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .normalize('NFKC')
}

/**
 * 1) Sanitização de strings (EXPORTADO)
 * - Objetivo: reduzir payloads óbvios de XSS quando strings acabam exibidas.
 * - Não é um HTML sanitizer completo (para isso o ideal é DOMPurify).
 */
export function sanitizeString(input: any, maxLength: number = 200): string {
  if (typeof input !== 'string') return ''

  let s = normalizeInput(input)

  // Remove tags e blocos comuns de execução.
  s = s.replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
  s = s.replace(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
  s = s.replace(/<\s*object\b[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '')
  s = s.replace(/<\s*embed\b[^>]*>[\s\S]*?<\s*\/\s*embed\s*>/gi, '')

  // Remove handlers inline comuns: onclick=, onerror= etc.
  // (Ainda pode existir bypass; isso é uma mitigação básica.)
  s = s.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
  s = s.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')

  // Bloqueia protocolos perigosos em texto (evita que virem links inseguros).
  s = s.replace(/javascript\s*:/gi, '')
  s = s.replace(/data\s*:\s*text\/html/gi, '')
  s = s.replace(/vbscript\s*:/gi, '')

  // Evita “tag soup” básica
  s = s.replace(/</g, '')
  s = s.replace(/>/g, '')

  s = s.slice(0, maxLength)
  return s.trim()
}

/**
 * Escapa caracteres HTML para renderização segura em contextos de texto.
 * Útil se algum dia você precisar usar string em lugares “sensíveis”.
 */
export function escapeHTML(input: any, maxLength: number = 500): string {
  const s = sanitizeString(input, maxLength)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 2) Validação de números
 * - Mantém compatibilidade com seu uso atual.
 * - Observação: para valores que podem ser negativos, use allowNegative=true.
 */
export function validateNumber(
  value: any,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  allowNegative: boolean = false,
): number {
  const num = Number(value)
  if (!Number.isFinite(num) || Number.isNaN(num)) return 0

  const n = allowNegative ? num : Math.abs(num)

  if (n < min) return min
  if (n > max) return max
  return n
}

/**
 * 3) Validação de datas
 */
export function validateDate(date: any): Date {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return new Date()

  const minDate = new Date('2000-01-01T00:00:00.000Z')
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 10)

  if (d < minDate) return minDate
  if (d > maxDate) return maxDate
  return d
}

/**
 * 4) Sanitização CSV (previne CSV Injection)
 */
export function sanitizeCSV(value: any): string {
  if (typeof value !== 'string') return ''
  let s = normalizeInput(value)

  // Se começar com caracteres interpretáveis como fórmula, prefixa com apóstrofo.
  const dangerous = ['=', '+', '-', '@', '\t', '\r']
  if (dangerous.some((c) => s.startsWith(c))) s = `'${s}`

  // Escape básico de aspas
  return s.replace(/"/g, '""')
}

/**
 * 5) Validação de tipo MIME (base64 data URI)
 */
export function validateImageMIME(base64: any): boolean {
  if (typeof base64 !== 'string') return false
  const s = base64.trim()

  const allowedTypes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp']
  return allowedTypes.some((type) => s.startsWith(type))
}

/**
 * 6) Validação de tamanho (base64)
 */
export function validateImageSize(base64: any, maxSizeMB: number = 2): boolean {
  if (typeof base64 !== 'string') return false
  const s = base64.trim()

  // Aproximação: 4 chars base64 ~ 3 bytes
  const sizeInBytes = (s.length * 3) / 4
  const sizeInMB = sizeInBytes / 1024 / 1024
  return sizeInMB <= maxSizeMB
}

/**
 * 7) Validação de array (genérica)
 * - Mantém a API que você usa no store.
 */
export function validateArray<T = any>(
  value: any,
  maxLength: number = 1000,
  validator?: (item: any) => boolean,
): T[] {
  if (!Array.isArray(value)) return []
  let arr = value.slice(0, maxLength)
  if (validator) arr = arr.filter(validator)
  return arr as T[]
}

/**
 * 8) Rate Limiter (client-side)
 * - Protege UI/abuso local (não substitui rate limit server-side).
 */
class RateLimiter {
  private timestamps: Map<string, number[]> = new Map()

  check(key: string, maxRequests: number = 10, windowMs: number = 1000): boolean {
    const now = Date.now()
    const requests = this.timestamps.get(key) ?? []
    const validRequests = requests.filter((t) => now - t < windowMs)

    if (validRequests.length >= maxRequests) return false

    validRequests.push(now)
    this.timestamps.set(key, validRequests)
    return true
  }

  clear(key: string): void {
    this.timestamps.delete(key)
  }

  clearAll(): void {
    this.timestamps.clear()
  }
}

export const rateLimiter = new RateLimiter()

/**
 * 9) Validação de tags
 */
export function validateTags(tags: any): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => sanitizeString(tag, 50))
    .filter((tag) => tag.length > 0)
    .slice(0, 10)
}

/**
 * 10) Gerador de ID seguro
 */
export function generateSecureId(): string {
  // Preferência: crypto.randomUUID
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID()
  }

  // Fallback: UUID v4-like usando getRandomValues (se existir)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)

    // Ajustes para v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  // Último fallback: Math.random (menos seguro)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 11) JSON parse seguro (mitiga prototype pollution)
 */
export function safeJSONParse(json: any): any {
  if (typeof json !== 'string') return null
  try {
    const parsed = JSON.parse(json, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined
      return value
    })
    return parsed
  } catch {
    return null
  }
}

/**
 * 12) Validação de moeda
 */
export function validateCurrency(currency: any): Currency {
  const valid: readonly Currency[] = ['BRL', 'USD', 'EUR']
  return (valid as readonly string[]).includes(currency) ? (currency as Currency) : 'BRL'
}

/**
 * Sanitiza/valida URL para evitar javascript: e protocolos estranhos.
 */
export function sanitizeURL(url: any, fallback: string = ''): string {
  if (typeof url !== 'string') return fallback
  const raw = url.trim()

  try {
    // Permite relativa e absoluta
    const parsed = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')

    // Somente http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return fallback

    // Bloqueia javascript: já no começo, por segurança extra
    if (/^\s*javascript\s*:/i.test(raw)) return fallback

    return parsed.toString()
  } catch {
    return fallback
  }
}

/**
 * 13) Sanitização profunda (preserva Date e bloqueia prototype pollution)
 * - Útil para import/export, updates parciais e payloads vindos do storage.
 */
export function deepSanitize(obj: any, maxDepth: number = 5): any {
  if (maxDepth <= 0) return null

  // Preserva Date
  if (obj instanceof Date) return obj

  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepSanitize(item, maxDepth - 1))
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    if (value instanceof Date) {
      sanitized[key] = value
      continue
    }
    sanitized[key] = deepSanitize(value, maxDepth - 1)
  }

  return sanitized
}
