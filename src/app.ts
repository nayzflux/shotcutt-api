if (process.env.NODE_ENV !== "production") {
    const dotenv = require("dotenv");
    dotenv.config();
}

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
import rateLimit from "express-rate-limit";
import multer from "multer";
import { extractZip } from "./services/zipServices";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

/**
 * Env variable
 */
const PORT = process.env.PORT!;

const CLIENT_URL = process.env.CLIENT_URL!;

const SESSION_SECRET = process.env.SESSION_SECRET!;

// Redis
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

const app = express();
const httpServer = createServer(app);

pubClient.connect();
subClient.connect();

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
});

// Trust the headers set by the reverse proxy
app.set("trust proxy", 1);

/**
 * Webhook
 */

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

// Define the rate limit options
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});

// Apply the rate limiter to all requests
// app.use(limiter);

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
app.use("/public", express.static("uploads/"));

/**
 * Webhook - Processing service
 */

// Configuration de Multer pour le stockage des vidéos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/scenes");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: async function (req, file, cb) {
        if (req.body.secret === process.env.PROCESS_WH_SECRET) {
            return cb(null, true);
        }

        cb(new Error("Invalid secret"));
    },
});

app.post("/webhook/process", upload.single("file"), async (req, res) => {
    const { event, video_id, scenes } = req.body;

    console.log(event);

    try {
        if (event === "PROCESS_FAILED") {
            const video = await prisma.video.update({
                where: { id: video_id },
                data: {
                    status: "FAILED",
                },
            });

            io.to(`user:${video.user_id}`).emit("video_process_failed");

            console.log("[WEBHOOK] Video process failed");
        }

        if (event === "PROCESS_SUCCEED") {
            const video = await prisma.video.update({
                where: { id: video_id },
                data: {
                    status: "PROCESSED",
                    scene_urls: scenes.map((_: any, i: number) => "Scene" + i),
                },
            });

            io.to(`user:${video.user_id}`).emit("video_process_success");

            extractZip(
                `uploads/scenes/${video.id}.zip`,
                `uploads/scenes/${video.id}`
            );

            console.log("[WEBHOOK] Video process succeed");

            res.sendStatus(200);
        }

        if (event === "PROCESS_STARTED") {
            const video = await prisma.video.update({
                where: { id: video_id },
                data: {
                    status: "PROCESSING",
                },
            });

            io.to(`user:${video.user_id}`).emit("video_process_start");

            console.log("[WEBHOOK] Video process started");

            res.sendStatus(200);
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

httpServer.listen(PORT, () =>
    console.log(`[*] Server is listening on port :${PORT}`)
);

export { io };
