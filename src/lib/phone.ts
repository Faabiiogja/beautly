/**
 * Normaliza um telefone para apenas dígitos, garantindo uma identidade única
 * por cliente (regra 18.3): "(11) 99999-8888" e "11999998888" são a mesma pessoa.
 * Aceita 10–13 dígitos (DDD + número, com ou sem 55).
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  return digits;
}

/** Link de conversa no WhatsApp; assume Brasil quando vem sem código do país. */
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

/** Exibição amigável: (11) 99999-8888 quando possível. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}
