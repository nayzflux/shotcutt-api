import { auth } from "../middlewares/authMiddleware";
import authRoutes from "./authRoutes";
import {
  doUserOwnRessource,
  isUserAdmin,
} from "../middlewares/permissionMiddleware";

import { Router } from "express";
import {
  deleteUser,
  findAllUsers,
  findCurrentUser,
  findUser,
  updateUser,
} from "../controllers/userController";
import {
  findAllVideos,
  createVideo,
  findVideo,
  deleteVideo,
} from "../controllers/videoController";

import checkoutRoutes from "./checkoutRoutes";

import multer from "multer";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";

const router = Router();

/**
 * Auth
 */
router.use("/auth", authRoutes);

/**
 * Users
 */

router.get("/users", auth, isUserAdmin, findAllUsers);
router.get("/users/me", auth, findCurrentUser);
router.get("/users/:id", auth, doUserOwnRessource, findUser);
router.patch("/users/:id", auth, doUserOwnRessource, updateUser);
router.delete("/users/:id", auth, doUserOwnRessource, deleteUser);

/**
 * Videos
 */

// Configuration de Multer pour le stockage des vidéos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/originals/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Current allowed size in GB
const CURRENT_ALLOWED_SIZE = 2;

// Current max video count
const CURRENT_MAX_VIDEO_COUNT = 10;

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB per file
  },
  fileFilter: async function (req, file, cb) {
    // TODO: Check based on plan
    // TODO: Video duration
    // TODO: Video quality

    // Check video size
    if (file.size > CURRENT_ALLOWED_SIZE * 1000 * 1000 * 1000 * 8) {
      return cb(
        new Error("Max size exceeded (" + CURRENT_ALLOWED_SIZE + "GB)")
      );
    }

    // Check video number
    const user = req.user as User;

    const videoCount = await prisma.video.count({
      where: {
        user_id: user.id,
      },
    });

    if (videoCount >= CURRENT_MAX_VIDEO_COUNT) {
      return cb(new Error("Max video number reached"));
    }

    console.log(file.size);
    console.log(file.mimetype);

    const filetypes = /mp4/;
    const mimetype = filetypes.test(file.mimetype);

    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error("Only .mp4 video are allowed"));
  },
});

router.post("/videos", auth, upload.single("video"), createVideo);
router.get("/videos", auth, findAllVideos);
router.get("/videos/:id", auth, findVideo);
router.delete("/videos/:id", auth, deleteVideo);

router.use("/checkout", auth, checkoutRoutes);

export default router;
