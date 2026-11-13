export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TipoTrajeto = "Ida" | "Volta";

export type Usuario = {
  id: string;
  nome: string;
  orgao: string;
  telefone: string | null;
};

export type Carona = {
  id: string;
  motorista_id: string;
  tipo_trajeto: TipoTrajeto;
  bairro_origem: string;
  rota_principal: string;
  destino: string | null;
  data_carona: string;
  horario_saida: string;
  vagas: number;
  ativa: boolean;
  distancia_estimada_metros: number | null;
};

export type CaronaComMotorista = Carona & {
  usuarios: Pick<Usuario, "nome" | "orgao" | "telefone"> | null;
};

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: Usuario;
        Insert: Usuario;
        Update: Partial<Usuario>;
        Relationships: [];
      };
      caronas: {
        Row: Carona;
        Insert: Omit<Carona, "id" | "ativa" | "vagas" | "distancia_estimada_metros"> & {
          id?: string;
          ativa?: boolean;
          vagas?: number;
          distancia_estimada_metros?: number | null;
        };
        Update: Partial<Carona>;
        Relationships: [
          {
            foreignKeyName: "caronas_motorista_id_fkey";
            columns: ["motorista_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
