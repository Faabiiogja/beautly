interface WhatsAppProvider {
  sendBookingConfirmation(
    phone: string,
    bookingUrl: string,
    tenantName: string,
    serviceName: string,
    startsAt: string
  ): Promise<void>
}

class MockWhatsAppProvider implements WhatsAppProvider {
  async sendBookingConfirmation(
    phone: string,
    bookingUrl: string,
    tenantName: string,
    serviceName: string,
    startsAt: string
  ): Promise<void> {
    console.log('[WhatsApp MOCK] -------------------------')
    console.log(`  Para:    ${phone}`)
    console.log(`  Salao:   ${tenantName}`)
    console.log(`  Servico: ${serviceName}`)
    console.log(`  Horario: ${startsAt}`)
    console.log(`  Link:    ${bookingUrl}`)
    console.log('[WhatsApp MOCK] -------------------------')
  }
}

class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  async sendBookingConfirmation(): Promise<void> {
    throw new Error('Meta Cloud API not implemented yet')
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.WHATSAPP_MOCK === 'true'
  ) {
    return new MockWhatsAppProvider()
  }

  return new MetaCloudWhatsAppProvider()
}
