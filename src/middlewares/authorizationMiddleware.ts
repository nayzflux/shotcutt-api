import { User } from "@prisma/client";
import { RequestHandler } from "express";

export const doUserOwnRessource: RequestHandler = (req, res, next) => {
  const user = req.user as User;

  if (req.params.id === user.id) return next();

  res.sendStatus(403);
};

export const isUserAdmin: RequestHandler = (req, res, next) => {
  // TODO: Role check
  res.sendStatus(403);
};
