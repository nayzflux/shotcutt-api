import AdmZip from "adm-zip";

export const extractZip = (zipFilePath: string, extractTo: string) => {
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(extractTo, true);
};
