import { Video } from "@prisma/client";
import { exec } from "node:child_process";
import { prisma } from "../lib/prisma";
import fs from "node:fs";
import { io } from "../app";
import { createZip } from "./zipServices";

export const process = async (video: Video, filename: string) => {
  await prisma.video.update({
    where: { id: video.id },
    data: { status: "PROCESSING" },
  });

  const inputFile = `./uploads/videos/${filename}`;
  const outputFolder = `./uploads/videos/processed/${video.id}`;

  console.error(`[PROCESSING] Processing video... `);

  exec(
    `scenedetect -i "${inputFile}" -o "${outputFolder}" split-video `,
    async (error, stdout, stderr) => {
      if (error) {
        console.error(`[PROCESSING] Error executing command`, error.message);

        await prisma.video.update({
          where: { id: video.id },
          data: { status: "FAILED" },
        });

        io.to(`user:${video.user_id}`).emit("video_process_failed");

        return;
      }

      if (stdout) {
        console.log(`[PROCESSING] Command output`);

        createZip(outputFolder, video.id);

        const sceneFile = fs.readdirSync(outputFolder);

        const scene_urls = sceneFile.map(
          (file) => `/public/videos/processed/${video.id}/${file}`
        );

        await prisma.video.update({
          where: { id: video.id },
          data: { status: "PROCESSED", scene_urls },
        });

        io.to(`user:${video.user_id}`).emit("video_process_success");

        return;
      }

      if (stderr) {
        console.error(`[PROCESSING] Command stderr`);

        await prisma.video.update({
          where: { id: video.id },
          data: { status: "FAILED" },
        });

        io.to(`user:${video.user_id}`).emit("video_process_failed");

        return;
      }
    }
  );
};
