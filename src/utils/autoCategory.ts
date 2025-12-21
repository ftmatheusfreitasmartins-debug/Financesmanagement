import { Category, CATEGORIES } from '@/types/finance'

// Dicionário de palavras-chave por categoria
const categoryKeywords: Record<Category, string[]> = {
  'Alimentação': [
    'ifood', 'rappi', 'uber eats', 'mercado', 'supermercado', 'padaria', 
    'restaurante', 'lanche', 'pizza', 'burguer', 'mcdonalds', 'subway',
    'açougue', 'feira', 'hortifruti', 'bakery', 'food', 'comida'
  ],
  'Transporte': [
    'uber', 'taxi', '99', 'gasolina', 'combustível', 'estacionamento',
    'pedágio', 'ônibus', 'metrô', 'transporte', 'posto', 'shell', 'ipiranga'
  ],
  'Moradia': [
    'aluguel', 'condomínio', 'iptu', 'energia', 'água', 'luz', 'gás',
    'internet', 'telefone', 'celular', 'reforma', 'manutenção', 'imobiliária'
  ],
  'Saúde': [
    'farmácia', 'drogaria', 'médico', 'consulta', 'dentista', 'hospital',
    'clínica', 'exame', 'plano de saúde', 'remédio', 'medicamento', 'academia',
    'gym', 'fisioterapia', 'terapia'
  ],
  'Educação': [
    'escola', 'faculdade', 'curso', 'livro', 'livraria', 'material escolar',
    'mensalidade', 'udemy', 'coursera', 'alura', 'rocketseat', 'estudos'
  ],
  'Lazer': [
    'cinema', 'teatro', 'show', 'ingresso', 'netflix', 'spotify', 'amazon prime',
    'disney', 'hbo', 'jogo', 'steam', 'playstation', 'xbox', 'viagem', 'hotel',
    'diversão', 'parque', 'evento'
  ],
  'Vestuário': [
    'roupa', 'sapato', 'tênis', 'calça', 'camisa', 'loja', 'zara', 'renner',
    'c&a', 'nike', 'adidas', 'moda', 'acessório', 'perfume'
  ],
  'Contas': [
    'boleto', 'fatura', 'cartão', 'crédito', 'débito', 'conta', 'pagamento',
    'parcela', 'mensalidade', 'assinatura', 'serviço'
  ],
  'Investimentos': [
    'investimento', 'aplicação', 'poupança', 'ação', 'fundo', 'tesouro',
    'renda fixa', 'cdb', 'lci', 'lca', 'cripto', 'bitcoin', 'corretora'
  ],
  'Outros': []
}

export function suggestCategory(description: string): Category {
  const normalizedDesc = description.toLowerCase().trim()
  
  // Procura por cada categoria
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalizedDesc.includes(keyword)) {
        return category as Category
      }
    }
  }
  
  // Se não encontrou, retorna "Outros"
  return 'Outros'
}

// Função para adicionar keywords customizadas
export function addCustomKeyword(category: Category, keyword: string) {
  const normalizedKeyword = keyword.toLowerCase().trim()
  if (!categoryKeywords[category].includes(normalizedKeyword)) {
    categoryKeywords[category].push(normalizedKeyword)
  }
}
