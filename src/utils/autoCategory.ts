import { type Category } from '@/types/finance'

/**
 * Auto Category (IA simples por dicionário)
 * - Gera 100+ frases por categoria (por expansão), mantendo o arquivo sustentável.
 * - Normaliza acentos/pontuação para melhorar match.
 * - Score por quantidade de matches.
 */

type KeywordMap = Record<Category, string[]>

function normalizeText(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // remove pontuação (mantém letras/números/espaços)
    .replace(/\s+/g, ' ')
    .trim()
}

function uniq(list: string[]): string[] {
  return Array.from(new Set(list.map((x) => normalizeText(x)).filter(Boolean)))
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildMatchers(map: KeywordMap): Record<Category, RegExp[]> {
  const out = {} as Record<Category, RegExp[]>

  ;(Object.keys(map) as Category[]).forEach((cat) => {
    out[cat] = map[cat]
      .map((k) => normalizeText(k))
      .filter(Boolean)
      .map((k) => {
        const hasSpace = k.includes(' ')
        const pattern = hasSpace
          ? `(?:^|\\s)${escapeRegex(k)}(?:$|\\s)`
          : `\\b${escapeRegex(k)}\\b`
        return new RegExp(pattern, 'i')
      })
  })

  return out
}

function expandPhrases(base: string[], opts: {
  prefixes?: string[]
  suffixes?: string[]
  glueWords?: string[] // ex.: "de", "com", "do"
  minCount?: number
  maxCount?: number
}): string[] {
  const prefixes = opts.prefixes ?? []
  const suffixes = opts.suffixes ?? []
  const glueWords = opts.glueWords ?? ['de', 'com', 'do', 'da', 'para']
  const minCount = opts.minCount ?? 100
  const maxCount = opts.maxCount ?? 180

  const b = uniq(base)
  const p = uniq(prefixes)
  const s = uniq(suffixes)
  const g = uniq(glueWords)

  const out: string[] = []

  // 1) Base pura
  out.push(...b)

  // 2) Prefixo + base
  for (const pref of p) {
    for (const item of b) {
      out.push(`${pref} ${item}`)
    }
  }

  // 3) Prefixo + glue + base (ex: "compra de netflix", "pagamento de aluguel")
  for (const pref of p) {
    for (const glue of g) {
      for (const item of b) {
        out.push(`${pref} ${glue} ${item}`)
      }
    }
  }

  // 4) Base + sufixo (ex: "aluguel atrasado", "netflix mensal", "gasolina no cartao")
  for (const item of b) {
    for (const suf of s) {
      out.push(`${item} ${suf}`)
    }
  }

  // 5) Prefixo + base + sufixo (explosivo, então corta cedo)
  for (const pref of p) {
    for (const item of b) {
      for (const suf of s) {
        out.push(`${pref} ${item} ${suf}`)
        if (out.length > maxCount * 3) break
      }
      if (out.length > maxCount * 3) break
    }
    if (out.length > maxCount * 3) break
  }

  const final = uniq(out)

  // garante mínimo (se ainda faltar, adiciona variações genéricas)
  if (final.length < minCount) {
    const generic = ['gasto', 'compra', 'pagamento', 'assinatura', 'mensalidade', 'fatura', 'pix', 'boleto']
    for (const ge of generic) {
      for (const item of b) final.push(`${ge} ${item}`)
      if (final.length >= minCount) break
    }
  }

  return uniq(final).slice(0, maxCount)
}

/**
 * Dicionários BASE (compactos) + expansão => 100+ frases por categoria.
 * Dica: se quiser, dá para aumentar maxCount para 250 (impacta performance).
 */
const BASE: Record<Category, { base: string[]; prefixes: string[]; suffixes: string[] }> = {
  Alimentação: {
    base: [
      // restaurantes / delivery
      'ifood', 'rappi', 'uber eats', 'ubereats', 'aiqfome', 'delivery', 'entrega comida',
      'restaurante', 'lanchonete', 'pizzaria', 'hamburgueria', 'pastelaria', 'sorveteria',
      'padaria', 'cafeteria', 'coffee', 'cafe', 'lanche', 'almoco', 'jantar', 'comida',
      // mercado
      'mercado', 'supermercado', 'atacadao', 'assai', 'carrefour', 'extra', 'dia', 'bh', 'epa',
      'feira', 'hortifruti', 'acougue', 'peixaria', 'bebidas', 'agua', 'refrigerante',
      // itens comuns
      'pizza', 'hamburguer', 'burger', 'mcdonalds', 'subway', 'bk', 'kfc',
      'churrasco', 'sushi', 'japones', 'prato feito', 'marmita', 'quentinha',
      'doce', 'sobremesa', 'salgado', 'pao', 'leite', 'ovo', 'carne', 'frango',
    ],
    prefixes: [
      'compra', 'comprar', 'pedido', 'pagamento', 'gasto', 'gastei', 'fatura', 'pix', 'boleto',
      'refeicao', 'lanche', 'almoço', 'jantar', 'mercado', 'supermercado', 'delivery',
      'assinatura', 'combo', 'promo', 'desconto', 'cupom', 'taxa', 'frete',
    ],
    suffixes: [
      'no cartao', 'no credito', 'no debito', 'via pix', 'via boleto',
      'parcelado', 'a vista', 'com frete', 'sem frete',
      'hoje', 'ontem', 'semana', 'mensal', 'do mes',
    ],
  },

  Transporte: {
    base: [
      'uber', '99', 'taxi', 'cabify', 'corrida', 'carona',
      'onibus', 'metro', 'trem', 'transporte', 'passagem', 'bilhete',
      'gasolina', 'etanol', 'diesel', 'combustivel', 'posto', 'ipiranga', 'shell', 'br', 'ale',
      'estacionamento', 'zona azul', 'pedagio', 'lavagem', 'lava jato', 'manutencao carro',
      'oficina', 'mecanico', 'troca de oleo', 'pneu', 'alinhamento', 'balanceamento',
      'ipva', 'licenciamento', 'seguro carro', 'multa',
      'moto', 'uber moto', 'bicicleta', 'patinete',
      'corrida app', 'app transporte',
    ],
    prefixes: [
      'corrida', 'pagamento', 'gasto', 'despesa', 'combustivel', 'abastecimento',
      'estacionamento', 'pedagio', 'multa', 'oficina', 'manutencao', 'reparo',
      'taxa', 'tarifa', 'pix', 'boleto', 'fatura', 'cartao',
    ],
    suffixes: [
      'no cartao', 'no credito', 'via pix', 'parcelado', 'do mes',
      'ida', 'volta', 'trabalho', 'casa', 'viagem',
      'mensal', 'semanal', 'hoje',
    ],
  },

  Moradia: {
    base: [
      'aluguel', 'condominio', 'iptu', 'energia', 'luz', 'agua', 'gas',
      'internet', 'wifi', 'telefone', 'celular', 'tv a cabo', 'tv cabo',
      'reforma', 'obra', 'pintura', 'conserto', 'manutencao',
      'eletricista', 'encanador', 'pedreiro', 'marceneiro', 'chaveiro',
      'material de construcao', 'cimento', 'tinta', 'ferramenta',
      'moveis', 'sofa', 'cama', 'colchao', 'armario', 'geladeira', 'fogao', 'microondas',
      'ventilador', 'ar condicionado',
      'imobiliaria', 'mudanca', 'frete mudanca',
      'limpeza', 'diarista', 'faxina',
    ],
    prefixes: [
      'pagamento', 'gasto', 'despesa', 'conta', 'boleto', 'pix', 'fatura',
      'mensalidade', 'assinatura', 'taxa', 'tarifa',
      'reforma', 'conserto', 'manutencao', 'compra', 'compra de',
    ],
    suffixes: [
      'do mes', 'atrasado', 'adiantado', 'mensal', 'anual',
      'no cartao', 'via pix', 'via boleto',
      'parcela', 'parcelado',
    ],
  },

  Saúde: {
    base: [
      'farmacia', 'drogaria', 'remedio', 'medicamento', 'vitamina', 'suplemento',
      'consulta', 'medico', 'clinica', 'hospital', 'exame', 'laboratorio',
      'dentista', 'ortodontista', 'oculos', 'lente', 'oftalmo',
      'plano de saude', 'convenio', 'unimed', 'amil', 'bradesco saude', 'sulamerica',
      'psicologo', 'terapia', 'psi', 'nutricionista',
      'academia', 'gym', 'personal', 'pilates', 'crossfit', 'fisioterapia',
      'vacina', 'vacinação', 'emergencia', 'pronto socorro',
      'cirurgia', 'tratamento',
    ],
    prefixes: [
      'consulta', 'pagamento', 'gasto', 'despesa', 'exame', 'farmacia',
      'plano', 'mensalidade', 'assinatura', 'coparticipacao',
      'pix', 'boleto', 'fatura', 'cartao',
    ],
    suffixes: [
      'no cartao', 'no credito', 'via pix', 'parcelado',
      'mensal', 'do mes', 'retorno', 'urgencia',
    ],
  },

  Educação: {
    base: [
      'escola', 'faculdade', 'universidade', 'curso', 'aula', 'mensalidade',
      'material escolar', 'caderno', 'caneta', 'mochila', 'uniforme',
      'livro', 'livraria', 'apostila',
      'udemy', 'coursera', 'alura', 'rocketseat', 'dio', 'origamid',
      'ingles', 'espanhol', 'idiomas', 'language', 'certificado',
      'enem', 'vestibular', 'prova', 'taxa de prova',
      'transporte escolar', 'cantina',
      'pos graduacao', 'mba', 'especializacao',
      'workshop', 'treinamento', 'mentoria',
    ],
    prefixes: [
      'pagamento', 'gasto', 'despesa', 'mensalidade', 'matricula',
      'compra', 'compra de', 'assinatura', 'fatura', 'pix', 'boleto',
      'curso', 'aula', 'material', 'livro',
    ],
    suffixes: [
      'do mes', 'mensal', 'anual', 'parcela', 'parcelado',
      'no cartao', 'via pix', 'via boleto',
      'online', 'presencial',
    ],
  },

  Lazer: {
    base: [
      'netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'disney+', 'hbo', 'max',
      'youtube premium', 'deezer', 'apple music',
      'cinema', 'teatro', 'show', 'evento', 'ingresso', 'ticket',
      'viagem', 'hotel', 'airbnb', 'pousada', 'passagem aerea',
      'steam', 'playstation', 'psn', 'xbox', 'game pass', 'nintendo', 'epic games',
      'jogo', 'games', 'streaming', 'assinatura streaming',
      'bar', 'restaurante lazer', 'balada', 'festa',
      'parque', 'passeio', 'tour', 'lazer',
    ],
    prefixes: [
      'assinatura', 'mensalidade', 'pagamento', 'gasto', 'despesa',
      'ingresso', 'ticket', 'compra', 'comprar', 'reserva',
      'pix', 'boleto', 'fatura', 'cartao',
      'viagem', 'hotel', 'passeio',
    ],
    suffixes: [
      'mensal', 'do mes', 'anual', 'no cartao', 'via pix', 'parcelado',
      'familia', 'individual', 'premium', 'plano', 'renovacao',
    ],
  },

  Vestuário: {
    base: [
      'roupa', 'roupas', 'vestuario', 'moda',
      'camisa', 'camiseta', 'blusa', 'moletom', 'jaqueta', 'casaco',
      'calca', 'bermuda', 'shorts', 'saia', 'vestido',
      'tenis', 'sapato', 'bota', 'sandalia', 'chinelo',
      'calcado', 'acessorio', 'acessorios', 'cinto', 'bolsa', 'carteira',
      'relogio', 'oculos', 'perfume', 'maquiagem',
      'renner', 'cea', 'c&a', 'riachuelo', 'zara', 'shein', 'nike', 'adidas',
      'outlet', 'loja de roupa',
    ],
    prefixes: [
      'compra', 'comprar', 'gasto', 'pagamento', 'fatura', 'pix', 'boleto', 'cartao',
      'pedido', 'frete', 'troca', 'loja', 'promo', 'desconto', 'black friday',
      'parcela', 'parcelado',
    ],
    suffixes: [
      'no cartao', 'no credito', 'via pix', 'parcelado', 'a vista',
      'do mes', 'promocao', 'outlet', 'frete', 'entrega',
    ],
  },

  Contas: {
    base: [
      'boleto', 'fatura', 'cartao', 'credito', 'debito', 'conta', 'pagamento',
      'parcela', 'parcelado', 'juros', 'multa', 'taxa', 'tarifa',
      'assinatura', 'mensalidade', 'anuidade', 'servico',
      'pix', 'transferencia', 'ted', 'doc',
      'banco', 'nubank', 'itau', 'bradesco', 'santander', 'caixa', 'bb', 'inter',
      'taxa bancaria', 'tarifa bancaria',
      'internet (conta)', 'telefone (conta)', 'luz (conta)', 'agua (conta)',
      'seguro', 'garantia estendida',
    ],
    prefixes: [
      'pagamento', 'paguei', 'gasto', 'despesa', 'fatura', 'boleto',
      'pix', 'transferencia', 'debito automatico',
      'taxa', 'tarifa', 'multa', 'juros',
      'parcela', 'parcelado',
    ],
    suffixes: [
      'do mes', 'atrasado', 'vencimento', 'vencida', 'renovacao',
      'no cartao', 'via pix', 'via boleto',
      'em aberto', 'pago',
    ],
  },

  Investimentos: {
    base: [
      'investimento', 'aplicacao', 'apliquei', 'aporte', 'poupanca',
      'acoes', 'acao', 'fii', 'fundos', 'fundo', 'etf',
      'tesouro direto', 'tesouro', 'selic', 'ipca', 'prefixado',
      'renda fixa', 'cdb', 'lci', 'lca', 'debenture',
      'cripto', 'bitcoin', 'ethereum', 'solana', 'usdt', 'bnb',
      'corretora', 'xp', 'rico', 'clear', 'nuinvest', 'inter investimentos',
      'dividendo', 'rendimentos', 'juros compostos',
      'resgate', 'rentabilidade',
    ],
    prefixes: [
      'aporte', 'aplicar', 'aplicacao', 'investi', 'investimento',
      'compra', 'venda', 'resgate', 'pagamento', 'transferencia',
      'pix', 'boleto', 'deposito',
    ],
    suffixes: [
      'mensal', 'do mes', 'anual', 'longo prazo',
      'renda fixa', 'renda variavel', 'cripto',
      'no app', 'na corretora',
    ],
  },

  Outros: { base: [], prefixes: [], suffixes: [] },
}

function buildKeywordMap(): KeywordMap {
  const map = {} as KeywordMap

  ;(Object.keys(BASE) as Category[]).forEach((cat) => {
    if (cat === 'Outros') {
      map[cat] = []
      return
    }
    const def = BASE[cat]
    map[cat] = expandPhrases(def.base, {
      prefixes: def.prefixes,
      suffixes: def.suffixes,
      minCount: 120, // meta: 120+ por categoria
      maxCount: 180, // controla performance
    })
  })

  map.Outros = []
  return map
}

// Keyword map “final” (100+ frases por categoria)
let categoryKeywords: KeywordMap = buildKeywordMap()
let matchers = buildMatchers(categoryKeywords)

export function suggestCategory(description: string): Category {
  const text = normalizeText(description)
  if (!text || text.length < 3) return 'Outros'

  let best: Category = 'Outros'
  let bestScore = 0

  ;(Object.keys(matchers) as Category[]).forEach((cat) => {
    if (cat === 'Outros') return

    let score = 0
    for (const rx of matchers[cat]) {
      if (rx.test(text)) score += 1
    }

    if (score > bestScore) {
      bestScore = score
      best = cat
    }
  })

  return bestScore > 0 ? best : 'Outros'
}

/**
 * Se quiser usar no UI: mostrar 2-3 sugestões ao usuário.
 */
export function getCategorySuggestions(description: string, limit: number = 3): Category[] {
  const text = normalizeText(description)
  if (!text || text.length < 3) return []

  const scored: { cat: Category; score: number }[] = []

  ;(Object.keys(matchers) as Category[]).forEach((cat) => {
    if (cat === 'Outros') return
    let score = 0
    for (const rx of matchers[cat]) if (rx.test(text)) score += 1
    if (score > 0) scored.push({ cat, score })
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, Math.max(1, limit)).map((x) => x.cat)
}

/**
 * Permite adicionar frase customizada em runtime (não persistente por padrão).
 * (Se quiser persistir, dá pra salvar no localStorage e reconstruir matchers ao carregar.)
 */
export function addCustomKeyword(category: Category, keyword: string) {
  const clean = normalizeText(keyword)
  if (!clean || category === 'Outros') return

  const current = categoryKeywords[category] ?? []
  const next = uniq([...current, clean])

  categoryKeywords = { ...categoryKeywords, [category]: next }
  matchers = buildMatchers(categoryKeywords)
}

/**
 * Opcional: retorna pontuações (debug).
 */
export function debugCategoryScores(description: string): Record<string, number> {
  const text = normalizeText(description)
  const scores: Record<string, number> = {}

  ;(Object.keys(matchers) as Category[]).forEach((cat) => {
    let score = 0
    for (const rx of matchers[cat]) if (rx.test(text)) score += 1
    scores[cat] = score
  })

  return scores
}
