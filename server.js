import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import pg from "pg";
import { SEED_COURSES } from "./courses.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ACCESS_CODE = (process.env.ACCESS_CODE || "").trim();

/* ---------- opslag: Postgres, of geheugen als er geen DATABASE_URL is ---------- */
function memoryStore() {
  const m = new Map();
  console.warn("[bisque] Geen DATABASE_URL: data staat alleen in het geheugen en verdwijnt bij herstart.");
  return {
    async init() {},
    async get(p) { return m.has(p) ? m.get(p) : null; },
    async list(parent) {
      return [...m.entries()].filter(([k]) => k.slice(0, k.lastIndexOf("/")) === parent).map(([k, v]) => ({ path: k, data: v }));
    },
    async set(p, data) { m.set(p, data); },
    async insertIfMissing(p, data) { if (!m.has(p)) m.set(p, data); },
    async remove(p) {
      const gone = [...m.keys()].filter(k => k === p || k.startsWith(p + "/"));
      gone.forEach(k => m.delete(k)); return gone;
    }
  };
}
function pgStore(url) {
  const pool = new pg.Pool({
    connectionString: url,
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
    max: 10
  });
  return {
    async init() {
      await pool.query(`CREATE TABLE IF NOT EXISTS docs (
        path text PRIMARY KEY,
        parent text NOT NULL,
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`);
      await pool.query(`CREATE INDEX IF NOT EXISTS docs_parent_idx ON docs(parent)`);
    },
    async get(p) {
      const r = await pool.query("SELECT data FROM docs WHERE path=$1", [p]);
      return r.rows[0]?.data ?? null;
    },
    async list(parent) {
      const r = await pool.query("SELECT path, data FROM docs WHERE parent=$1", [parent]);
      return r.rows;
    },
    async set(p, data) {
      await pool.query(
        `INSERT INTO docs(path,parent,data,updated_at) VALUES($1,$2,$3,now())
         ON CONFLICT(path) DO UPDATE SET data=EXCLUDED.data, updated_at=now()`,
        [p, parentOf(p), data]);
    },
    async insertIfMissing(p, data) {
      await pool.query(`INSERT INTO docs(path,parent,data) VALUES($1,$2,$3) ON CONFLICT(path) DO NOTHING`, [p, parentOf(p), data]);
    },
    async remove(p) {
      const r = await pool.query(
        "DELETE FROM docs WHERE path=$1::text OR left(path, length($1::text)+1) = $1::text || '/' RETURNING path", [p]);
      return r.rows.map(x => x.path);
    }
  };
}
const store = process.env.DATABASE_URL ? pgStore(process.env.DATABASE_URL) : memoryStore();

/* ---------- welke paden zijn toegestaan ---------- */
const ID = "[A-Za-z0-9_-]{1,80}";
const DOC_RE = new RegExp(`^(courses/${ID}|rounds/${ID}|rounds/${ID}/scores/${ID})$`);
const COL_RE = new RegExp(`^(courses|rounds|rounds/${ID}/scores)$`);
const parentOf = p => p.slice(0, p.lastIndexOf("/"));

/* ---------- app ---------- */
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));

const authorized = code => !ACCESS_CODE || code === ACCESS_CODE;
app.use("/api", (req, res, next) => {
  if (!authorized(req.get("x-access-code") || "")) return res.status(401).json({ error: "Onjuiste toegangscode" });
  next();
});

app.get("/api/ping", (req, res) => res.json({ ok: true }));

app.get("/api/doc", async (req, res, next) => {
  try {
    const p = String(req.query.path || "");
    if (!DOC_RE.test(p)) return res.status(400).json({ error: "Ongeldig pad" });
    res.json({ path: p, data: await store.get(p) });
  } catch (e) { next(e); }
});

app.get("/api/col", async (req, res, next) => {
  try {
    const p = String(req.query.path || "");
    if (!COL_RE.test(p)) return res.status(400).json({ error: "Ongeldig pad" });
    res.json(await store.list(p));
  } catch (e) { next(e); }
});

app.put("/api/doc", async (req, res, next) => {
  try {
    const p = String(req.query.path || "");
    if (!DOC_RE.test(p)) return res.status(400).json({ error: "Ongeldig pad" });
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) return res.status(400).json({ error: "Ongeldige inhoud" });
    await store.set(p, body);
    broadcast([p]);
    res.status(204).end();
  } catch (e) { next(e); }
});

app.delete("/api/doc", async (req, res, next) => {
  try {
    const p = String(req.query.path || "");
    if (!DOC_RE.test(p)) return res.status(400).json({ error: "Ongeldig pad" });
    const gone = await store.remove(p);
    broadcast(gone.length ? gone : [p]);
    res.status(204).end();
  } catch (e) { next(e); }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, "public"), {
  setHeaders(res, file) {
    if (file.endsWith("index.html") || file.endsWith("sw.js")) res.setHeader("Cache-Control", "no-cache");
  }
}));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Te groot" });
  res.status(500).json({ error: "Serverfout" });
});

/* ---------- live updates ---------- */
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname !== "/ws" || !authorized(url.searchParams.get("code") || "")) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n"); socket.destroy(); return;
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws));
});
wss.on("connection", ws => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });
});
// houd verbindingen open achter proxies
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false; ws.ping();
  });
}, 25000);
function broadcast(paths) {
  const msg = JSON.stringify({ type: "change", paths });
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
}

/* ---------- start ---------- */
await store.init();
for (const c of SEED_COURSES) {
  const { id, ...data } = c;
  await store.insertIfMissing("courses/" + id, data);
}
server.listen(PORT, () => console.log(`[bisque] Draait op poort ${PORT}${ACCESS_CODE ? " (met toegangscode)" : ""}`));
