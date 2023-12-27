import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";

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
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: true,
      // 15 days
      maxAge: 15 * 24 * 60 * 60 * 1000,
    },
  })
);

app.listen(PORT, () => console.log(`Server is listening on port :${PORT}`));
