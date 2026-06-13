export interface FileStorage {
  /**
   * Persiste o arquivo sob `key` e devolve a URL pública para acessá-lo.
   */
  save(key: string, data: Buffer, contentType: string): Promise<string>;
}
