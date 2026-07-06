const fs = require("fs/promises");
const path = require("path");

const ROOT = __dirname;
const DATASET_DIR = path.join(ROOT, "dataset_test");
const OUTPUT_PATH = path.join(ROOT, "manifest.js");
const CAMERAS = ["CAM_BACK", "CAM_BACK_LEFT", "CAM_BACK_RIGHT", "CAM_FRONT", "CAM_FRONT_LEFT", "CAM_FRONT_RIGHT"];
const IMAGE_PATTERN = /\.(jpg|jpeg|png|webp)$/i;
const PRIMARY_CAMERA = "CAM_BACK";

async function main() {
  const manifest = await buildManifest();
  const output = `window.DATASET_MANIFEST = ${JSON.stringify(manifest, null, 2)};\n`;
  await fs.writeFile(OUTPUT_PATH, output, "utf8");
  console.log(`Wrote ${OUTPUT_PATH} with ${manifest.photos.length} photo groups.`);
}

async function buildManifest() {
  return scanDataset();
}

async function scanDataset() {
  await fs.access(DATASET_DIR);

  const originalsDir = path.join(DATASET_DIR, "0_originals");
  await fs.access(originalsDir);

  const cameraFiles = new Map();

  for (const camera of CAMERAS) {
    const cameraDir = path.join(originalsDir, camera);
    const filenames = await fs.readdir(cameraDir);

    cameraFiles.set(
      camera,
      filenames
        .filter((filename) => IMAGE_PATTERN.test(filename))
        .sort()
    );
  }

  const groupCount = Math.max(...CAMERAS.map((camera) => cameraFiles.get(camera)?.length ?? 0));
  const primaryFiles = cameraFiles.get(PRIMARY_CAMERA) ?? [];
  const photos = Array.from({ length: groupCount }, (_, index) => {
    const originals = CAMERAS.reduce((cameraAccumulator, camera) => {
      cameraAccumulator[camera] = cameraFiles.get(camera)?.[index] ?? null;
      return cameraAccumulator;
    }, {});

    const primaryFilename = primaryFiles[index] ?? null;
    const group = primaryFilename ? stripExtension(primaryFilename) : `photo-${String(index + 1).padStart(3, "0")}`;

    return { group, originals };
  });

  return { photos };
}

function stripExtension(filename) {
  return filename.replace(/\.[^.]+$/, "");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});