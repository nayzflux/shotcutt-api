import { Video } from "@prisma/client";
import { exec } from "node:child_process";
import { prisma } from "../lib/prisma";
import fs from "node:fs";

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

        return;
      }

      if (stdout) {
        console.log(`[PROCESSING] Command output`);

        const sceneFile = fs.readdirSync(outputFolder);

        const scene_urls = sceneFile.map(
          (file) => `/public/videos/processed/${video.id}/${file}`
        );

        await prisma.video.update({
          where: { id: video.id },
          data: { status: "PROCESSED", scene_urls },
        });

        return;
      }

      if (stderr) {
        console.error(`[PROCESSING] Command stderr`);

        await prisma.video.update({
          where: { id: video.id },
          data: { status: "FAILED" },
        });

        return;
      }
    }
  );
};
