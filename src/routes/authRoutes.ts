import { Router } from "express";
import passport from "../strategies/spotifyStratagy";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";

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
 * Spotify Provider
 */
router.get("/spotify", passport.authenticate("spotify"));
router.get(
  "/spotify/callback",
  passport.authenticate("spotify"),
  async (req, res) => {
    console.log(req.session);
    res.redirect("/");
  }
);

// TODO: Other providers

export default router;
