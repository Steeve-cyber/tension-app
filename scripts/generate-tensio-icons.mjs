import { createWriteStream } from "node:fs";
import { deflateSync } from "node:zlib";

const root = new URL("../assets/images/", import.meta.url);
const iconPaths = {
  full: new URL("icon.png", root),
  splash: new URL("splash-icon.png", root),
  favicon: new URL("favicon.png", root),
  androidForeground: new URL("android-icon-foreground.png", root),
  androidMono: new URL("android-icon-monochrome.png", root),
  androidBackground: new URL("android-icon-background.png", root),
};
const waveform = [
  [0.15, 0.55], [0.36, 0.55], [0.43, 0.55], [0.49, 0.405],
  [0.55, 0.66], [0.615, 0.315], [0.68, 0.55], [0.84, 0.55],
];

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let value = n;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  crcTable[n] = value >>> 0;
}
function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
function png(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) pixels.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND"),
  ]);
}
function colorAt(x, y, size, transparent) {
  if (transparent) return [0, 0, 0, 0];
  const centerX = size * 0.66;
  const centerY = size * 0.36;
  const radius = Math.hypot((x - centerX) / size, (y - centerY) / size);
  const glow = Math.max(0, 1 - radius / 0.66) ** 2;
  const t = y / size;
  return [
    Math.round(9 + 8 * t + 10 * glow),
    Math.round(34 + 11 * (1 - t) + 92 * glow),
    Math.round(48 + 19 * (1 - t) + 64 * glow),
    255,
  ];
}
function paintStroke(pixels, size, points, strokeWidth, color, alpha = 1) {
  const radius = strokeWidth / 2;
  for (let index = 0; index < points.length - 1; index += 1) {
    const [axUnit, ayUnit] = points[index];
    const [bxUnit, byUnit] = points[index + 1];
    const ax = axUnit * size;
    const ay = ayUnit * size;
    const bx = bxUnit * size;
    const by = byUnit * size;
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx) - radius - 2));
    const maxX = Math.min(size - 1, Math.ceil(Math.max(ax, bx) + radius + 2));
    const minY = Math.max(0, Math.floor(Math.min(ay, by) - radius - 2));
    const maxY = Math.min(size - 1, Math.ceil(Math.max(ay, by) + radius + 2));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const fraction = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared));
        const distance = Math.hypot(x - (ax + fraction * dx), y - (ay + fraction * dy));
        const coverage = Math.max(0, Math.min(1, radius + 0.75 - distance)) * alpha;
        if (!coverage) continue;
        const offset = (y * size + x) * 4;
        const existingAlpha = pixels[offset + 3] / 255;
        const outAlpha = coverage + existingAlpha * (1 - coverage);
        for (let channel = 0; channel < 3; channel += 1) {
          pixels[offset + channel] = Math.round((color[channel] * coverage + pixels[offset + channel] * existingAlpha * (1 - coverage)) / outAlpha);
        }
        pixels[offset + 3] = Math.round(outAlpha * 255);
      }
    }
  }
}
function mark(size, { background = false, color = [239, 255, 252], transparent = true } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const rgba = colorAt(x, y, size, !background && transparent);
      pixels.set(rgba, offset);
    }
  }
  paintStroke(pixels, size, waveform, Math.max(3, size * 0.055), [65, 218, 195], 0.34);
  paintStroke(pixels, size, waveform, Math.max(2, size * 0.032), color, 1);
  return pixels;
}
function write(path, data) {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(path);
    stream.on("error", reject);
    stream.on("finish", resolve);
    stream.end(data);
  });
}

await Promise.all([
  write(iconPaths.full, png(1024, 1024, mark(1024, { background: true }))),
  write(iconPaths.splash, png(360, 360, mark(360))),
  write(iconPaths.favicon, png(64, 64, mark(64, { background: true }))),
  write(iconPaths.androidForeground, png(432, 432, mark(432))),
  write(iconPaths.androidMono, png(432, 432, mark(432, { color: [255, 255, 255] }))),
  write(iconPaths.androidBackground, png(432, 432, mark(432, { background: true }))),
]);
