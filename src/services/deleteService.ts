import { Video } from "@prisma/client";
import fs from "node:fs";

export const deleteFile = (video: Video) => {
  try {
    // Delete Original
    fs.rmSync(`uploads/originals/${video.id}.mp4`, {
      force: true,
      recursive: true,
    });

    // Delete Scenes
    fs.rmSync(`uploads/scenes/${video.id}`, {
      force: true,
      recursive: true,
    });

    // Delete Zip
    fs.rmSync(`uploads/scenes/${video.id}.zip`, {
      force: true,
      recursive: true,
    });
  } catch (err) {
    console.log(err);
    console.log("Failed to delete video files");
  }
};
