import type { MandateRole, UserRole, AcademicSystemType, EventStatus } from '@/types/database.types';

/**
 * Mapeamentos Institucionais O(1) para Rótulos Visuais
 * Elimina complexidade ciclomática e ternários em cascata no JSX.
 */
export const MANDATE_ROLE_LABELS: Record<MandateRole, string> = {
  coordenador_extensao: 'Coordenador de Extensão (NUPEX)',
  diretor_unidade: 'Diretor da Unidade Carangola',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  participante: 'Participante / Ouvinte',
  monitor: 'Monitor de Auditório',
  docente: 'Professor / Docente Proponente',
  admin_extensao: 'Coordenação de Extensão',
};

export const ACADEMIC_SYSTEM_LABELS: Record<AcademicSystemType, string> = {
  siga: 'SIGA (Sistema Integrado de Gestão Acadêmica)',
  suap: 'SUAP (Sistema Unificado de Administração Pública)',
  sigaa: 'SIGAA (Sistema Integrado de Gestão de Atividades Acadêmicas)',
  outro: 'Outro Sistema Institucional Homologado',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
  submetido: { label: 'Aguardando Homologação', color: 'bg-amber-100 text-amber-800' },
  aprovado: { label: 'Homologado', color: 'bg-emerald-100 text-emerald-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  encerrado: { label: 'Encerrado', color: 'bg-purple-100 text-purple-800' },
  rejeitado: { label: 'Retificação Necessária', color: 'bg-red-100 text-red-800' },
};
