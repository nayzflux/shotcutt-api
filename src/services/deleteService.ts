import { Video } from "@prisma/client";
import fs from 'node:fs'

export const deleteFile = (video: Video) => {
  try {
    // Delete Original
    fs.rmSync(`${__dirname}/../../uploads/videos/${video.filename}`, {
      force: true,
      recursive: true,
      retryDelay: 20 * 1000,
    });
    // Delete Scenes
    fs.rmSync(`${__dirname}/../../uploads/videos/processed/${video.id}`, {
      force: true,
      recursive: true,
      retryDelay: 20 * 1000,
    });
    // Delete Zip
    fs.rmSync(`${__dirname}/../../uploads/zip/${video.id}.zip`, {
      force: true,
      recursive: true,
      retryDelay: 20 * 1000,
    });
  } catch (err) {
    console.log(err);
    console.log("Failed to delete video files");
  }
};
