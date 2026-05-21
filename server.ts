import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { getContextualNudge } from "./src/utils/nudges.js";
import chatRouter from "./server/api/chat.js";
import { globalLimiter } from "./server/middleware/rateLimiter.js";

// For CJS compatibility after bundling
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  console.log("=== HADIR.IN SERVER STARTING (SUPABASE MODE) ===");
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  // Initialize Supabase
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let supabase: any = null;

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      console.log("Supabase connection initialized successfully.");
    } catch (err) {
      console.error("CRITICAL: Supabase Initialization Failed:", err);
    }
  } else {
    console.warn("MISSING CREDENTIALS: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in Environment. Database operations will be skipped.");
  }

  const RANDOM_NUDGES = [
    "hari ini kepala lo rame gak?",
    "udah istirahat belum hari ini?",
    "gimana hari lo sejauh ini?",
    "jangan lupa napas pelan-pelan ya.",
    "lagi pengen cerita atau diem aja dulu?",
    "semoga hari ini gak terlalu berat.",
    "masih kuat sampai malam ini?",
    "kadang capek itu cuma butuh ditemenin bentar.",
    "hari ini ada hal kecil yang bikin senyum gak?",
    "kalau dunia lagi berisik, sini dulu aja.",
    "jangan lupa badan lo juga butuh istirahat.",
    "gue masih di sini kok.",
    "malam ini kepala lo lagi mikirin apa?",
    "pelan-pelan juga gapapa.",
    "hari ini berat ya kayaknya.",
    "udah makan belum?",
    "gak semua hal harus langsung beres hari ini.",
    "kalau capek, istirahat dulu aja bentar.",
    "semoga tidur lo nanti lebih tenang.",
    "kadang hadir sebentar buat diri sendiri juga penting.",
    "Lagi napas nggak? Inget napas yang dalem.",
    "Kerja mulu, kedip gih. Mata lo butuh istirahat.",
    "Minum air putih dulu, gelas lo udah kosong tuh kayaknya.",
    "Gue masih di sini kok. Cuma mau bilang semangat ya.",
    "Kepala lo udah mulai rame? Coba liat ke luar jendela bentar.",
    "Istirahat 5 menit gih. Dunianya gak bakal runtuh kok.",
    "Gue jagain tab ini. Lo lanjutin aja dulu kesibukannya.",
    "Coffee break? Atau teh anget?",
    "Udah jam segini. Jangan lupa makan ya."
  ];

  app.use(express.json());
  app.use("/api", globalLimiter);
  app.use("/api", chatRouter);

  // Web Push Configuration
  const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || "BK-o7GJxgvS-Po09cPiA-B5ZMRbELqqGIk5VBvcJHd6ai4VbWxQ6YbV_3LWmGFdthL_57VLHjCI4jqtny_vVMp4";
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "rfQyHdalacHfq1uJDtMkYBx8GutEtHxaRaMSWfqz7Ak";

  if (privateVapidKey && privateVapidKey !== "example-private-key") {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:hadirin@example.com",
      publicVapidKey,
      privateVapidKey
    );
  }

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      supabase: supabase ? "initialized" : "null",
      production: isProduction
    });
  });

  // Direct Daily Nudge Endpoint (Moved from router to avoid nesting issues)
  app.get("/api/nudge/daily", (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Endpoint nudge/daily aktif. Silakan gunakan POST dengan header x-nudge-secret.' 
    });
  });

  app.post("/api/nudge/daily", async (req, res) => {
    console.log('[Nudge] Daily trigger received via POST');
    const secret = req.headers['x-nudge-secret'];
    const NUDGE_SECRET = process.env.NUDGE_SECRET || "xx";

    if (secret !== NUDGE_SECRET) {
      console.error('[Nudge] Unauthorized: secret mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!supabase) {
      console.error('[Nudge] Supabase not initialized');
      return res.status(500).json({ error: 'Supabase not initialized' });
    }

    try {
      console.log('[Nudge] Fetching users with push subscriptions...');
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, stats, push_subscription')
        .not('push_subscription', 'is', null);

      let usersToNudge = users || [];

      if (userError || usersToNudge.length === 0) {
        console.log('[Nudge] Falling back to push_subscriptions table');
        const { data: subs, error: subError } = await supabase
          .from('push_subscriptions')
          .select('*');
        
        if (!subError && subs) {
          usersToNudge = subs.map((sub: any) => ({
            id: sub.endpoint,
            stats: {},
            push_subscription: sub
          }));
        }
      }

      console.log(`[Nudge] Processing ${usersToNudge.length} users`);
      let sentCount = 0;
      let failedCount = 0;

      const { sendPushNotification } = await import("./server/utils/push.js");

      for (const user of usersToNudge) {
        try {
          const stats = user.stats || {};
          const message = getContextualNudge(stats);

          if (user.push_subscription) {
            const result = await sendPushNotification(user.push_subscription, {
              title: "Hadir.in",
              body: message
            });

            if (result === true) {
              sentCount++;
            } else {
              failedCount++;
              if (result && typeof result === 'object' && (result as any).expired) {
                const endpoint = user.push_subscription.endpoint || user.push_subscription;
                await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
                await supabase.from('users').update({ push_subscription: null }).eq('id', user.id).maybeSingle();
              }
            }
          }
        } catch (e) {
          failedCount++;
        }
      }

      console.log(`[Nudge] Finished. Success: ${sentCount}, Failed: ${failedCount}`);
      res.json({ success: true, usersProcessed: usersToNudge.length, sent: sentCount, failed: failedCount });
    } catch (err: any) {
      console.error('[Nudge] Daily Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/db-status", async (req, res) => {
    if (!supabase) return res.status(500).json({ status: "Supabase not initialized" });
    try {
      const { error, count } = await supabase.from('push_subscriptions').select('*', { count: 'exact', head: true });
      if (error) throw error;
      res.json({ status: "Table push_subscriptions found", count: count || 0 });
    } catch (err) {
      console.error("DB Status Error:", err);
      res.status(500).json({ 
        status: "Error atau Tabel push_subscriptions belum ada", 
        error: (err as Error).message,
        sqlHint: "CREATE TABLE push_subscriptions (endpoint TEXT PRIMARY KEY, keys JSONB, updated_at TIMESTAMPTZ);"
      });
    }
  });

  // Push endpoints
  app.get("/api/push/key", (req, res) => {
    res.json({ publicKey: publicVapidKey });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    if (!supabase) {
      console.error("Push Subscribe Error: supabase is null");
      return res.status(500).json({ error: "Supabase not initialized. Config mungkin bermasalah." });
    }
    const subscription = req.body;
    console.log("Receiving push subscription payload:", JSON.stringify(subscription));
    
    if (!subscription.endpoint || !subscription.keys) {
      console.error("Invalid subscription payload missing endpoint or keys");
      return res.status(400).json({ error: "Payload subscription gak lengkap (missing endpoint or keys)" });
    }

    try {
      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        updated_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

      if (error) {
        console.error("Supabase Upsert Error Detail:", error);
        throw error;
      }
      
      console.log("Subscription saved successfully for endpoint:", subscription.endpoint.slice(0, 40) + "...");
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Push Subscribe Supabase Error:", err);
      res.status(500).json({ error: "Gagal simpan subscription ke database: " + (err as Error).message });
    }
  });

  app.post("/api/push/test", async (req, res) => {
    if (!supabase) {
      console.error("Push Test Error: supabase is null");
      return res.status(500).json({ error: "Supabase not initialized. Config mungkin bermasalah." });
    }
    
    try {
      console.log("Fetching subscriptions from Supabase...");
      const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
      if (error) throw error;
      
      console.log(`Found ${subs?.length || 0} subscriptions.`);
      
      let sentCount = 0;
      const promises = (subs || []).map(async (sub: any) => {
        const { sendPushNotification } = await import("./server/utils/push.js");
        const success = await sendPushNotification(sub, {
          title: "Hadir.in",
          body: "halo! ini tes push notif dari server. berarti udah jalan beneran 😌"
        });
        if (success === true) sentCount++;
        else if (typeof success === 'object' && success.expired) {
           await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      });

      await Promise.all(promises);
      res.status(200).json({ success: true, count: sentCount });
    } catch (err) {
      console.error("Push Test Final Error:", err);
      res.status(500).json({ error: "Error pas ngetes push: " + (err as Error).message });
    }
  });

  // Redirect or remove old daily nudge endpoint to use the new router
  app.post("/api/push/daily", (req, res) => {
    res.redirect(307, "/api/nudge/daily");
  });

  app.post("/api/push/nudge", async (req, res) => {
      const body = req.body || {};

      const secret = body.secret;
      const message = body.message;

      if (process.env.NUDGE_SECRET && secret !== process.env.NUDGE_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
      }

    if (!supabase) {
      return res.status(500).json({ error: "Supabase not initialized" });
    }

    const nudge =
      message ||
      RANDOM_NUDGES[Math.floor(Math.random() * RANDOM_NUDGES.length)];

    const payload = JSON.stringify({
      title: "Hadir.in",
      body: nudge,
      url: "/",
    });

    try {
      const { data: subs, error } = await supabase
        .from("push_subscriptions")
        .select("*");

      if (error) throw error;

      if (!subs || subs.length === 0) {
        return res.json({ success: true, count: 0 });
      }

      const promises = subs.map((sub) =>
        webpush.sendNotification(sub as any, payload).catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        })
      );

      await Promise.all(promises);

      console.log(`Scheduler sent nudge to ${subs.length} users`);

      res.json({
        success: true,
        count: subs.length,
        nudge,
      });
    } catch (err) {
      console.error("Nudge Error:", err);

      res.status(500).json({
        error: (err as Error).message,
      });
    }
  });

  app.get("/api/push/nudge", async (req, res) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not initialized" });
    }

    const nudge = RANDOM_NUDGES[Math.floor(Math.random() * RANDOM_NUDGES.length)];
    const payload = JSON.stringify({
      title: "Hadir.in",
      body: nudge,
      url: "/",
    });

    try {
      const { data: subs, error } = await supabase
        .from("push_subscriptions")
        .select("*");

      if (error) throw error;

      if (!subs || subs.length === 0) {
        return res.json({
          success: true,
          count: 0,
        });
      }

      const promises = subs.map((sub) => {
        return webpush.sendNotification(sub as any, payload).catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        });
      });

      await Promise.all(promises);

      console.log(`Cron nudge sent to ${subs.length} users`);

      res.json({
        success: true,
        count: subs.length,
        nudge,
      });
    } catch (err) {
      console.error("Cron nudge error:", err);

      res.status(500).json({
        error: (err as Error).message,
      });
    }
  });

  // Vite Middleware/Static Serve
  if (!isProduction) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
