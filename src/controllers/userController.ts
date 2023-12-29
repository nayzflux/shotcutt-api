import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { updateUserSchema } from "../schemas/userSchema";
import * as fileService from "../services/deleteService";

export const findAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      provider_id: true,
      provider_name: true,
      is_social_auth: true,
      password: false,
      avatar_url: true,
    },
  });

  res.status(200).json({ users });

  res.sendStatus(200);
};

export const findCurrentUser = async (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
};

export const findUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      username: true,
      password: false,
      avatar_url: true,
    },
  });

  res.status(200).json({ user });
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const body = updateUserSchema.safeParse(req.body);

  if (!body.success) return res.sendStatus(400);

  const data = body.data;

  const user = await prisma.user.update({
    where: {
      id,
    },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      provider_id: true,
      provider_name: true,
      is_social_auth: true,
      password: false,
      avatar_url: true,
    },
  });

  res.status(200).json({ user });
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.delete({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      provider_id: true,
      provider_name: true,
      is_social_auth: true,
      password: false,
      avatar_url: true,
      videos: true
    },
  });

  res.status(200).json({ user });

  // Delete all user video files
  for (const vid of user.videos) {
    fileService.deleteFile(vid);
  }
};
