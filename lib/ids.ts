const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Ids vindos de formulário são validados antes de ir para qualquer query.
export const isUuid = (value: string): boolean => UUID.test(value)
