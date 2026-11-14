// Generates PWA icons from the BookNest logo (lucide "book-open" in brand gold).
// Run with: npm run icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const BG = "#0B0B0D";
const GOLD = "#DDB77E";
const BOOK =
  '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>';

// size: canvas px, logo: logo width as fraction of canvas, radius: corner radius fraction (0 = full bleed)
const svg = (size, logo, radius) => {
  const logoPx = size * logo;
  const scale = logoPx / 24;
  const offset = (size - logoPx) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="${BG}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${BOOK}</g>
</svg>`);
};

const out = (name, size, logo, radius) =>
  sharp(svg(size, logo, radius)).png().toFile(`public/icons/${name}`);

await mkdir("public/icons", { recursive: true });
await Promise.all([
  out("icon-192.png", 192, 0.56, 0.22), // "any" purpose, rounded
  out("icon-512.png", 512, 0.56, 0.22),
  out("maskable-512.png", 512, 0.44, 0), // full bleed, logo inside the 80% safe zone
  out("apple-touch-icon.png", 180, 0.54, 0), // iOS applies its own rounding
  out("favicon-32.png", 32, 0.7, 0.2),
]);
console.log("Icons written to public/icons");
