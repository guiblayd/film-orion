# FilmOrion

Rede social de recomendações de filmes, séries e animes com feed social, perfis, comentários, notificações e integração com Supabase + TMDB.

## Rodar localmente

Pré-requisitos: Node.js 20+ e um projeto Supabase configurado.

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `VITE_TMDB_API_KEY`.
4. Rode as migrations do Supabase.
5. Inicie o app com `npm run dev`.

## Banco de dados

- `npm run db:push`: aplica migrations no projeto Supabase vinculado.
- `npm run db:types`: regenera os tipos do banco em `src/types/database.ts`.
- `npm run db:seed`: popula o banco com usuários e recomendações de demonstração.

## Convenções de UI Copy

- Todo texto visível ao usuário em português deve usar ortografia e acentuação corretas em PT-BR.
- Antes de subir mudanças de interface, revise rótulos, títulos, botões, estados vazios e mensagens de erro para evitar regressões como `indicacao`, `alteracoes` ou `nao`.
- Se houver dúvida entre abreviação e clareza, priorize a forma correta e legível para o usuário final.

## Stack

- React 19 + Vite
- Tailwind CSS 4
- Supabase Auth, Database e Storage
- TMDB para descoberta e detalhes de conteúdo
