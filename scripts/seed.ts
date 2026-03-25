/**
 * Seed script — Indica app
 * Cria usuários demo, filmes, conexões e discussões realistas.
 *
 * Pré-requisito: adicionar no .env:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Rodar: npm run db:seed
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error('❌  Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const db = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Usuários ─────────────────────────────────────────────────

const USERS = [
  { email: 'ana@indica.app',      name: 'Ana Lima',        bio: 'Cinéfila e maratonista serial. Se não tá assistindo, tá planejando o que vai assistir.' },
  { email: 'pedro@indica.app',    name: 'Pedro Costa',     bio: 'Séries de drama são minha religião. Succession mudou minha vida.' },
  { email: 'julia@indica.app',    name: 'Júlia Santos',    bio: 'Cinema de autor e A24. Prefiro legendas originais e cafés gelados.' },
  { email: 'rafael@indica.app',   name: 'Rafael Oliveira', bio: 'Maratonista compulsivo. Breaking Bad assistida 4 vezes e não me arrependo.' },
  { email: 'camila@indica.app',   name: 'Camila Ferreira', bio: 'Apaixonada por cinema coreano. Parasita abriu uma porta que não tem como fechar.' },
  { email: 'lucas@indica.app',    name: 'Lucas Martins',   bio: 'Diretor de fotografia nas horas vagas. Analiso cada plano e composição de cena.' },
  { email: 'beatriz@indica.app',  name: 'Beatriz Rocha',   bio: 'Roteirista amadora. Estudo estrutura narrativa em tudo que assisto.' },
  { email: 'gabriel@indica.app',  name: 'Gabriel Alves',   bio: 'Sci-fi é meu gênero. Duna me provou que adaptações podem superar o livro.' },
  { email: 'fernanda@indica.app', name: 'Fernanda Silva',  bio: 'Thriller psicológico e drama familiar. Assisto com legenda original sempre.' },
  { email: 'thiago@indica.app',   name: 'Thiago Cardoso',  bio: 'Séries longas são meu forte. Tenho paciência pra worldbuilding elaborado.' },
];

// ── Filmes & Séries ──────────────────────────────────────────

const ITEMS = [
  { id: 'tmdb_496243',  title: 'Parasita',                          image: 'https://image.tmdb.org/t/p/w300/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', type: 'movie',  year: 2019 },
  { id: 'tmdb_872585',  title: 'Oppenheimer',                       image: 'https://image.tmdb.org/t/p/w300/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', type: 'movie',  year: 2023 },
  { id: 'tmdb_545611',  title: 'Tudo em Todo Lugar ao Mesmo Tempo', image: 'https://image.tmdb.org/t/p/w300/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', type: 'movie',  year: 2022 },
  { id: 'tmdb_792307',  title: 'Pobres Criaturas',                  image: 'https://image.tmdb.org/t/p/w300/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg', type: 'movie',  year: 2023 },
  { id: 'tmdb_346698',  title: 'Barbie',                            image: 'https://image.tmdb.org/t/p/w300/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', type: 'movie',  year: 2023 },
  { id: 'tmdb_840430',  title: 'Os Que Ficaram',                    image: 'https://image.tmdb.org/t/p/w300/VHSzNBTwxV8vh7wylo7O9CLdac.jpg',  type: 'movie',  year: 2023 },
  { id: 'tmdb_666277',  title: 'Vidas Passadas',                    image: 'https://image.tmdb.org/t/p/w300/toSI71gFF11VnLfz2uiNx6jjNUF.jpg', type: 'movie',  year: 2023 },
  { id: 'tmdb_438631',  title: 'Duna',                              image: 'https://image.tmdb.org/t/p/w300/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg', type: 'movie',  year: 2021 },
  { id: 'tmdb_1188148', title: 'Saltburn',                          image: 'https://image.tmdb.org/t/p/w300/9ZDszdHCSHfJ9MFkKo3h5Hr30AA.jpg', type: 'movie',  year: 2023 },
  { id: 'tmdb_1227206', title: 'Aftersun',                          image: 'https://image.tmdb.org/t/p/w300/2RBuKGoYnrDT9w4x4UzjpLo0d54.jpg', type: 'movie',  year: 2022 },
  { id: 'tmdb_136315',  title: 'The Bear',                          image: 'https://image.tmdb.org/t/p/w300/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg', type: 'series', year: 2022 },
  { id: 'tmdb_60059',   title: 'Succession',                        image: 'https://image.tmdb.org/t/p/w300/zjg4jpK1Wp2kiRvtt5ND0kznako.jpg', type: 'series', year: 2018 },
  { id: 'tmdb_95396',   title: 'Severance',                         image: 'https://image.tmdb.org/t/p/w300/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg', type: 'series', year: 2022 },
  { id: 'tmdb_110316',  title: 'The White Lotus',                   image: 'https://image.tmdb.org/t/p/w300/Ac8ruycRXzgcsndTZFK6ouGA0FA.jpg', type: 'series', year: 2021 },
  { id: 'tmdb_1396',    title: 'Breaking Bad',                      image: 'https://image.tmdb.org/t/p/w300/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg', type: 'series', year: 2008 },
  { id: 'tmdb_66732',   title: 'Stranger Things',                   image: 'https://image.tmdb.org/t/p/w300/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg', type: 'series', year: 2016 },
];

// ── Helpers ──────────────────────────────────────────────────

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function avatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,ffd5dc,d1d4f9,c0aede`;
}

// ── Main ─────────────────────────────────────────────────────

async function seed() {
  // 1. Limpar usuários demo anteriores
  console.log('🧹 Limpando seed anterior...');
  const { data: existing } = await db.auth.admin.listUsers({ perPage: 200 });
  for (const u of existing?.users ?? []) {
    if (u.email?.endsWith('@indica.app')) {
      await db.auth.admin.deleteUser(u.id);
    }
  }

  // 2. Criar usuários
  console.log('👥 Criando usuários...');
  const ids: string[] = [];

  for (const u of USERS) {
    const { data, error } = await db.auth.admin.createUser({
      email: u.email,
      password: 'indica123',
      email_confirm: true,
      user_metadata: { name: u.name, avatar_url: avatar(u.name) },
    });
    if (error || !data.user) { console.error(`  ✗ ${u.name}:`, error?.message); process.exit(1); }

    // Atualiza perfil com bio (o trigger cria o perfil mas sem bio)
    await db.from('profiles').update({ bio: u.bio }).eq('id', data.user.id);
    ids.push(data.user.id);
    console.log(`  ✓ ${u.name}`);
  }

  const [u1, u2, u3, u4, u5, u6, u7, u8, u9, u10] = ids;

  // 3. Filmes & séries
  console.log('🎬 Inserindo filmes e séries...');
  const { error: itemsErr } = await db.from('items').upsert(ITEMS);
  if (itemsErr) { console.error('  ✗ items:', itemsErr.message); process.exit(1); }
  console.log(`  ✓ ${ITEMS.length} títulos`);

  // 4. Conexões (follows)
  console.log('🔗 Criando conexões...');
  const connections = [
    // Ana segue: Pedro, Júlia, Camila, Lucas, Gabriel
    [u1, u2], [u1, u3], [u1, u5], [u1, u6], [u1, u8],
    // Pedro segue: Ana, Júlia, Rafael, Beatriz, Fernanda
    [u2, u1], [u2, u3], [u2, u4], [u2, u7], [u2, u9],
    // Júlia segue: Ana, Pedro, Camila, Lucas, Thiago
    [u3, u1], [u3, u2], [u3, u5], [u3, u6], [u3, u10],
    // Rafael segue: Pedro, Camila, Beatriz, Gabriel
    [u4, u2], [u4, u5], [u4, u7], [u4, u8],
    // Camila segue: Ana, Júlia, Rafael, Lucas, Fernanda
    [u5, u1], [u5, u3], [u5, u4], [u5, u6], [u5, u9],
    // Lucas segue: Ana, Júlia, Camila, Gabriel, Thiago
    [u6, u1], [u6, u3], [u6, u5], [u6, u8], [u6, u10],
    // Beatriz segue: Pedro, Rafael, Fernanda, Thiago
    [u7, u2], [u7, u4], [u7, u9], [u7, u10],
    // Gabriel segue: Ana, Rafael, Lucas, Beatriz, Thiago
    [u8, u1], [u8, u4], [u8, u6], [u8, u7], [u8, u10],
    // Fernanda segue: Pedro, Camila, Beatriz, Thiago
    [u9, u2], [u9, u5], [u9, u7], [u9, u10],
    // Thiago segue: Júlia, Lucas, Gabriel, Fernanda
    [u10, u3], [u10, u6], [u10, u8], [u10, u9],
  ];

  const { error: connErr } = await db.from('connections').upsert(
    connections.map(([r, v]) => ({ requester_id: r, receiver_id: v, status: 'accepted' })),
    { onConflict: 'requester_id,receiver_id' }
  );
  if (connErr) { console.error('  ✗ connections:', connErr.message); process.exit(1); }
  console.log(`  ✓ ${connections.length} conexões`);

  // 5. Indicações
  console.log('📨 Criando indicações...');

  const recs = [
    { from: u2, to: u1, item: 'tmdb_496243',  days: 28, vis: 'public',      msg: 'Parasita é uma obra-prima absoluta. Assiste sem saber nada sobre a história.' },
    { from: u3, to: u1, item: 'tmdb_95396',   days: 25, vis: 'public',      msg: 'Severance vai te deixar com uma angústia gostosa por dias. Diferente de tudo.' },
    { from: u5, to: u1, item: 'tmdb_136315',  days: 21, vis: 'public',      msg: 'Assiste esse fim de semana, você vai me agradecer depois. The Bear é absurdo.' },
    { from: u6, to: u1, item: 'tmdb_110316',  days: 18, vis: 'connections', msg: 'White Lotus temporada 2 é perfeita. Irônica, bela e inquietante ao mesmo tempo.' },
    { from: u8, to: u1, item: 'tmdb_438631',  days: 12, vis: 'private',     msg: 'Duna parte 2 é ainda melhor que a primeira. Épico no sentido mais literal da palavra.' },

    { from: u1, to: u2, item: 'tmdb_60059',   days: 26, vis: 'public',      msg: 'Succession é o melhor drama que já assisti. Você vai odiar e amar os personagens.' },
    { from: u3, to: u2, item: 'tmdb_792307',  days: 22, vis: 'public',      msg: 'Emma Stone em Pobres Criaturas é de outro planeta. Visualmente impecável.' },
    { from: u7, to: u2, item: 'tmdb_840430',  days: 15, vis: 'connections', msg: 'Os Que Ficaram é o filme perfeito pra esse inverno. Vai chorar, mas vai sorrir também.' },
    { from: u9, to: u2, item: 'tmdb_1188148', days: 8,  vis: 'private',     msg: 'Saltburn vai te deixar de queixo caído no final. Entra sem spoiler.' },

    { from: u1, to: u3, item: 'tmdb_872585',  days: 24, vis: 'public',      msg: 'Oppenheimer no cinema foi uma experiência única. Nolan no auge total.' },
    { from: u5, to: u3, item: 'tmdb_666277',  days: 19, vis: 'public',      msg: 'Vidas Passadas vai te deixar pensando por semanas. Cinema delicado e devastador.' },
    { from: u6, to: u3, item: 'tmdb_136315',  days: 14, vis: 'connections', msg: 'The Bear captura caos e beleza de um jeito que poucas séries conseguem.' },

    { from: u2, to: u4, item: 'tmdb_1396',    days: 30, vis: 'public',      msg: 'Se você ainda não assistiu Breaking Bad, tá perdendo a melhor série já feita.' },
    { from: u5, to: u4, item: 'tmdb_496243',  days: 17, vis: 'public',      msg: 'Parasita é uma das raras vezes que um filme merece todo o hype que recebeu.' },
    { from: u8, to: u4, item: 'tmdb_66732',   days: 10, vis: 'connections', msg: 'Stranger Things pra aquela maratona de fim de semana. Nostalgia do jeito certo.' },

    { from: u1, to: u5, item: 'tmdb_346698',  days: 23, vis: 'public',      msg: 'Barbie parece fútil mas é muito mais inteligente do que aparenta. Vai de mente aberta.' },
    { from: u6, to: u5, item: 'tmdb_545611',  days: 16, vis: 'public',      msg: 'Tudo em Todo Lugar é caótico do jeito mais bonito possível. Emocionei demais.' },
    { from: u9, to: u5, item: 'tmdb_1227206', days: 9,  vis: 'connections', msg: 'Aftersun é silencioso e devastador. O tipo de filme que fica com você pra sempre.' },

    { from: u3, to: u6, item: 'tmdb_95396',   days: 20, vis: 'public',      msg: 'Severance vai fazer você questionar o próprio conceito de identidade.' },
    { from: u8, to: u6, item: 'tmdb_872585',  days: 13, vis: 'public',      msg: '3 horas que passam em 1. Nolan sabia exatamente o que estava fazendo.' },

    { from: u4, to: u7, item: 'tmdb_60059',   days: 27, vis: 'public',      msg: 'Succession começa devagar mas em 3 episódios você tá completamente viciado.' },
    { from: u9, to: u7, item: 'tmdb_666277',  days: 11, vis: 'connections', msg: 'Vidas Passadas é sobre tudo que poderia ter sido e não foi. Delicado demais.' },

    { from: u6, to: u8, item: 'tmdb_110316',  days: 22, vis: 'public',      msg: 'White Lotus é o tipo de série que você precisa assistir com atenção total.' },
    { from: u10, to: u8, item: 'tmdb_545611', days: 6,  vis: 'public',      msg: 'Entra com a mente aberta. Tudo em Todo Lugar é sobre caos e amor ao mesmo tempo.' },

    { from: u7, to: u9, item: 'tmdb_792307',  days: 19, vis: 'public',      msg: 'Pobres Criaturas é feminismo e surrealismo na medida certa. Emma Stone incrível.' },
    { from: u10, to: u9, item: 'tmdb_60059',  days: 7,  vis: 'connections', msg: 'Série que vai fazer você questionar família, poder e lealdade ao mesmo tempo.' },

    { from: u3, to: u10, item: 'tmdb_438631', days: 16, vis: 'public',      msg: 'Duna é o sci-fi épico que o cinema precisava. A fotografia é de outro nível.' },
    { from: u9, to: u10, item: 'tmdb_1188148',days: 4,  vis: 'private',     msg: 'Saltburn. Entra sem saber nada. Sério.' },
  ];

  const recIds: string[] = [];

  for (const r of recs) {
    const { data, error } = await db.from('recommendations').insert({
      from_user_id: r.from,
      to_user_id:   r.to,
      item_id:      r.item,
      message:      r.msg,
      discussion_enabled: true,
      visibility:   r.vis,
      created_at:   daysAgo(r.days),
    }).select('id').single();

    if (error || !data) { console.error('  ✗ rec:', error?.message); continue; }
    recIds.push(data.id);
  }
  console.log(`  ✓ ${recIds.length} indicações`);

  // 6. Comentários
  console.log('💬 Criando comentários...');

  const comments = [
    // Parasita (rec 0: pedro→ana)
    { ri: 0, uid: u1, text: 'Acabei de assistir e to em choque. Como esse filme existe?', days: 27 },
    { ri: 0, uid: u3, text: 'Essa é uma das melhores indicações que você já fez. Obra-prima mesmo.', days: 27 },
    { ri: 0, uid: u5, text: 'Parasita fica na cabeça por dias. Bong Joon-ho é um gênio.', days: 26 },
    { ri: 0, uid: u2, text: 'Fico feliz que curtiu! A cena da festa... uau.', days: 26 },

    // Severance (rec 1: julia→ana)
    { ri: 1, uid: u1, text: 'Assisti 3 episódios ontem. Não consigo parar de pensar.', days: 24 },
    { ri: 1, uid: u6, text: 'A premissa é brilhante. O que significa ser você mesmo só às vezes?', days: 24 },
    { ri: 1, uid: u3, text: 'Temporada 2 tá ainda mais intensa. Prepara o coração.', days: 23 },

    // The Bear (rec 2: camila→ana)
    { ri: 2, uid: u1, text: 'Assistindo agora. O ritmo é de deixar ansioso haha', days: 20 },
    { ri: 2, uid: u2, text: 'Episódio 7 da primeira temporada é um dos melhores episódios de série que já vi.', days: 20 },
    { ri: 2, uid: u5, text: 'Fico muito feliz que você curtiu! Série especial demais.', days: 19 },
    { ri: 2, uid: u8, text: 'Ficção e gastronomia juntos de um jeito que nunca vi antes.', days: 19 },

    // White Lotus (rec 3: lucas→ana)
    { ri: 3, uid: u1, text: 'Começando hoje à noite. A fotografia da série é incrível pelos trailers.', days: 17 },
    { ri: 3, uid: u7, text: 'A segunda temporada na Sicília é visualmente de outro mundo.', days: 17 },
    { ri: 3, uid: u6, text: 'Mike White é um escritor excepcional. Cada personagem é complexo.', days: 16 },

    // Succession (rec 5: ana→pedro)
    { ri: 5, uid: u2, text: 'Comecei ontem. Logan Roy é fascinante e assustador ao mesmo tempo.', days: 25 },
    { ri: 5, uid: u4, text: 'Kendall é o personagem mais trágico da televisão moderna. Incrível.', days: 25 },
    { ri: 5, uid: u1, text: 'A cena do aniversário na segunda temporada. Nunca mais fui o mesmo.', days: 24 },
    { ri: 5, uid: u9, text: 'Série que te faz torcer por personagens horríveis. Brilhante.', days: 24 },

    // Pobres Criaturas (rec 6: julia→pedro)
    { ri: 6, uid: u2, text: 'Fui no cinema sem saber nada. Fiquei boquiaberto do início ao fim.', days: 21 },
    { ri: 6, uid: u5, text: 'A direção de arte é de outro universo. Cada frame é uma pintura.', days: 21 },
    { ri: 6, uid: u3, text: 'Emma Stone vai ganhar todos os prêmios que merecer.', days: 20 },

    // Oppenheimer (rec 9: ana→julia)
    { ri: 9, uid: u3, text: 'Fui no IMAX. A cena da detonação foi religiosa.', days: 23 },
    { ri: 9, uid: u8, text: 'Nolan conseguiu fazer um thriller de física nuclear. Impossível mas aconteceu.', days: 23 },
    { ri: 9, uid: u6, text: 'Fotografia do Hoyte van Hoytema nesse filme é impecável.', days: 22 },

    // Vidas Passadas (rec 10: camila→julia)
    { ri: 10, uid: u3, text: 'Chorei tanto. Que filme delicado e honesto.', days: 18 },
    { ri: 10, uid: u7, text: 'In-yun. Esse conceito vai ficar na minha cabeça pra sempre.', days: 18 },
    { ri: 10, uid: u5, text: 'Passei dias pensando nas escolhas dos personagens. Cinema de verdade.', days: 17 },

    // Breaking Bad (rec 12: pedro→rafael)
    { ri: 12, uid: u4, text: 'Tô no terceiro episódio e já entendo o hype todo.', days: 29 },
    { ri: 12, uid: u6, text: 'Breaking Bad é um estudo de personagem mais profundo que qualquer livro.', days: 29 },
    { ri: 12, uid: u2, text: 'Aguarda o final da segunda temporada. Vai mudar tudo.', days: 28 },

    // Barbie (rec 15: ana→camila)
    { ri: 15, uid: u5, text: 'Ok você tinha razão. Muito mais camadas do que eu esperava.', days: 22 },
    { ri: 15, uid: u3, text: 'Greta Gerwig fez algo genuinamente único dentro de uma franchise comercial.', days: 22 },
    { ri: 15, uid: u1, text: 'O monólogo da America Ferrera me pegou de surpresa. Poderoso.', days: 21 },

    // Tudo em Todo Lugar (rec 16: lucas→camila)
    { ri: 16, uid: u5, text: 'Precisei pausar três vezes pra processar o que estava acontecendo haha', days: 15 },
    { ri: 16, uid: u3, text: 'Os Daniels conseguiram fazer um filme sobre nihilismo que é cheio de amor.', days: 15 },
    { ri: 16, uid: u6, text: 'A edição desse filme é uma obra de arte por si só.', days: 14 },

    // Saltburn (rec 8: fernanda→pedro)
    { ri: 8, uid: u2, text: 'Acabei de terminar. Preciso falar com alguém sobre esse final.', days: 7 },
    { ri: 8, uid: u1, text: 'ESSE FINAL. Não consigo pensar em outra coisa.', days: 7 },
    { ri: 8, uid: u9, text: 'Barry Keoghan é uma força da natureza nesse filme.', days: 6 },
    { ri: 8, uid: u7, text: 'A última cena vai ficar na minha cabeça por meses.', days: 6 },

    // Duna (rec 4: gabriel→ana)
    { ri: 4, uid: u1, text: 'Assistindo com meu irmão. Épico no sentido mais puro.', days: 11 },
    { ri: 4, uid: u3, text: 'A Parte 2 superou a primeira em todos os sentidos.', days: 11 },
    { ri: 4, uid: u8, text: 'Villeneuve finalmente fez a adaptação que o livro merecia.', days: 10 },
  ];

  const validComments = comments.filter(c => c.ri < recIds.length && recIds[c.ri]);

  const { error: commErr } = await db.from('comments').insert(
    validComments.map(c => ({
      recommendation_id: recIds[c.ri],
      user_id:           c.uid,
      content:           c.text,
      created_at:        daysAgo(c.days),
    }))
  );
  if (commErr) { console.error('  ✗ comments:', commErr.message); }
  else console.log(`  ✓ ${validComments.length} comentários`);

  // 7. Status de itens (já vi / salvar / ignorar)
  console.log('📋 Inserindo status de itens...');

  const statuses = [
    { uid: u1, item: 'tmdb_496243',  s: 'watched' },
    { uid: u1, item: 'tmdb_95396',   s: 'saved' },
    { uid: u1, item: 'tmdb_872585',  s: 'watched' },
    { uid: u1, item: 'tmdb_60059',   s: 'saved' },
    { uid: u2, item: 'tmdb_1396',    s: 'watched' },
    { uid: u2, item: 'tmdb_60059',   s: 'watched' },
    { uid: u2, item: 'tmdb_496243',  s: 'watched' },
    { uid: u2, item: 'tmdb_792307',  s: 'saved' },
    { uid: u3, item: 'tmdb_872585',  s: 'watched' },
    { uid: u3, item: 'tmdb_666277', s: 'watched' },
    { uid: u3, item: 'tmdb_792307',  s: 'watched' },
    { uid: u3, item: 'tmdb_95396',   s: 'saved' },
    { uid: u4, item: 'tmdb_1396',    s: 'watched' },
    { uid: u4, item: 'tmdb_66732',   s: 'watched' },
    { uid: u4, item: 'tmdb_496243',  s: 'saved' },
    { uid: u5, item: 'tmdb_496243',  s: 'watched' },
    { uid: u5, item: 'tmdb_545611',  s: 'watched' },
    { uid: u5, item: 'tmdb_346698',  s: 'watched' },
    { uid: u5, item: 'tmdb_1227206', s: 'saved' },
    { uid: u6, item: 'tmdb_872585',  s: 'watched' },
    { uid: u6, item: 'tmdb_136315',  s: 'watched' },
    { uid: u6, item: 'tmdb_110316',  s: 'saved' },
    { uid: u7, item: 'tmdb_60059',   s: 'watched' },
    { uid: u7, item: 'tmdb_666277', s: 'watched' },
    { uid: u7, item: 'tmdb_840430',  s: 'watched' },
    { uid: u8, item: 'tmdb_438631',  s: 'watched' },
    { uid: u8, item: 'tmdb_872585',  s: 'watched' },
    { uid: u8, item: 'tmdb_66732',   s: 'saved' },
    { uid: u9, item: 'tmdb_1188148', s: 'watched' },
    { uid: u9, item: 'tmdb_792307',  s: 'watched' },
    { uid: u9, item: 'tmdb_666277', s: 'saved' },
    { uid: u10, item: 'tmdb_438631', s: 'watched' },
    { uid: u10, item: 'tmdb_60059',  s: 'saved' },
    { uid: u10, item: 'tmdb_1188148',s: 'saved' },
  ];

  const { error: statusErr } = await db.from('user_item_statuses').upsert(
    statuses.map(s => ({ user_id: s.uid, item_id: s.item, status: s.s })),
    { onConflict: 'user_id,item_id' }
  );
  if (statusErr) { console.error('  ✗ statuses:', statusErr.message); }
  else console.log(`  ✓ ${statuses.length} status`);

  // 8. Interações (support/oppose — reservadas mas já com dados)
  console.log('👍 Inserindo interações...');

  const interactions = [
    { ri: 0,  uid: u3,  type: 'support' },
    { ri: 0,  uid: u5,  type: 'support' },
    { ri: 0,  uid: u6,  type: 'support' },
    { ri: 1,  uid: u6,  type: 'support' },
    { ri: 2,  uid: u2,  type: 'support' },
    { ri: 2,  uid: u8,  type: 'support' },
    { ri: 5,  uid: u4,  type: 'support' },
    { ri: 5,  uid: u9,  type: 'support' },
    { ri: 6,  uid: u5,  type: 'support' },
    { ri: 8,  uid: u1,  type: 'support' },
    { ri: 8,  uid: u7,  type: 'support' },
    { ri: 9,  uid: u8,  type: 'support' },
    { ri: 9,  uid: u6,  type: 'support' },
    { ri: 10, uid: u7,  type: 'support' },
    { ri: 12, uid: u6,  type: 'support' },
    { ri: 15, uid: u3,  type: 'support' },
    { ri: 16, uid: u3,  type: 'support' },
    { ri: 4,  uid: u3,  type: 'support' },
  ];

  const validInteractions = interactions.filter(i => i.ri < recIds.length && recIds[i.ri]);

  const { error: intErr } = await db.from('recommendation_interactions').upsert(
    validInteractions.map(i => ({
      recommendation_id: recIds[i.ri],
      user_id:           i.uid,
      type:              i.type,
    })),
    { onConflict: 'recommendation_id,user_id' }
  );
  if (intErr) { console.error('  ✗ interactions:', intErr.message); }
  else console.log(`  ✓ ${validInteractions.length} interações`);

  console.log('\n✅ Seed concluído!');
  console.log('   Senha de todos os usuários: indica123');
  console.log('   Exemplo: ana@indica.app / indica123');
}

seed().catch(err => { console.error('❌', err); process.exit(1); });
