// Dados do tenant fixo usado pelo E2E (semeado por scripts/e2e-seed.ts, lido pelos specs em tests/e2e/).
// Módulo sem efeito colateral de propósito — importá-lo nunca deve rodar o seed.
export const E2E_SUBDOMAIN = 'e2e'
export const E2E_EMAIL = 'e2e-tenant@beautly.test'
export const E2E_PASSWORD = 'senha-e2e-teste-123'
export const E2E_BUSINESS_NAME = 'Studio E2E'
export const E2E_ACTIVE_SERVICE_NAMES = ['Corte + escova', 'Manicure'] as const
export const E2E_INACTIVE_SERVICE_NAME = 'Design de sobrancelha (inativo)'
export const E2E_APPOINTMENT_CLIENT_NAME = 'Maria Teste E2E'
export const E2E_APPOINTMENT_CLIENT_PHONE = '11987654321'
