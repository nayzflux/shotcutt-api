import passport from "passport";
import { Strategy } from "passport-spotify";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SCERET = process.env.SPOTIFY_CLIENT_SECRET!;
const HOST = process.env.HOST!;

passport.use(
  new Strategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SCERET,
      callbackURL: `${HOST}/api/auth/spotify/callback`,
      scope: ["user-read-email"],
      showDialog: true,
    },
    async function (accessToken, refreshToken, expires_in, profile, done) {
      const email = profile.emails?.[0].value;

      // console.log(profile);

      if (!email) return done(new Error("Email is required"));

      try {
        const user = await prisma.user.upsert({
          where: {
            is_social_auth: true,
            provider_id_provider_name: {
              provider_id: profile.id,
              provider_name: "SPOTIFY",
            },
          },
          update: {},
          create: {
            username: profile.username,
            name: profile.displayName,
            email: email,

            password: null,

            provider_id: profile.id,
            provider_name: "SPOTIFY",
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

        console.log(`[AUTH] Spotify: Auth successfull ${profile.displayName}`);

        return done(null, user);
      } catch (err) {
        console.error(`[AUTH] Spotify: Auth failed ${profile.displayName}`);

        console.log(err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
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

export default passport;
