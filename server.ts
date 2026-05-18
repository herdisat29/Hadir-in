import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const RANDOM_NUDGES = [
  "Gimana hari ini? Mau cerita?",
  "Istirahat bentar, narik napas dulu.",
  "Apa yang paling bikin kamu senyum tadi?",
  "Gue di sini kalau kamu butuh temen ngobrol.",
  "Capek ya? Gapapa, besok kita coba lagi.",
  "Lagi mikirin apa malam ini?",
  "Semesta emang berisik, tapi di sini lo aman.",
  "Udah minum air putih belum hari ini?",
];

app.use(express.json());

// Web Push Configuration
// In a real app, generate these with: npx web-push generate-vapid-keys
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || "BK-o7GJxgvS-Po09cPiA-B5ZMRbELqqGIk5VBvcJHd6ai4VbWxQ6YbV_3LWmGFdthL_57VLHjCI4jqtny_vVMp4";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "rfQyHdalacHfq1uJDtMkYBx8GutEtHxaRaMSWfqz7Ak";

if (privateVapidKey && privateVapidKey !== "example-private-key") {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hadirin@example.com",
    publicVapidKey,
    privateVapidKey
  );
}

// In-memory store (Reset on restart)
let subscriptions: any[] = [];

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Push endpoints
app.get("/api/push/key", (req, res) => {
  res.json({ publicKey: publicVapidKey });
});

app.post("/api/push/subscribe", (req, res) => {
  const subscription = req.body;
  // Simple check to avoid duplicates
  if (!subscriptions.find(s => s.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription);
    console.log(`New subscriber! Total: ${subscriptions.length}`);
  }
  res.status(201).json({});
});

app.post("/api/push/test", async (req, res) => {
  const payload = JSON.stringify({
    title: "Hadir.in",
    body: "halo! ini tes push notif dari server. berarti udah jalan beneran 😌"
  });

  try {
    const promises = subscriptions.map(sub => 
      webpush.sendNotification(sub, payload).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired/gone
          subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
        }
      })
    );
    await Promise.all(promises);
    res.status(200).json({ success: true, count: subscriptions.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Vite Middleware/Static Serve
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*all", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Periodic Nudge (Every 4 hours for demo purposes)
setInterval(async () => {
  if (subscriptions.length === 0) return;
  
  const nudge = RANDOM_NUDGES[Math.floor(Math.random() * RANDOM_NUDGES.length)];
  const payload = JSON.stringify({
    title: "Hadir.in",
    body: nudge
  });

  const promises = subscriptions.map(sub => 
    webpush.sendNotification(sub, payload).catch(err => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
      }
    })
  );
  await Promise.all(promises);
  console.log(`Sent periodic nudge to ${subscriptions.length} users: ${nudge}`);
}, 1000 * 60 * 60 * 1); // Every 1 hour

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
