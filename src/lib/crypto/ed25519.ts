// Lógica de Segurança: Assinatura assimétrica de credenciais com Ed25519 (Zero Trust / Offline-First)
import nacl from 'tweetnacl';

// Chave mestra institucional de desenvolvimento / fallback (64 bytes hex = 32 seed + 32 pub)
// Em produção, deve ser provida via variável de ambiente privada ED25519_SECRET_KEY_HEX
const DEFAULT_SECRET_KEY_HEX =
  '7d59b20b2d69cf327c52086e4f3a0972c21966ec01004a0815eb079c6d4baee1' +
  '9e62f551c91c3d9a0d8c06eb7bf7f8d672957b77e2ff4099cf96b4dc4fb36f56';

// Chave pública correspondente (32 bytes hex) - distribuída com segurança para o PWA
export const INSTITUTIONAL_ED25519_PUBLIC_KEY_HEX =
  process.env.NEXT_PUBLIC_ED25519_PUBLIC_KEY_HEX ||
  '9e62f551c91c3d9a0d8c06eb7bf7f8d672957b77e2ff4099cf96b4dc4fb36f56';

function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface CredentialPayload {
  reg_id: string;
  event_id: string;
  name: string;
  cpf_masked: string;
  ts: number;
}

export interface SignedCredential {
  payload: CredentialPayload;
  signature: string; // Hex representation of 64-byte Ed25519 signature
}

/**
 * Assina os dados da credencial virtual no servidor com a chave privada institucional
 */
export function signCredential(payload: CredentialPayload): SignedCredential {
  const secretKeyHex = process.env.ED25519_SECRET_KEY_HEX || DEFAULT_SECRET_KEY_HEX;
  const secretKey = hexToUint8Array(secretKeyHex);
  
  // Canônica: JSON ordenado e determinístico
  const canonicalMessage = JSON.stringify({
    reg_id: payload.reg_id,
    event_id: payload.event_id,
    name: payload.name,
    cpf_masked: payload.cpf_masked,
    ts: payload.ts,
  });

  const messageBytes = new TextEncoder().encode(canonicalMessage);
  const signatureBytes = nacl.sign.detached(messageBytes, secretKey);
  const signatureHex = uint8ArrayToHex(signatureBytes);

  return {
    payload,
    signature: signatureHex,
  };
}

/**
 * Validação puramente matemática e ultrarrápida (<5ms) no navegador/PWA sem conexão de internet
 */
export function verifyCredential(
  signedCred: SignedCredential,
  publicKeyHex = INSTITUTIONAL_ED25519_PUBLIC_KEY_HEX
): { valid: boolean; payload?: CredentialPayload; reason?: string } {
  try {
    const { payload, signature } = signedCred;
    if (!payload || !signature) {
      return { valid: false, reason: 'Formato de credencial incompleto.' };
    }

    const canonicalMessage = JSON.stringify({
      reg_id: payload.reg_id,
      event_id: payload.event_id,
      name: payload.name,
      cpf_masked: payload.cpf_masked,
      ts: payload.ts,
    });

    const messageBytes = new TextEncoder().encode(canonicalMessage);
    const signatureBytes = hexToUint8Array(signature);
    const publicKeyBytes = hexToUint8Array(publicKeyHex);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isValid) {
      return { valid: false, reason: 'Assinatura digital inválida ou falsificada.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, reason: err?.message || 'Falha na verificação criptográfica.' };
  }
}
