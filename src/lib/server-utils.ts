import { headers } from 'next/headers';
import { calculateSHA256 } from '@/lib/crypto';

/**
 * Obtém com segurança o endereço IP do cliente solicitante a partir dos headers de requisição.
 */
export function getClientIp(): string {
  const headerStore = headers();
  const forwarded = headerStore.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  return headerStore.get('x-real-ip') || '127.0.0.1';
}

export type PdfValidationResult =
  | { ok: true; buffer: Buffer; sha256: string }
  | { ok: false; error: string };

/**
 * Validação rigorosa de arquivos PDF institucionais (The Hard Box):
 * 1. Presença e tamanho mínimo
 * 2. MIME type estrito (application/pdf)
 * 3. Limite de tamanho (default 10 MB)
 * 4. Magic Bytes autênticos (%PDF-)
 * 5. Checksum SHA-256 para Fé Pública e Imutabilidade
 */
export async function validateAndHashPdf(
  file: File | null,
  maxSizeBytes = 10 * 1024 * 1024
): Promise<PdfValidationResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: 'O anexo do Espelho Oficial de Aprovação em PDF é obrigatório.' };
  }

  if (file.type !== 'application/pdf') {
    return { ok: false, error: 'Formato inválido. O comprovante deve ser estritamente um arquivo PDF.' };
  }

  if (file.size > maxSizeBytes) {
    return { ok: false, error: `O arquivo PDF não pode ultrapassar o limite de ${Math.round(maxSizeBytes / (1024 * 1024))} MB.` };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validação dos Magic Bytes (%PDF-)
  if (!buffer.subarray(0, 5).toString('utf-8').startsWith('%PDF-')) {
    return { ok: false, error: 'Arquivo inválido ou corrompido: não é um documento PDF autêntico.' };
  }

  const sha256 = calculateSHA256(buffer);
  return { ok: true, buffer, sha256 };
}
