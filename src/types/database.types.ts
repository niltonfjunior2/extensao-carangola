export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'participante' | 'monitor' | 'docente' | 'admin_extensao';
export type EventStatus = 'rascunho' | 'submetido' | 'aprovado' | 'em_andamento' | 'encerrado' | 'rejeitado';
export type ModalityType = 'presencial' | 'remoto' | 'hibrido';
export type MandateRole = 'coordenador_extensao' | 'diretor_unidade';
export type AcademicSystemType = 'siga' | 'suap' | 'sigaa' | 'outro';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          cpf: string;
          full_name: string;
          email: string;
          masp: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          cpf: string;
          full_name: string;
          email: string;
          masp?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cpf?: string;
          full_name?: string;
          email?: string;
          masp?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mandates: {
        Row: {
          id: string;
          role: MandateRole;
          authority_name: string;
          masp: string;
          official_act: string;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role: MandateRole;
          authority_name: string;
          masp: string;
          official_act: string;
          start_date: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: MandateRole;
          authority_name?: string;
          masp?: string;
          official_act?: string;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          siga_id: string;
          registry_system: AcademicSystemType;
          external_registry_id: string;
          title: string;
          description: string | null;
          modality: ModalityType;
          location: string | null;
          workload_hours: number;
          status: EventStatus;
          coordinator_id: string | null;
          siga_mirror_pdf_url: string | null;
          siga_mirror_sha256: string | null;
          external_mirror_pdf_url: string | null;
          external_mirror_sha256: string | null;
          legal_responsibility_accepted: boolean;
          legal_accepted_at: string | null;
          legal_accepted_ip: string | null;
          sei_process_number: string | null;
          sei_document_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          siga_id?: string;
          registry_system?: AcademicSystemType;
          external_registry_id: string;
          title: string;
          description?: string | null;
          modality?: ModalityType;
          location?: string | null;
          workload_hours?: number;
          status?: EventStatus;
          coordinator_id?: string | null;
          siga_mirror_pdf_url?: string | null;
          siga_mirror_sha256?: string | null;
          external_mirror_pdf_url?: string | null;
          external_mirror_sha256?: string | null;
          legal_responsibility_accepted?: boolean;
          legal_accepted_at?: string | null;
          legal_accepted_ip?: string | null;
          sei_process_number?: string | null;
          sei_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          siga_id?: string;
          registry_system?: AcademicSystemType;
          external_registry_id?: string;
          title?: string;
          description?: string | null;
          modality?: ModalityType;
          location?: string | null;
          workload_hours?: number;
          status?: EventStatus;
          coordinator_id?: string | null;
          siga_mirror_pdf_url?: string | null;
          siga_mirror_sha256?: string | null;
          external_mirror_pdf_url?: string | null;
          external_mirror_sha256?: string | null;
          legal_responsibility_accepted?: boolean;
          legal_accepted_at?: string | null;
          legal_accepted_ip?: string | null;
          sei_process_number?: string | null;
          sei_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_sessions: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          start_time: string;
          end_time: string;
          workload_session_hours: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          start_time: string;
          end_time: string;
          workload_session_hours?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          start_time?: string;
          end_time?: string;
          workload_session_hours?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          profile_id: string | null;
          participant_name: string;
          participant_email: string;
          participant_cpf: string;
          attended: boolean;
          checkin_at: string | null;
          synced_by_monitor_id: string | null;
          audit_trail: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          profile_id?: string | null;
          participant_name: string;
          participant_email: string;
          participant_cpf: string;
          attended?: boolean;
          checkin_at?: string | null;
          synced_by_monitor_id?: string | null;
          audit_trail?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          profile_id?: string | null;
          participant_name?: string;
          participant_email?: string;
          participant_cpf?: string;
          attended?: boolean;
          checkin_at?: string | null;
          synced_by_monitor_id?: string | null;
          audit_trail?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          registration_id: string;
          event_id: string;
          validation_code: string;
          sha256_hash: string;
          mandate_snapshot: Json;
          issued_at: string;
          is_revoked: boolean;
          revocation_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          event_id: string;
          validation_code: string;
          sha256_hash: string;
          mandate_snapshot: Json;
          issued_at?: string;
          is_revoked?: boolean;
          revocation_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          event_id?: string;
          validation_code?: string;
          sha256_hash?: string;
          mandate_snapshot?: Json;
          issued_at?: string;
          is_revoked?: boolean;
          revocation_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      event_audit_logs: {
        Row: {
          id: string;
          event_id: string;
          auditor_id: string;
          previous_status: EventStatus;
          new_status: EventStatus;
          justification: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          auditor_id: string;
          previous_status: EventStatus;
          new_status: EventStatus;
          justification?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          auditor_id?: string;
          previous_status?: EventStatus;
          new_status?: EventStatus;
          justification?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      keepalive: {
        Row: {
          id: number;
          last_ping: string;
          ping_count: number;
          source: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          last_ping?: string;
          ping_count?: number;
          source?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          last_ping?: string;
          ping_count?: number;
          source?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      event_status: EventStatus;
      modality_type: ModalityType;
      mandate_role: MandateRole;
      academic_system_type: AcademicSystemType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Mandate = Tables<'mandates'>;
export type Profile = Tables<'profiles'>;
export type Event = Tables<'events'>;
export type Registration = Tables<'registrations'>;
export type EventSession = Tables<'event_sessions'>;
export type Certificate = Tables<'certificates'>;
