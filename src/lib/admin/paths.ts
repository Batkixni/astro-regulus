import { join } from "node:path";
import { mkdirSync } from "node:fs";

export const dataDirectory = join(process.cwd(), ".data");

export const ensureDataDirectory = () => {
  mkdirSync(dataDirectory, { recursive: true });
  return dataDirectory;
};

export const adminDbPath = () => join(ensureDataDirectory(), "admin.db");
