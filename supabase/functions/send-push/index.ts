import { createClient } from 'jsr:@supabase/supabase-js@2';
// @ts-ignore - npm package
import webpush from 'npm:web-push@3';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = await req.json();
  const notification = body?.record;

  if (!notification?.recipient_id) {
    return new Response('Missing recipient_id', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', notification.recipient_id);

  if (!subscriptions || subscriptions.length === 0) {
    return new Response('No subscriptions', { status: 200 });
  }

  const pushPayload = JSON.stringify({
    title: 'FilmOrion',
    body: 'Você tem uma nova notificação.',
    url: '/notifications',
  });

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        pushPayload,
      )
    ),
  );

  // Remove expired/invalid subscriptions (410 Gone)
  const expiredEndpoints: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'rejected' && (r.reason?.statusCode === 410 || r.reason?.statusCode === 404)) {
      expiredEndpoints.push(subscriptions[i].endpoint);
    }
  }
  if (expiredEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
  }

  return new Response('OK', { status: 200 });
});
