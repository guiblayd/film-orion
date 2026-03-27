# FilmOrion

FilmOrion é um aplicativo de recomendações de filmes, séries e animes. A proposta do projeto é organizar indicações entre pessoas com mais contexto: quem indicou, para quem indicou, qual foi a mensagem e como esse título aparece no feed, no perfil e nos detalhes da recomendação.

<img width="272" height="556" alt="image" src="https://github.com/user-attachments/assets/7d5608e3-aeef-4bff-a25d-14d5f7304df7" /> <img width="267" height="561" alt="image" src="https://github.com/user-attachments/assets/9bdc0a3b-9af8-4213-bc89-d3965052382c" /> <img width="270" height="551" alt="image" src="https://github.com/user-attachments/assets/3b4230f1-288f-4bc0-9588-13e46b0ca52d" />




O foco do produto não é ser uma rede social genérica. O centro da experiência é a indicação em si.

## Visão geral

No FilmOrion, cada recomendação funciona como uma unidade de contexto:

- uma pessoa indica um título para outra
- a recomendação pode incluir mensagem
- a visibilidade pode ser privada, para o círculo ou pública
- a conversa pode ser aberta ou desativada
- o catálogo é enriquecido com dados do TMDB

O projeto foi pensado com abordagem mobile-first, com adaptação de layout para desktop.

## Funcionalidades

- Feed com abas para descobrir indicações públicas, acompanhar o círculo e ver o que foi enviado para você
- Criação de recomendações com mensagem, visibilidade e controle de discussão
- Perfis com histórico de indicações, watchlist, itens assistidos, seguidores e seguindo
- Exploração de catálogo com busca, destaques e metadados do TMDB
- Página de detalhe para item e para recomendação
- Notificações de atividade
- Autenticação com email/senha e Google
- Modo visitante com navegação em somente leitura
- Upload de avatar e persistência com Supabase
- Estrutura pronta para PWA e deploy na Vercel

## Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS 4
- React Router 7
- Supabase Auth, Database e Storage
- TMDB API
- Vercel

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm
- um projeto Supabase configurado
- uma chave de API do TMDB
- Supabase CLI instalada, caso você vá usar migrations, tipos ou seed

### Instalação

```bash
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` a partir de `.env.example` e preencha os valores:

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública usada pelo frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Só para seed | Necessária apenas para o script de seed |
| `VITE_TMDB_API_KEY` | Sim | Busca, detalhes e descoberta de catálogo |

### Banco de dados

Se estiver conectando o projeto a um backend novo:

```bash
npm run db:link
npm run db:push
```

Se quiser popular o banco com dados de demonstração:

```bash
npm run db:seed
```

Se precisar regenerar os tipos do banco:

```bash
npm run db:types
```

### Desenvolvimento

```bash
npm run dev
```

Por padrão, o app sobe em:

```text
http://localhost:3000
```

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Faz preview local do build |
| `npm run lint` | Valida a tipagem com TypeScript |
| `npm run clean` | Remove a pasta `dist` |
| `npm run db:link` | Vincula o projeto local ao Supabase |
| `npm run db:push` | Aplica migrations no projeto vinculado |
| `npm run db:pull` | Puxa o estado atual do banco |
| `npm run db:types` | Regenera `src/types/database.ts` |
| `npm run db:migration` | Cria uma nova migration |
| `npm run db:seed` | Popula o banco com dados iniciais |

## Estrutura do projeto

```text
.
|-- public/
|-- scripts/
|-- src/
|   |-- components/
|   |-- contexts/
|   |-- lib/
|   |-- services/
|   |-- types/
|   |-- App.tsx
|   |-- main.tsx
|   `-- store.tsx
|-- supabase/
|-- vercel.json
`-- vite.config.ts
```

### Pastas principais

- `src/components`: telas e componentes visuais
- `src/contexts`: contexto de autenticação
- `src/lib`: utilitários e configurações auxiliares
- `src/services`: integrações com Supabase e TMDB
- `src/store.tsx`: estado global da aplicação
- `scripts`: rotinas de seed e apoio ao desenvolvimento
- `supabase`: migrations e arquivos relacionados ao banco

## Deploy

O projeto está preparado para deploy na Vercel com fallback de SPA configurado em `vercel.json`.

Antes de publicar:

1. configure as mesmas variáveis de ambiente do ambiente local
2. rode `npm run build` para validar o build de produção
3. publique na Vercel apontando para este repositório

## Notas

- `SUPABASE_SERVICE_ROLE_KEY` não deve ser usada no frontend. Ela existe apenas para seed e rotinas locais de manutenção.
- Alterações de interface devem ser verificadas em mobile e desktop.
- O produto mistura descoberta de catálogo, recomendações entre pessoas e navegação por perfis, então mudanças de fluxo costumam impactar mais de uma tela.

## Contribuição

Se você for evoluir o projeto:

- mantenha o build passando antes de abrir PR
- revise o impacto em mobile e desktop
- documente mudanças de banco quando houver novas migrations
- use `.env.example` como referência, sem expor credenciais reais
