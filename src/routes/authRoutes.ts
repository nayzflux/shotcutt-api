import { Router } from "express";
import passport from "../strategies/spotifyStratagy";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";
import { login, logout, register } from "../controllers/authController";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { Strategy as DiscordStrategy } from "passport-discord";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Strategy as GitHubStrategy, Profile } from "passport-github2";

const router = Router();

// Save ID in session
passport.serializeUser(async function (_user, done) {
  try {
    const user = _user as User;
    done(null, user.id);
  } catch (err) {
    console.error("[AUTH] Session: Serialize user failed");
    return done(err);
  }
});

// Get user from session
passport.deserializeUser(async function (_id, done) {
  try {
    const id = _id as string;

    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        videos: true,
        name: true,
        provider_id: true,
        provider_name: true,
        is_social_auth: true,
        avatar_url: true,
        password: false,
      },
    });

    done(null, user);
  } catch (err) {
    console.error("[AUTH] Session: Deserialize user failed");
    return done(err);
  }
});

/**
 * Email & Password Auth
 */

passport.use(
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    async function verify(req: any, username: any, password: any, cb: any) {
      // console.log(req.body);

      const { email } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (!user) return cb(new Error("Not Found"));

      const hash = user.password;

      if (!hash)
        return cb(
          new Error(
            "Please use the same social provider you use the first time"
          )
        );

      const isMatching = await bcrypt.compare(password, hash);

      if (!isMatching) return cb(new Error("Password mismatch"));

      cb(null, {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      });
    }
  )
);

router.post("/login", passport.authenticate("local"), login);

router.post("/register", register);

/**
 * Global
 */
router.post("/logout", logout);

/**
 * Spotify Provider
 */
router.get("/spotify", passport.authenticate("spotify"));
router.get(
  "/spotify/callback",
  passport.authenticate("spotify"),
  async (req, res) => {
    console.log(req.session);
    res.redirect(process.env.CLIENT_URL + "/dashboard");
  }
);

/**
 * Discord Provider
 */

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

const HOST = process.env.HOST!;

passport.use(
  new DiscordStrategy(
    {
      clientID: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
      callbackURL: `${HOST}/api/auth/discord/callback`,
      scope: ["identify", "email"],
    },
    async function (accessToken, refreshToken, profile, done) {
      const email = profile.email;

      const avatar = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;

      if (!email) return done(new Error("Email is required"));

      try {
        const user = await prisma.user.upsert({
          where: {
            is_social_auth: true,
            provider_id_provider_name: {
              provider_id: profile.id,
              provider_name: "DISCORD",
            },
          },
          update: {},
          create: {
            username: profile.username,
            name: profile.username,
            email: email,

            password: null,

            avatar_url: avatar,

            provider_id: profile.id,
            provider_name: "DISCORD",
            is_social_auth: true,
          },
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            provider_id: true,
            provider_name: true,
            is_social_auth: true,
            password: false,
          },
        });

        console.log(user);

        console.log(`[AUTH] Discord: Auth successfull ${profile.displayName}`);

        return done(null, user);
      } catch (err) {
        console.error(`[AUTH] Discord: Auth failed ${profile.displayName}`);

        console.log(err);

        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === "P2002") {
            return done(
              new Error("User already exists with another auth provider")
            );
          }
        }

        return done(new Error("Unknow error"));
      }
    }
  )
);

router.get("/discord", passport.authenticate("discord"));
router.get(
  "/discord/callback",
  passport.authenticate("discord"),
  async (req, res) => {
    console.log(req.session);
    res.redirect(process.env.CLIENT_URL + "/dashboard");
  }
);

/**
 * Github provider
 */

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: `${HOST}/api/auth/github/callback`,
      scope: ["read:user", "user:email"],
    },
    async function (
      _accessToken: any,
      _refreshToken: any,
      profile: Profile,
      done: any
    ) {
      const email = profile.emails?.[0].value;
      const username = profile.username;
      const name = profile.displayName;

      console.log(profile);

      if (!email) return done(new Error("Email is required"));
      if (!username) return done(new Error("Username is required"));
      if (!name) return done(new Error("Name is required"));

      try {
        const user = await prisma.user.upsert({
          where: {
            is_social_auth: true,
            provider_id_provider_name: {
              provider_id: profile.id,
              provider_name: "GITHUB",
            },
          },
          update: {},
          create: {
            username,
            name,
            email: email,

            password: null,

            avatar_url: null,

            provider_id: profile.id,
            provider_name: "GITHUB",
            is_social_auth: true,
          },
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            provider_id: true,
            provider_name: true,
            is_social_auth: true,
            password: false,
          },
        });

        console.log(user);

        console.log(`[AUTH] Github: Auth successfull ${profile.displayName}`);

        return done(null, user);
      } catch (err) {
        console.error(`[AUTH] Github: Auth failed ${profile.displayName}`);

        console.log(err);

        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === "P2002") {
            return done(
              new Error("User already exists with another auth provider")
            );
          }
        }

        return done(new Error("Unknow error"));
      }
    }
  )
);

router.get("/github", passport.authenticate("github"));
router.get(
  "/github/callback",
  passport.authenticate("github"),
  async (req, res) => {
    console.log(req.session);
    res.redirect(process.env.CLIENT_URL + "/dashboard");
  }
);

export default router;
