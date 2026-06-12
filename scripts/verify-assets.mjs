import { stat } from "node:fs/promises";
import sharp from "sharp";

import { scenes, words } from "../js/data.js";

const assets = [...scenes, ...words].map((item) => item.image);
const failures = [];

for (const file of assets) {
  try {
    const fileStat = await stat(file);
    const metadata = await sharp(file).metadata();
    if (fileStat.size <= 0) failures.push(`${file}: empty file`);
    if (!metadata.width || !metadata.height) failures.push(`${file}: invalid dimensions`);
    if (metadata.width > 1100 || metadata.height > 720) {
      failures.push(`${file}: oversized ${metadata.width}x${metadata.height}`);
    }
  } catch (error) {
    failures.push(`${file}: ${error.message}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verified ${assets.length} local images.`);
}
