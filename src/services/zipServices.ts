import fs from "node:fs";
import archiver from "archiver";

export const createZip = (folder: string, id: string) => {
  const sourceFolder = folder;
  const zipFilePath = `./uploads/zip/${id}.zip`;

  // Créer une archive
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Compression maximale
  });

  output.on("close", () => {
    console.log(`Archive créée: ${zipFilePath}`);
  });

  archive.on("warning", (err) => {
    if (err.code === "ENOENT") {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on("error", (err) => {
    throw err;
  });

  // Ajouter le contenu du dossier source à l'archive
  archive.pipe(output);
  archive.directory(sourceFolder, false);
  archive.finalize();
};
