import { User } from "@prisma/client";
import { RequestHandler } from "express";

export const auth: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }

  const user = req.user as User;

  console.log(`[AUTH] Logged as ${user.name}`);

  next();
};
