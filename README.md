# ATLAS LOGS - Sistema de Gestão de Fulfillment

Sistema completo de gestão de fulfillment com dois painéis separados: Admin e Lojista.

## Características Principais

### Painel Admin (admin@atlaslogs.com)
- Dashboard executivo com KPIs em tempo real
- Fila de separação de pedidos
- Gestão completa de lojistas
- Estoque completo de todos os produtos
- Sistema de notificações em tempo real
- Controle total do fluxo de pedidos

### Painel Lojista
- Dashboard personalizado
- Gestão completa de produtos (CRUD)
- Lançamento de vendas de marketplaces externos
- Acompanhamento de pedidos
- Movimentação manual de estoque
- Notificações de eventos importantes

## Tecnologias

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **UI**: Componentes customizados com design premium
- **Ícones**: Lucide React

## Configuração

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 2. Criar Usuário Admin

Execute no SQL Editor do Supabase:

```sql
-- Criar usuário admin (substitua o email e senha)
-- O email DEVE ser admin@atlaslogs.com para ter acesso admin
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'admin@atlaslogs.com',
  crypt('SuaSenhaSegura123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

### 3. Criar Lojistas

Use o painel admin para criar novos lojistas. Cada lojista terá acesso apenas aos seus próprios dados.

## Funcionalidades Detalhadas

### Lançamento de Vendas
1. Lojista acessa "Lançar Venda"
2. Seleciona produtos e quantidades
3. Preenche dados do cliente
4. Sistema automaticamente:
   - Reduz estoque
   - Cria pedido com status "aguardando separação"
   - Dispara notificação para o admin
   - Registra movimentação de estoque

### Fluxo de Separação (Admin)
1. **Aguardando Separação**: Pedido na fila
2. **Em Separação**: Admin iniciou a separação
3. **Embalado**: Produto embalado e pronto para envio
4. **Enviado**: Código de rastreio informado

### Sistema de Notificações
- Notificações in-app em tempo real
- Badge com contador no menu
- Edge Function preparada para envio de emails
- Estrutura pronta para WhatsApp/Telegram/SMS

## Design

### Paleta de Cores
- Fundo: `#0A0A0A` (preto profundo)
- Cards: `#121212` (preto elevado)
- Bordas: `#1F1F1F`
- Destaque: `#E11D48` (vermelho)
- Texto: `#FFFFFF` (branco) e `#A0A0A0` (cinza)

### Componentes
- Cards com bordas arredondadas e sombras
- Badges coloridos para status
- Modais responsivos
- Transições suaves
- Loading states

## Estrutura do Banco de Dados

### Tabelas Principais
- `lojistas`: Dados dos lojistas
- `produtos_estoque`: Produtos no armazém
- `pedidos`: Pedidos de vendas
- `itens_pedido`: Produtos de cada pedido
- `movimentacoes_estoque`: Histórico de movimentações
- `historico_pedido`: Timeline de status
- `notificacoes`: Notificações do sistema

### Segurança (RLS)
Todas as tabelas possuem Row Level Security habilitado:
- Lojistas acessam apenas seus dados
- Admin tem acesso total via service role
- Políticas restritivas por padrão

## Como Usar

### Lojista
1. Faça login com suas credenciais
2. Cadastre seus produtos em "Meus Produtos"
3. Quando vender em marketplace externo, use "Lançar Venda"
4. Acompanhe seus pedidos em "Meus Pedidos"
5. Receba notificações quando pedidos forem enviados

### Admin
1. Faça login como admin@atlaslogs.com
2. Gerencie lojistas em "Lojistas"
3. Monitore fila de separação
4. Processe pedidos: separar → embalar → enviar
5. Defina localização física dos produtos
6. Acompanhe todas as operações no dashboard

## Notificações Implementadas

- ✅ Novo pedido lançado (notifica admin)
- ✅ Pedido enviado (notifica lojista)
- ✅ Estoque baixo (notifica admin e lojista)
- ✅ Novo produto sem localização (notifica admin)

## Próximas Funcionalidades

- Mapa visual do armazém
- Relatórios de vendas e comissões
- Integração com APIs de correios
- Importação de pedidos via API
- Impressão de etiquetas
- Integração com WhatsApp/Telegram

## Suporte

Sistema desenvolvido para ATLAS LOGS - Gestão de Fulfillment Profissional
