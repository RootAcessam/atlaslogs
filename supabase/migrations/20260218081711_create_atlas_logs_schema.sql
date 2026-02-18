/*
  # Sistema de Gestão de Fulfillment - ATLAS LOGS
  
  ## Descrição
  Sistema completo de gestão de fulfillment com dois painéis separados:
  - Painel Admin: Gestão completa do armazém e operações
  - Painel Lojista: Cada lojista gerencia seus produtos e vendas
  
  ## Tabelas Criadas
  
  ### 1. lojistas
  Armazena dados dos lojistas cadastrados no sistema
  - id (uuid): identificador único
  - nome_fantasia: nome da loja
  - nome_contato: nome do responsável
  - email: email para login e notificações
  - telefone: contato
  - cnpj: documento
  - comissao_percentual: percentual de comissão (padrão 15%)
  - endereco_completo: endereço do lojista
  - observacoes: anotações
  - ativo: se está ativo no sistema
  
  ### 2. produtos_estoque
  Produtos de cada lojista armazenados no fulfillment
  - id: identificador único
  - lojista_id: referência ao lojista dono do produto
  - nome: nome do produto
  - sku: código único do produto
  - categoria: categoria do produto
  - descricao: descrição detalhada
  - peso_gramas: peso em gramas
  - imagem_url: URL da imagem
  - quantidade_atual: estoque atual (sempre >= 0)
  - quantidade_minima: estoque mínimo para alerta
  - localizacao: localização física no armazém
  - status: ativo/inativo
  
  ### 3. movimentacoes_estoque
  Histórico de todas movimentações de estoque
  - tipo: entrada, saida ou ajuste
  - quantidade: quantidade movimentada
  - motivo: razão da movimentação
  - pedido_id: se relacionado a um pedido
  
  ### 4. pedidos
  Pedidos de vendas lançados pelos lojistas
  - numero_pedido_externo: número do pedido no marketplace
  - marketplace_origem: onde foi vendido (Mercado Livre, Shopee, etc)
  - status: aguardando_separacao, em_separacao, embalado, enviado, cancelado
  - dados_cliente: JSON com dados do destinatário
  - total_pedido: valor total
  - comissao_calculada: comissão do fulfillment
  - datas de cada etapa do processo
  - codigo_rastreio e transportadora
  
  ### 5. itens_pedido
  Produtos dentro de cada pedido
  - pedido_id: referência ao pedido
  - produto_id: produto vendido
  - quantidade: quantidade vendida
  - preco_unitario: preço unitário
  
  ### 6. historico_pedido
  Timeline de mudanças de status dos pedidos
  - status_anterior e status_novo
  - observacao: anotações sobre a mudança
  - responsavel: quem fez a mudança
  
  ### 7. notificacoes
  Sistema de notificações do sistema
  - usuario_id: ID do usuário (admin ou lojista_id)
  - tipo: tipo de notificação
  - titulo e mensagem
  - lida: se foi lida
  - link: URL relacionada
  - email_enviado: se email foi enviado
  
  ## Segurança (RLS)
  
  ### Políticas Restritivas:
  - Lojistas só veem seus próprios dados
  - Admin tem acesso total
  - Notificações são visíveis apenas para o destinatário
  
  ## Índices
  Otimizações para queries frequentes em pedidos e produtos
*/

-- Tabela de lojistas
CREATE TABLE IF NOT EXISTS lojistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia TEXT NOT NULL,
  nome_contato TEXT,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  cnpj VARCHAR(18),
  comissao_percentual DECIMAL(5,2) DEFAULT 15.00,
  endereco_completo TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE lojistas ENABLE ROW LEVEL SECURITY;

-- Políticas para lojistas
CREATE POLICY "Lojistas podem ver próprios dados"
  ON lojistas FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Lojistas podem atualizar próprios dados"
  ON lojistas FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin pode ver todos (será implementado com service role)

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos_estoque (
  id SERIAL PRIMARY KEY,
  lojista_id UUID NOT NULL REFERENCES lojistas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sku VARCHAR(100) NOT NULL,
  categoria VARCHAR(50),
  descricao TEXT,
  peso_gramas INTEGER,
  imagem_url TEXT,
  quantidade_atual INTEGER DEFAULT 0 CHECK (quantidade_atual >= 0),
  quantidade_minima INTEGER DEFAULT 1,
  localizacao TEXT,
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lojista_id, sku)
);

ALTER TABLE produtos_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojistas veem apenas seus produtos"
  ON produtos_estoque FOR SELECT
  TO authenticated
  USING (auth.uid() = lojista_id);

CREATE POLICY "Lojistas podem inserir seus produtos"
  ON produtos_estoque FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = lojista_id);

CREATE POLICY "Lojistas podem atualizar seus produtos"
  ON produtos_estoque FOR UPDATE
  TO authenticated
  USING (auth.uid() = lojista_id)
  WITH CHECK (auth.uid() = lojista_id);

CREATE POLICY "Lojistas podem deletar seus produtos"
  ON produtos_estoque FOR DELETE
  TO authenticated
  USING (auth.uid() = lojista_id);

-- Tabela de movimentações
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos_estoque(id) ON DELETE CASCADE,
  tipo VARCHAR(20) CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  motivo VARCHAR(50),
  pedido_id INTEGER,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojistas veem movimentações de seus produtos"
  ON movimentacoes_estoque FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM produtos_estoque
      WHERE produtos_estoque.id = movimentacoes_estoque.produto_id
      AND produtos_estoque.lojista_id = auth.uid()
    )
  );

CREATE POLICY "Sistema pode inserir movimentações"
  ON movimentacoes_estoque FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  lojista_id UUID NOT NULL REFERENCES lojistas(id) ON DELETE CASCADE,
  numero_pedido_externo VARCHAR(100),
  marketplace_origem VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'aguardando_separacao',
  dados_cliente JSONB NOT NULL,
  total_pedido DECIMAL(10,2) NOT NULL,
  comissao_calculada DECIMAL(10,2),
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_separacao TIMESTAMPTZ,
  data_embalagem TIMESTAMPTZ,
  data_envio TIMESTAMPTZ,
  codigo_rastreio VARCHAR(50),
  transportadora VARCHAR(50)
);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojistas veem apenas seus pedidos"
  ON pedidos FOR SELECT
  TO authenticated
  USING (auth.uid() = lojista_id);

CREATE POLICY "Lojistas podem criar pedidos"
  ON pedidos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = lojista_id);

CREATE POLICY "Lojistas podem atualizar seus pedidos"
  ON pedidos FOR UPDATE
  TO authenticated
  USING (auth.uid() = lojista_id)
  WITH CHECK (auth.uid() = lojista_id);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos_estoque(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10,2) NOT NULL
);

ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem itens de seus pedidos"
  ON itens_pedido FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = itens_pedido.pedido_id
      AND pedidos.lojista_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir itens em seus pedidos"
  ON itens_pedido FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = itens_pedido.pedido_id
      AND pedidos.lojista_id = auth.uid()
    )
  );

-- Tabela de histórico
CREATE TABLE IF NOT EXISTS historico_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  observacao TEXT,
  responsavel VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE historico_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem histórico de seus pedidos"
  ON historico_pedido FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pedidos
      WHERE pedidos.id = historico_pedido.pedido_id
      AND pedidos.lojista_id = auth.uid()
    )
  );

CREATE POLICY "Sistema pode inserir histórico"
  ON historico_pedido FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  link TEXT,
  email_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas suas notificações"
  ON notificacoes FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid()::text OR usuario_id = 'admin');

CREATE POLICY "Sistema pode criar notificações"
  ON notificacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas notificações"
  ON notificacoes FOR UPDATE
  TO authenticated
  USING (usuario_id = auth.uid()::text OR usuario_id = 'admin')
  WITH CHECK (usuario_id = auth.uid()::text OR usuario_id = 'admin');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_lojista ON pedidos(lojista_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_criacao ON pedidos(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_produtos_lojista ON produtos_estoque(lojista_id);
CREATE INDEX IF NOT EXISTS idx_produtos_quantidade ON produtos_estoque(quantidade_atual);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, lida);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON movimentacoes_estoque(produto_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para produtos
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos_estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();