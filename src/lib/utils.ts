import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mascaramento de CPF em conformidade com a LGPD (Lei 13.709/2018)
 * Exemplo: 123.456.789-00 -> ***.456.789-**
 */
export function maskCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return "***.***.***-**";
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
}
/**
 * Validação rigorosa dos dígitos verificadores de CPF
 */
export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Aplica máscara de digitação de CPF (000.000.000-00)
 */
export function formatCPF(raw: string): string {
  const clean = raw.replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}
/**
 * Mascaramento de e-mail em conformidade com a LGPD
 * Exemplo: usuario@uemg.br -> u***o@uemg.br
 */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "*****@***.***";
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * Formatação Determinística de Datas (DD/MM/AAAA)
 * Previne Hydration Mismatch forçando UTC determinístico sem dependência de fuso local do navegador.
 */
export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Data não informada";

  // Se a data já for no formato ISO YYYY-MM-DD
  const parts = dateStr.split("T")[0]?.split("-");
  if (parts && parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Sanitiza e formata o MASP institucional do Estado de Minas Gerais
 * Exemplo: 12345678 -> 1.234.567-8
 */
export function formatMASP(rawMasp: string): string {
  const clean = rawMasp.replace(/[^\d\w]/g, "");
  if (clean.length === 8) {
    return `${clean.slice(0, 1)}.${clean.slice(1, 4)}.${clean.slice(4, 7)}-${clean.slice(7)}`;
  }
  return rawMasp.trim();
}

/**
 * Sanitiza e traduz erros do PostgreSQL/PostgREST em mensagens amigáveis em português
 * Previne vazamento de nomes de tabelas, constraints e esquemas de dados.
 */
export function sanitizeDatabaseError(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "Ocorreu uma falha inesperada. Por favor, tente novamente.";
  }

  const errObj = err as Record<string, any>;
  const code = errObj.code || "";
  const message = errObj.message || "";

  // 1. Violação de Unicidade (ex: registro duplicado, código externo já existente)
  if (code === "23505" || message.includes("duplicate key")) {
    if (message.includes("unique_event_participant_cpf")) {
      return "Este CPF já está inscrito nesta ação extensionista.";
    }
    if (message.includes("external_registry_id")) {
      return "Já existe uma ação extensionista cadastrada com este código no sistema institucional selecionado.";
    }
    return "Já existe um registro com estes mesmos dados no sistema.";
  }

  // 2. Violação de Integridade Referencial (Foreign Key)
  if (code === "23503" || message.includes("foreign key")) {
    return "Operação inválida: a entidade vinculada não foi encontrada ou foi removida.";
  }

  // 3. Violação de Trigger ou Constraint Customizada do Hard Box
  if (message.includes("Violacao do Cordao Umbilical")) {
    return "Ação bloqueada: A proposta não possui código de registro institucional válido.";
  }
  if (message.includes("Violacao de Seguranca")) {
    return "Operação não permitida pelo protocolo de conformidade institucional.";
  }
  if (message.includes("Violacao de Imutabilidade")) {
    return "Violação de fé pública: Certidões expedidas possuem histórico imutável.";
  }

  // 4. Erros de RLS ou Autenticação
  if (code === "42501" || message.includes("permission denied") || message.includes("row-level security")) {
    return "Acesso negado: Você não possui privilégios para executar esta operação.";
  }

  return "Não foi possível concluir a operação devido a uma instabilidade no servidor. Tente novamente em instantes.";
}

/**
 * Resolução Monotônica Temporal (Princípio CRDT / LEAST):
 * Garante que a primeira entrada registrada prevaleça em reconciliações concorrentes.
 */
export function resolveEarliestTimestamp(
  existingTimestamp: string | null | undefined,
  incomingTimestamp: string
): string {
  if (!existingTimestamp) return incomingTimestamp;
  const tExisting = new Date(existingTimestamp).getTime();
  const tIncoming = new Date(incomingTimestamp).getTime();
  if (isNaN(tExisting)) return incomingTimestamp;
  if (isNaN(tIncoming)) return existingTimestamp;
  return tExisting < tIncoming ? existingTimestamp : incomingTimestamp;
}


