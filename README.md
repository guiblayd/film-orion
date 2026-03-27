# FilmOrion

FilmOrion e uma rede social de recomendacoes de filmes, series e animes. A proposta do projeto e combinar descoberta de catalogo com contexto social: quem indicou, para quem indicou, o que esta circulando no feed e como cada pessoa organiza seus gostos.

O app foi construido com React + Vite no frontend, Supabase no backend e TMDB para busca e descoberta de conteudo.

## Visao geral

No FilmOrion, cada recomendacao funciona como uma unidade social:

- uma pessoa indica um titulo para outra
- a recomendacao pode incluir mensagem
- a visibilidade pode ser privada, para o circulo ou publica
- outros usuarios podem interagir e discutir quando a conversa estiver habilitada

O projeto foi pensado para uma experiencia mobile-first, com adaptacao de layout para desktop.

## Principais funcionalidades

- Feed social com abas para descobrir, ver o circulo e acompanhar o que foi indicado para voce
- Criacao de recomendacoes com mensagem, visibilidade e controle de discussao
- Perfis com seguidores, seguindo, historico de indicacoes, watchlist e itens assistidos
- Exploracao de catalogo com dados do TMDB
- Notificacoes de atividade social
- Autenticacao, perfis e upload de avatar via Supabase
- Estrutura preparada para PWA e deploy na Vercel

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

### Pre-requisitos

- Node.js 20+
- npm
- Projeto Supabase configurado
- Chave de API do TMDB
- Supabase CLI instalada se voce for usar migrations, tipos ou seed

### Instalacao

```bash
npm install
```

### Variaveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Preencha as variaveis abaixo:

| Variavel | Obrigatoria | Uso |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anonima usada pelo frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | So para seed | Necessaria apenas para o script de seed |
| `VITE_TMDB_API_KEY` | Sim | Busca, detalhes e descoberta de catalogo |

### Banco de dados

Se estiver conectando o projeto a um backend novo, rode:

```bash
npm run db:link
npm run db:push
```

Se quiser popular o banco com dados de demonstracao:

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

O app sobe por padrao em:

```text
http://localhost:3000
```

## Scripts disponiveis

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera o build de producao |
| `npm run preview` | Faz preview local do build |
| `npm run lint` | Valida tipos com TypeScript |
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
|   |-- store.tsx
|-- supabase/
|-- vercel.json
|-- vite.config.ts
```

### Pastas mais importantes

- `src/components`: telas e componentes visuais da aplicacao
- `src/contexts`: contexto de autenticacao e estados compartilhados
- `src/lib`: utilitarios e configuracoes auxiliares
- `src/services`: integracoes com Supabase e TMDB
- `src/store.tsx`: estado global da aplicacao
- `scripts`: automacoes de seed e suporte ao desenvolvimento
- `supabase`: migrations e arquivos relacionados ao banco

## Deploy

O projeto esta preparado para deploy na Vercel com fallback de SPA configurado em `vercel.json`.

Para publicar com seguranca:

1. configure as mesmas variaveis de ambiente do ambiente local
2. gere um build de verificacao com `npm run build`
3. publique na Vercel apontando para este repositorio

## Observacoes importantes

- O projeto usa textos visiveis em PT-BR, entao vale revisar copy e acentuacao antes de publicar mudancas de interface.
- `SUPABASE_SERVICE_ROLE_KEY` nao deve ser usada no frontend. Ela existe apenas para rotinas de seed e manutencao local.
- O feed, os perfis e os fluxos de recomendacao misturam comportamento mobile e desktop, entao alteracoes de layout devem ser verificadas nos dois contextos.

## Contribuicao

Se voce for evoluir o projeto:

- abra uma issue para bugs ou ideias de produto
- mantenha o build passando antes de abrir PR
- revise impacto em mobile e desktop
- documente mudancas de banco quando houver migrations novas
