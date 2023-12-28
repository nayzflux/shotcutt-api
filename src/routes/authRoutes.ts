import { Router } from "express";
import passport from "../strategies/spotifyStratagy";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";
import { login, logout, register } from "../controllers/authController";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

const router = Router();

/**
 * Email & Password Auth
 */

passport.use(
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    async function verify(req: any, username: any, password: any, cb: any) {
      console.log(req.body);

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

      cb(null, { id: user.id });
    }
  )
);

router.post("/login", passport.authenticate("local"), login);

router.post("/register", register);

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

// TODO: Other providers

export default router;
