export interface OtpSender {
  /** Envia o código OTP para o telefone informado. */
  send(phone: string, code: string): Promise<void>;
}
