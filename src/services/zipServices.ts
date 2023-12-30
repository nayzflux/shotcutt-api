import AdmZip from "adm-zip";
import * as fs from "fs";

export const extractZip = (zipFilePath: string, extractTo: string) => {
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(extractTo, true);
};
