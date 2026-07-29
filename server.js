const { createServer } = require("http");
const { Server } = require("socket.io");
const Database = require("better-sqlite3");
const jwt = require("jsonwebtoken");
const { parse } = require("url");

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const PORT = parseInt(process.env.PORT || "3000", 10);

const db = new Database("./dev.db");
db.pragma("journal_mode = WAL");

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((c) => {
    const [key, ...rest] = c.trim().split("=");
    if (key) cookies[key] = rest.join("=");
  });
  return cookies;
}

async function main() {
  const { default: next } = await import("next");

  const dev = process.env.NODE_ENV !== "production";
  const app = next({ dev, hostname: "localhost", port: PORT });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: dev ? ["http://localhost:3000", "http://localhost:3001"] : false,
      credentials: true,
    },
    addTrailingSlash: false,
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyToken(token);

      const row = db
        .prepare("SELECT id, role FROM User WHERE id = ?")
        .get(payload.sub);

      if (!row) {
        return next(new Error("User not found"));
      }

      socket.data.userId = row.id;
      socket.data.role = row.role;

      const rooms = db
        .prepare("SELECT roomId FROM Participant WHERE userId = ?")
        .all(row.id);

      rooms.forEach((r) => {
        socket.join(r.roomId);
      });

      next();
    } catch (err) {
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.data;

    console.log(`Socket connected: ${userId} (${role})`);

    socket.on("room:activity", async (data, ack) => {
      try {
        const { roomId, action, details } = data;

        const participant = db
          .prepare(
            "SELECT COUNT(*) as count FROM Participant WHERE roomId = ? AND userId = ?"
          )
          .get(roomId, userId);

        if (!participant || participant.count === 0) {
          if (ack) ack({ error: "Access denied" });
          return;
        }

        const id = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        db.prepare(
          "INSERT INTO ActivityLog (id, roomId, userId, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(id, roomId, userId, action, JSON.stringify(details ?? {}), timestamp);

        const newActivity = { id, action, details, timestamp, userId };

        socket.to(roomId).emit("activity:new", { roomId, activity: newActivity });

        if (ack) ack({ success: true, activity: newActivity });
      } catch (err) {
        console.error("room:activity error:", err);
        if (ack) ack({ error: "Internal error" });
      }
    });

    socket.on("room:status", async (data, ack) => {
      try {
        const { roomId, status } = data;

        const participant = db
          .prepare(
            "SELECT COUNT(*) as count FROM Participant WHERE roomId = ? AND userId = ?"
          )
          .get(roomId, userId);

        if (!participant || participant.count === 0) {
          if (ack) ack({ error: "Access denied" });
          return;
        }

        socket.to(roomId).emit("room:status", { roomId, status, updatedBy: userId });
        if (ack) ack({ success: true });
      } catch (err) {
        console.error("room:status error:", err);
        if (ack) ack({ error: "Internal error" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${userId}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> Socket.IO path: /api/socket`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
