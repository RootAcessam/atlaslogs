export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      lojistas: {
        Row: {
          id: string
          nome_fantasia: string
          nome_contato: string | null
          email: string
          telefone: string
          cnpj: string | null
          comissao_percentual: number
          endereco_completo: string | null
          observacoes: string | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome_fantasia: string
          nome_contato?: string | null
          email: string
          telefone: string
          cnpj?: string | null
          comissao_percentual?: number
          endereco_completo?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome_fantasia?: string
          nome_contato?: string | null
          email?: string
          telefone?: string
          cnpj?: string | null
          comissao_percentual?: number
          endereco_completo?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
        }
      }
      produtos_estoque: {
        Row: {
          id: number
          lojista_id: string
          nome: string
          sku: string
          categoria: string | null
          descricao: string | null
          peso_gramas: number | null
          imagem_url: string | null
          quantidade_atual: number
          quantidade_minima: number
          localizacao: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          lojista_id: string
          nome: string
          sku: string
          categoria?: string | null
          descricao?: string | null
          peso_gramas?: number | null
          imagem_url?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          localizacao?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          lojista_id?: string
          nome?: string
          sku?: string
          categoria?: string | null
          descricao?: string | null
          peso_gramas?: number | null
          imagem_url?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          localizacao?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      movimentacoes_estoque: {
        Row: {
          id: number
          produto_id: number | null
          tipo: string
          quantidade: number
          motivo: string | null
          pedido_id: number | null
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: number
          produto_id?: number | null
          tipo: string
          quantidade: number
          motivo?: string | null
          pedido_id?: number | null
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          produto_id?: number | null
          tipo?: string
          quantidade?: number
          motivo?: string | null
          pedido_id?: number | null
          observacao?: string | null
          created_at?: string
        }
      }
      pedidos: {
        Row: {
          id: number
          lojista_id: string
          numero_pedido_externo: string | null
          marketplace_origem: string
          status: string
          dados_cliente: Json
          total_pedido: number
          comissao_calculada: number | null
          data_criacao: string
          data_separacao: string | null
          data_embalagem: string | null
          data_envio: string | null
          codigo_rastreio: string | null
          transportadora: string | null
        }
        Insert: {
          id?: number
          lojista_id: string
          numero_pedido_externo?: string | null
          marketplace_origem: string
          status?: string
          dados_cliente: Json
          total_pedido: number
          comissao_calculada?: number | null
          data_criacao?: string
          data_separacao?: string | null
          data_embalagem?: string | null
          data_envio?: string | null
          codigo_rastreio?: string | null
          transportadora?: string | null
        }
        Update: {
          id?: number
          lojista_id?: string
          numero_pedido_externo?: string | null
          marketplace_origem?: string
          status?: string
          dados_cliente?: Json
          total_pedido?: number
          comissao_calculada?: number | null
          data_criacao?: string
          data_separacao?: string | null
          data_embalagem?: string | null
          data_envio?: string | null
          codigo_rastreio?: string | null
          transportadora?: string | null
        }
      }
      itens_pedido: {
        Row: {
          id: number
          pedido_id: number | null
          produto_id: number | null
          quantidade: number
          preco_unitario: number
        }
        Insert: {
          id?: number
          pedido_id?: number | null
          produto_id?: number | null
          quantidade: number
          preco_unitario: number
        }
        Update: {
          id?: number
          pedido_id?: number | null
          produto_id?: number | null
          quantidade?: number
          preco_unitario?: number
        }
      }
      historico_pedido: {
        Row: {
          id: number
          pedido_id: number | null
          status_anterior: string | null
          status_novo: string
          observacao: string | null
          responsavel: string | null
          created_at: string
        }
        Insert: {
          id?: number
          pedido_id?: number | null
          status_anterior?: string | null
          status_novo: string
          observacao?: string | null
          responsavel?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          pedido_id?: number | null
          status_anterior?: string | null
          status_novo?: string
          observacao?: string | null
          responsavel?: string | null
          created_at?: string
        }
      }
      notificacoes: {
        Row: {
          id: number
          usuario_id: string
          tipo: string
          titulo: string
          mensagem: string
          lida: boolean
          link: string | null
          email_enviado: boolean
          created_at: string
        }
        Insert: {
          id?: number
          usuario_id: string
          tipo: string
          titulo: string
          mensagem: string
          lida?: boolean
          link?: string | null
          email_enviado?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          usuario_id?: string
          tipo?: string
          titulo?: string
          mensagem?: string
          lida?: boolean
          link?: string | null
          email_enviado?: boolean
          created_at?: string
        }
      }
    }
  }
}
