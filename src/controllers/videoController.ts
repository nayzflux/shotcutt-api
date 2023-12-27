import { RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";
import path from "node:path";
import * as processingService from "../services/processingService";

export const createVideo: RequestHandler = async (req, res) => {
  const user = req.user as User;

  const file = req.file;

  if (!file) return res.sendStatus(400);

  const video = await prisma.video.create({
    data: {
      user_id: user.id,
      name: file.originalname,
      url: `/uploads/videos/${file.filename}`,
      scene_urls: [],
      status: "WAITING",
      size: file.size,
      format: path.extname(file.originalname),
    },
  });

  processingService.process(video, file.filename);

  res.status(201).json({ video });
};

export const findAllVideos: RequestHandler = async (req, res) => {
  const user = req.user as User;

  const videos = await prisma.video.findMany({
    where: {
      user_id: user.id,
    },
  });

  res.status(200).json({ videos });
};

export const findVideo: RequestHandler = async (req, res) => {
  const user = req.user as User;
  const { id } = req.params;

  const video = await prisma.video.findFirst({
    where: {
      user_id: user.id,
      id,
    },
  });

  if (!video) {
    return res.sendStatus(404);
  }

  res.status(200).json({ video });
};

export const deleteVideo: RequestHandler = async (req, res) => {
  const user = req.user as User;
  const { id } = req.params;

  const video = await prisma.video.delete({
    where: {
      user_id: user.id,
      id,
    },
  });

  if (!video) {
    return res.sendStatus(404);
  }

  res.status(200).json({ video });
};
