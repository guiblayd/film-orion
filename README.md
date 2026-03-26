# FilmOrion

Rede social de recomendacoes de filmes, series e animes com feed social, perfis, comentarios, notificacoes e integracao com Supabase + TMDB.

## Rodar localmente

Pre-requisitos: Node.js 20+ e um projeto Supabase configurado.

1. Instale as dependencias com `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `VITE_TMDB_API_KEY`.
4. Rode as migrations do Supabase.
5. Inicie o app com `npm run dev`.

## Banco de dados

- `npm run db:push`: aplica migrations no projeto Supabase vinculado.
- `npm run db:types`: regenera os tipos do banco em `src/types/database.ts`.
- `npm run db:seed`: popula o banco com usuarios e recomendacoes de demonstracao.

## Stack

- React 19 + Vite
- Tailwind CSS 4
- Supabase Auth, Database e Storage
- TMDB para descoberta e detalhes de conteudo
