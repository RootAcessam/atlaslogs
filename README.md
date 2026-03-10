# ATLAS LOGS - Sistema de Gestão de Fulfillment

ATLAS LOGS é um sistema de gestão de fulfillment projetado para controlar operações de estoque, pedidos e logística em um único ambiente.  
A aplicação possui dois painéis principais: **Admin** e **Lojista**, permitindo que diferentes usuários tenham acesso a funcionalidades específicas conforme seu papel no sistema.

O objetivo do projeto é centralizar o fluxo completo de pedidos, desde o lançamento da venda até a separação, embalagem e envio.

---

# Tecnologias Utilizadas

**Frontend**
- React
- TypeScript
- Vite
- TailwindCSS

**Backend**
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Edge Functions

**UI**
- Componentes customizados
- Lucide React (ícones)

**Deploy**
- Vercel

---

# Demonstração

Caso o sistema esteja publicado:

```
https://seu-projeto.vercel.app
```

---

# Estrutura Geral do Sistema

O sistema possui dois ambientes principais.

## Painel Admin

Usuário administrador possui controle completo sobre a operação.

Funcionalidades:

- Dashboard executivo com KPIs em tempo real
- Monitoramento de pedidos
- Fila de separação de pedidos
- Gestão completa de lojistas
- Controle de estoque global
- Sistema de notificações em tempo real
- Controle completo do fluxo logístico

Login administrativo esperado:

```
admin@atlaslogs.com
```

---

## Painel Lojista

Cada lojista possui acesso somente aos próprios dados.

Funcionalidades:

- Dashboard personalizado
- Cadastro e gestão de produtos
- Lançamento de vendas externas (marketplaces)
- Acompanhamento de pedidos
- Movimentação manual de estoque
- Recebimento de notificações importantes

---

# Instalação Local

Clone o repositório:

```bash
git clone https://github.com/seuusuario/atlaslogs.git
```

Entre na pasta do projeto:

```bash
cd atlaslogs
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

---

# Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto.

```
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Essas credenciais podem ser encontradas no painel do Supabase.

---

# Estrutura do Banco de Dados

O sistema utiliza PostgreSQL via Supabase.

Principais tabelas:

- `lojistas`
- `produtos_estoque`
- `pedidos`
- `itens_pedido`
- `movimentacoes_estoque`
- `historico_pedido`
- `notificacoes`

Essas tabelas controlam toda a operação logística da aplicação.

---

# Segurança

O sistema utiliza **Row Level Security (RLS)** para proteger os dados.

Regras principais:

- Lojistas acessam apenas seus próprios registros
- Administradores possuem acesso ampliado conforme regras da aplicação
- Políticas restritivas por padrão

---

# Fluxo de Pedidos

Fluxo padrão da operação:

1. Lojista registra uma venda
2. Sistema reduz automaticamente o estoque
3. Pedido entra na fila de separação
4. Admin inicia separação
5. Pedido é embalado
6. Pedido é enviado com código de rastreio

Status de pedido:

```
Aguardando separação
Em separação
Embalado
Enviado
```

---

# Sistema de Notificações

O sistema possui notificações internas em tempo real.

Eventos já implementados:

- Novo pedido lançado
- Pedido enviado
- Estoque baixo
- Produto sem localização no armazém

A estrutura também permite envio futuro de:

- Email
- WhatsApp
- Telegram
- SMS

---

# Design do Sistema

Paleta utilizada:

```
Fundo principal: #0A0A0A
Cards: #121212
Bordas: #1F1F1F
Destaque: #E11D48
Texto principal: #FFFFFF
Texto secundário: #A0A0A0
```

Características visuais:

- Interface escura
- Cards elevados
- Componentes responsivos
- Badges de status
- Transições suaves
- Loading states

---

# Estrutura do Projeto

```
atlaslogs
│
├── src
├── public
├── supabase
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── vercel.json
└── README.md
```

---

# Próximas Funcionalidades

Funcionalidades planejadas para evolução do sistema:

- Mapa visual do armazém
- Relatórios de vendas e comissões
- Integração com APIs de frete
- Importação automática de pedidos
- Impressão de etiquetas logísticas
- Integração com WhatsApp
- Integração com Telegram

---

# Objetivo do Projeto

Este projeto foi desenvolvido como um sistema completo de gestão de fulfillment com foco em:

- controle de estoque
- fluxo de pedidos
- separação logística
- gestão de lojistas
- notificações operacionais

Ele também serve como estudo prático de arquitetura fullstack utilizando React, TypeScript e Supabase.

---

# Autor

João Victor Queiroz Bezerra

GitHub:
```
https://github.com/joaovictorqb
```
