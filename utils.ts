/**
 * Formata números de telefone para o padrão visual (ex: +55 (11) 99999-9999)
 */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '';
  
  // Remove tudo que não é dígito
  const cleaned = phone.replace(/\D/g, '');

  // Verifica se é um número brasileiro padrão (55 + DDD + 8 ou 9 dígitos)
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    const ddd = cleaned.substring(2, 4);
    const isNineDigit = cleaned.length === 13;
    
    if (isNineDigit) {
        // +55 (XX) XXXXX-XXXX
        const part1 = cleaned.substring(4, 9);
        const part2 = cleaned.substring(9);
        return `+55 (${ddd}) ${part1}-${part2}`;
    } else {
        // +55 (XX) XXXX-XXXX (Fixo ou antigo)
        const part1 = cleaned.substring(4, 8);
        const part2 = cleaned.substring(8);
        return `+55 (${ddd}) ${part1}-${part2}`;
    }
  }

  // Se não bater com o padrão (ex: número internacional sem 55 ou curto), retorna original
  return phone;
};