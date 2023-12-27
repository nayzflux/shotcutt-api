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

import multer from "multer";
import path from "node:path";

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
    cb(null, "uploads/videos/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024, // 1GB per file
  },
  fileFilter: function (req, file, cb) {
    // TODO: Check size by plan
    // TODO: Check format by plan

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

export default router;
