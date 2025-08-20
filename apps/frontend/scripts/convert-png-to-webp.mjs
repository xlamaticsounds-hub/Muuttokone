import fs from "fs";
import path from "path";
import sharp from "sharp";

// Config
const SOURCE_DIR = path.resolve(process.cwd(), "public/images");
const OUT_DIR = path.resolve(process.cwd(), "public/images/webp");
const MAX_WIDTH = 1600; // resize width (optional), set to null to keep original
const QUALITY = 80;

function ensureOutDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isPng(file) {
  return file.toLowerCase().endsWith(".png");
}

async function convertFile(srcPath, dstPath) {
  try {
    let img = sharp(srcPath);
    const metadata = await img.metadata();

    if (MAX_WIDTH && metadata.width && metadata.width > MAX_WIDTH) {
      img = img.resize({ width: MAX_WIDTH });
    }

    await img.webp({ quality: QUALITY }).toFile(dstPath);
    console.log("Converted:", srcPath, "→", dstPath);
  } catch (err) {
    console.error("Failed to convert:", srcPath, err.message || err);
  }
}

async function walkAndConvert(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkAndConvert(fullPath);
      continue;
    }

    if (isPng(entry.name)) {
      const rel = path.relative(SOURCE_DIR, fullPath);
      const outFile = path.join(OUT_DIR, rel).replace(/\.png$/i, ".webp");
      ensureOutDir(path.dirname(outFile));
      await convertFile(fullPath, outFile);
    }
  }
}

(async function main() {
  ensureOutDir(OUT_DIR);
  console.log("Scanning for PNGs in", SOURCE_DIR);
  await walkAndConvert(SOURCE_DIR);
  console.log("Done.");
})();
