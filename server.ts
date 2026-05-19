import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

// For CJS compatibility after bundling
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  console.log("=== HADIR.IN SERVER STARTING (SUPABASE MODE) ===");
  const app = express();
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
    const payload = JSON.stringify({
      title: "Hadir.in",
      body: "halo! ini tes push notif dari server. berarti udah jalan beneran 😌",
      url: "/"
    });

    try {
      console.log("Fetching subscriptions from Supabase...");
      const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
      if (error) throw error;
      
      console.log(`Found ${subs?.length || 0} subscriptions.`);
      
      const promises = (subs || []).map(sub => 
        webpush.sendNotification(sub as any, payload).catch(async err => {
          console.warn("Failed to send notification to one subscriber:", err.statusCode);
          if (err.statusCode === 410 || err.statusCode === 404) {
             await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        })
      );
      await Promise.all(promises);
      res.status(200).json({ success: true, count: subs?.length || 0 });
    } catch (err) {
      console.error("Push Test Final Error:", err);
      res.status(500).json({ error: "Error pas ngetes push: " + (err as Error).message });
    }
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
