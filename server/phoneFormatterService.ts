/**
 * Phone Formatter Service
 * 
 * Formata e valida telefones para Evolution API
 * Evolution API espera: 5511999999999 (país + DDD + número)
 */

/**
 * Formata telefone para padrão Evolution API
 * Entrada: (11) 99999-9999, 11 99999-9999, 11999999999, etc
 * Saída: 5511999999999
 */
export function formatPhoneForEvolution(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remover todos os caracteres que não são dígitos
  const cleaned = phone.replace(/\D/g, '');

  // Se não tiver dígitos, retornar null
  if (!cleaned) return null;

  // Se já tem 13 dígitos (55 + 11 + 9 dígitos), retornar como está
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return cleaned;
  }

  // Se tem 11 dígitos (11 + 9 dígitos), adicionar código do país
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }

  // Se tem 10 dígitos (DDD + 8 dígitos), adicionar código do país
  if (cleaned.length === 10) {
    return `55${cleaned}`;
  }

  // Se tem 9 dígitos, adicionar DDD padrão (11) e código do país
  if (cleaned.length === 9) {
    return `5511${cleaned}`;
  }

  // Caso não se encaixe em nenhum padrão
  console.warn(`[PhoneFormatter] ⚠️  Telefone com formato desconhecido: ${phone} (${cleaned.length} dígitos)`);
  return null;
}

/**
 * Valida se telefone está em formato correto para Evolution API
 */
export function isValidPhoneForEvolution(phone: string | null | undefined): boolean {
  if (!phone) return false;

  const formatted = formatPhoneForEvolution(phone);
  if (!formatted) return false;

  // Deve ter exatamente 13 dígitos e começar com 55
  return formatted.length === 13 && formatted.startsWith('55');
}

/**
 * Formata lista de telefones
 */
export function formatPhoneList(phones: (string | null | undefined)[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  phones.forEach((phone) => {
    const formatted = formatPhoneForEvolution(phone);
    if (formatted && isValidPhoneForEvolution(formatted)) {
      valid.push(formatted);
    } else {
      invalid.push(phone || 'VAZIO');
    }
  });

  return { valid, invalid };
}

/**
 * Log de formatação com detalhes
 */
export function logPhoneFormatting(
  patientName: string,
  originalPhone: string | null | undefined,
  formattedPhone: string | null
): void {
  if (formattedPhone) {
    console.log(
      `[PhoneFormatter] ✅ ${patientName}: ${originalPhone} → ${formattedPhone}`
    );
  } else {
    console.error(
      `[PhoneFormatter] ❌ ${patientName}: ${originalPhone} (INVÁLIDO)`
    );
  }
}

/**
 * Exemplo de uso:
 * 
 * const phone = "(11) 99999-9999";
 * const formatted = formatPhoneForEvolution(phone);
 * console.log(formatted); // 5511999999999
 * 
 * const isValid = isValidPhoneForEvolution(formatted);
 * console.log(isValid); // true
 */
