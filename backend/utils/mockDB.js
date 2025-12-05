import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadDB(fileName) {
  const filePath = path.join(__dirname, "..", "data", fileName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }

  return JSON.parse(fs.readFileSync(filePath));
}

export function saveDB(fileName, data) {
  const filePath = path.join(__dirname, "..", "data", fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
