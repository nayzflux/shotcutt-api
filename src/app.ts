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

/**
 * Env variable
 */
const PORT = process.env.PORT!;

const SESSION_SECRET = process.env.PORT!;

const app = express();

/**
 * Middleware
 */

app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  session({
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
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 60 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use(passport.authenticate("session"));

/**
 * Routes
 */

app.use("/api", routes);

// Serve video
// TODO: Authorization
app.use("/public/videos", express.static("uploads/videos/"));

app.listen(PORT, () => console.log(`Server is listening on port :${PORT}`));
