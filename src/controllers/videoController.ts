import { RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";
import path from "node:path";
import * as processingService from "../services/processingService";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import fs from "node:fs";
import { deleteFile } from "../services/deleteService";

export const createVideo: RequestHandler = async (req, res) => {
  const user = req.user as User;

  const file = req.file;

  if (!file) return res.sendStatus(400);

  const video = await prisma.video.create({
    data: {
      user_id: user.id,
      name: file.originalname,
      url: `/public/originals/${file.filename}`,
      scene_urls: [],
      status: "WAITING",
      size: file.size,
      filename: file.filename,
      format: path.extname(file.originalname),
    },
  });

  // Rename file for easier usage
  fs.renameSync(
    `uploads/originals/${req.file?.filename}`,
    "uploads/originals/" + video.id + ".mp4"
  );

  processingService.processVideo(video, file.filename);

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

  try {
    const video = await prisma.video.delete({
      where: {
        user_id: user.id,
        id,
        status: "PROCESSED",
      },
    });

    // if (video.status === "WAITING") {
    //   return res.sendStatus(409);
    // }

    // if (video.status === "PROCESSING") {
    //   return res.sendStatus(409);
    // }

    res.status(200).json({ video });

    deleteFile(video);
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2025") return res.sendStatus(404);
    }

    res.sendStatus(500);
  }
};
