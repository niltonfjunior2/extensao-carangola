import { createHash } from 'crypto';

/**
 * Calcula o hash SHA-256 de um buffer em formato hexadecimal minúsculo.
 * Usado para carimbos de integridade de comprovantes e certidões sob demanda.
 */
export function calculateSHA256(buffer: Buffer | ArrayBuffer): string {
  const hash = createHash('sha256');
  if (buffer instanceof ArrayBuffer) {
    hash.update(Buffer.from(buffer));
  } else {
    hash.update(buffer);
  }
  return hash.digest('hex');
}
