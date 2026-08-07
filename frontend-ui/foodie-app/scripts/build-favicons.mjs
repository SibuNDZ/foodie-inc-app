/**
 * Renders the brand mark to the raster icons browsers still insist on.
 *
 * The geometry here is the same geometry as src/assets/brand/foodie-logo.svg,
 * rasterised analytically with supersampling rather than resampled from the
 * source PNG. That matters: the supplied artwork sits on a textured cream
 * background, and keying that out leaves ghosting at small sizes, whereas the
 * shapes give clean edges and true transparency at every size.
 *
 * Run with `npm run build:favicons` after changing the mark.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const MARK = [0x6c, 0x22, 0x19];

/** Square source region, centred on the mark with about 12% margin. */
const REGION = { x: 3.5, y: -8, size: 250 };

/** Samples per axis inside each output pixel. */
const SS = 4;

const inRect = (x, y, rx, ry, w, h) => x >= rx && x < rx + w && y >= ry && y < ry + h;
const inEllipse = (x, y, cx, cy, a, b) => ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 <= 1;

/** True where the mark is inked, in the SVG's own coordinate space. */
function inMark(x, y) {
  if (y <= 85.5 && inEllipse(x, y, 128, 85.5, 58, 53)) {
    // The highlight is a hole in the dome, not a stroke laid over it.
    const outside = inEllipse(x, y, 128, 85, 48.5, 44.5);
    const inside = inEllipse(x, y, 128, 85, 41.5, 37.5);
    if (outside && !inside) {
      const angle = Math.atan2((y - 85) / 41, (x - 128) / 45) * 180 / Math.PI;
      if (angle <= -108 && angle >= -163) return false;
    }
    return true;
  }
  if (inEllipse(x, y, 128, 28, 8, 8)) return true;                  // the knob
  if (inRect(x, y, 60.5, 93, 137, 15)) return true;                 // tray, straight span
  if (inEllipse(x, y, 60.5, 100.5, 7.5, 7.5)) return true;          // tray, rounded ends
  if (inEllipse(x, y, 197.5, 100.5, 7.5, 7.5)) return true;
  if (inRect(x, y, 71, 93, 40, 121)) return true;                   // stem of the F
  if (inRect(x, y, 71, 133, 98, 32)) return true;                   // arm of the F
  return false;
}

/** RGBA pixels for one square icon. `background` null means transparent. */
function render(size, background) {
  const out = Buffer.alloc(size * size * 4);
  const scale = REGION.size / size;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = REGION.x + (px + (sx + 0.5) / SS) * scale;
          const y = REGION.y + (py + (sy + 0.5) / SS) * scale;
          if (inMark(x, y)) hits++;
        }
      }

      const coverage = hits / (SS * SS);
      const i = (py * size + px) * 4;
      if (background) {
        // Composited, because Apple's touch icon has no alpha to speak of.
        for (let c = 0; c < 3; c++) {
          out[i + c] = Math.round(MARK[c] * coverage + background[c] * (1 - coverage));
        }
        out[i + 3] = 255;
      } else {
        out[i] = MARK[0]; out[i + 1] = MARK[1]; out[i + 2] = MARK[2];
        out[i + 3] = Math.round(coverage * 255);
      }
    }
  }
  return out;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // truecolour with alpha

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/** An .ico carrying PNG-compressed entries, which every current browser reads. */
function encodeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const directory = entries.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size === 256 ? 0 : size;
    entry[1] = size === 256 ? 0 : size;
    entry.writeUInt16LE(1, 4);   // colour planes
    entry.writeUInt16LE(32, 6);  // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...directory, ...entries.map(e => e.png)]);
}

const ico = encodeIco([16, 32, 48, 64].map(size => ({
  size,
  png: encodePng(size, render(size, null))
})));
writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), ico);
console.log(`favicon.ico       ${ico.length} bytes (16, 32, 48, 64)`);

const touch = encodePng(180, render(180, [255, 255, 255]));
writeFileSync(join(PUBLIC_DIR, 'apple-touch-icon.png'), touch);
console.log(`apple-touch-icon.png ${touch.length} bytes (180, on white)`);
