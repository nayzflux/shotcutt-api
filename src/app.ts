import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";

import routes from "./routes/routes";
import { prisma } from "./lib/prisma";
import passport from "passport";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { User } from "@prisma/client";

/**
 * Env variable
 */
const PORT = process.env.PORT!;

const CLIENT_URL = process.env.CLIENT_URL!;

const SESSION_SECRET = process.env.SESSION_SECRET!;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

/**
 * Webhook
 */
// app.use()

/**
 * Middleware
 */

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

const sessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 60 * 60 * 1000,
  dbRecordIdIsSessionId: true,
  dbRecordIdFunction: undefined,
});

const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: true,
    // 15 days
    maxAge: 15 * 24 * 60 * 60 * 1000,
  },
  store: sessionStore,
});

app.use(sessionMiddleware);

app.use(passport.authenticate("session"));

/**
 * Websocket
 */

io.engine.use(sessionMiddleware);

io.engine.use(passport.authenticate("session"));

io.on("connection", (socket) => {
  // @ts-ignore
  console.log(socket.request.isAuthenticated());

  // @ts-ignore
  if (!socket.request.isAuthenticated()) {
    socket.disconnect();
    return;
  }

  // @ts-ignore
  const user = socket.request.user as User;

  socket.join(`user:${user.id}`);

  console.log("[WEBSOCKET] " + user.name);
});

/**
 * Routes
 */

app.use("/api", routes);

// Serve video
// TODO: Authorization
app.use("/public/videos", express.static("uploads/videos/"));

httpServer.listen(PORT, () =>
  console.log(`Server is listening on port :${PORT}`)
);

export { io };
