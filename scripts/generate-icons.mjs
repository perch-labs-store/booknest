// Generates every app icon from scripts/app-icon.png (the Fablebook app icon, a rounded square on a transparent background).
// Run with: npm run icons
// To change the icon later, replace scripts/app-icon.png (square, transparent corners) and run the command again.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const SOURCE = "scripts/app-icon.png";
// The icon's own dark green, used to fill the corners where an icon has to be a full square.
const FILL = "#012015";
// Full-square icons drop the artwork's outer bevel (3% on each side) so it doesn't show as a line against the fill.
const INSET = 0.03;

/** The icon scaled to `px`, with its rounded corners kept transparent. */
const icon = (px) => sharp(SOURCE).resize(px, px).png().toBuffer();

/** A soft-edged rounded-square mask, used to blend the artwork into the flat fill. */
const feather = (px) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${px * 0.01}"/></filter></defs><rect x="${px * 0.015}" y="${px * 0.015}" width="${px * 0.97}" height="${px * 0.97}" rx="${px * 0.21}" fill="#fff" filter="url(#b)"/></svg>`);

/** A full-bleed square: dark green canvas with the (bevel-trimmed) icon centred on it at `scale` of the canvas. */
const fullBleed = async (size, scale) => {
  const px = Math.round(size * scale);
  const offset = Math.round((size - px) / 2);
  const { width } = await sharp(SOURCE).metadata();
  const cut = Math.round(width * INSET);
  const art = await sharp(SOURCE)
    .extract({ left: cut, top: cut, width: width - 2 * cut, height: width - 2 * cut })
    .resize(px, px)
    .composite([{ input: feather(px), blend: "dest-in" }]) // fade the artwork's border into the fill
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: FILL } })
    .composite([{ input: art, left: offset, top: offset }])
    .png()
    .toBuffer();
};

await mkdir("public/icons", { recursive: true });

const write = async (name, buf) => sharp(await buf).toFile(`public/icons/${name}`);
await Promise.all([
  write("icon-192.png", icon(192)), // "any" purpose, keeps the rounded shape
  write("icon-512.png", icon(512)),
  write("maskable-512.png", fullBleed(512, 0.8)), // the OS crops it to its own shape, so the art stays inside the safe zone
  write("apple-touch-icon.png", fullBleed(180, 1)), // iOS applies its own rounding and turns transparency black
  write("favicon-32.png", icon(32)),
  write("favicon-64.png", icon(64)),
]);

// Browsers that prefer an SVG favicon get the same artwork, embedded.
const b64 = (await icon(128)).toString("base64");
await writeFile(
  "public/favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128"><image width="128" height="128" xlink:href="data:image/png;base64,${b64}"/></svg>\n`,
);

console.log("Icons written to public/icons and public/favicon.svg");
