import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getContextualNudge } from '../../src/utils/nudges.js';
import { sendPushNotification } from '../utils/push.js';

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

router.get('/daily', (req, res) => {
  res.json({ status: 'ok', message: 'Endpoint nudge/daily aktif. Coba tembak pake POST dan header x-nudge-secret buat eksekusi.' });
});

router.post('/daily', async (req, res) => {
  console.log('[Nudge] Daily trigger received');
  const secret = req.headers['x-nudge-secret'];
  const NUDGE_SECRET = process.env.NUDGE_SECRET || "xx";

  if (secret !== NUDGE_SECRET) {
    console.error('[Nudge] Unauthorized attempt: secret mismatch');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabase) {
    console.error('[Nudge] Supabase not initialized');
    return res.status(500).json({ error: 'Supabase not initialized' });
  }

  try {
    console.log('[Nudge] Fetching users...');
    // Try to get from 'users' table first (which contains stats)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, stats, push_subscription')
      .not('push_subscription', 'is', null);

    let usersToNudge = users || [];

    // Fallback or addition: check 'push_subscriptions' table if users doesn't cover all
    if (userError || usersToNudge.length === 0) {
      console.log('[Nudge] Falling back to push_subscriptions table');
      const { data: subs, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*');
      
      if (!subError && subs) {
        // Map these to a similar format
        const subMap = subs.map(sub => ({
          id: sub.endpoint,
          stats: {},
          push_subscription: sub
        }));
        // Merge or just use these if users was empty
        if (usersToNudge.length === 0) {
          usersToNudge = subMap;
        }
      }
    }

    console.log(`[Nudge] Processing ${usersToNudge.length} users`);
    let sentCount = 0;
    let failedCount = 0;

    for (const user of usersToNudge) {
      try {
        const stats = user.stats || {};
        const message = getContextualNudge(stats);

        if (user.push_subscription) {
          const result = await sendPushNotification(user.push_subscription, {
            title: "Hadir.in",
            body: message,
            icon: "/icon-192.png"
          });

          if (result === true) {
            sentCount++;
          } else {
            failedCount++;
            if (typeof result === 'object' && (result as any).expired) {
              // Delete expired subscription
              const endpoint = user.push_subscription.endpoint || user.push_subscription;
              console.log('[Nudge] Cleaning up expired subscription');
              await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
              await supabase.from('users').update({ push_subscription: null }).eq('id', user.id).maybeSingle();
            }
          }
        }
      } catch (e) {
        failedCount++;
        console.error(`[Nudge] Failed sending to user ${user.id}`, e);
      }
    }

    console.log(`[Nudge] Done. Sent: ${sentCount}, Failed: ${failedCount}`);
    res.json({
      success: true,
      usersProcessed: usersToNudge.length,
      notificationsSent: sentCount,
      failed: failedCount
    });

  } catch (err: any) {
    console.error('[Nudge] Daily error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
