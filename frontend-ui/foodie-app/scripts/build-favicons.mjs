/**
 * Renders the brand mark to the raster icons browsers and platforms insist on:
 * the tab favicon, the iOS home-screen icon, and the two push-notification
 * images src/sw.js points at.
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
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const MARK = [0x6c, 0x22, 0x19];

/** Centre of the artwork in the SVG's coordinate space. */
const CENTRE = { x: 128.5, y: 117 };

/**
 * Side of the square crop taken around that centre. The mark is 175x218, so
 * 250 leaves roughly 12% margin; a larger number means a smaller mark.
 */
const CROP = 250;

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

/** Supersampled 0..1 coverage per pixel, for any predicate in icon space. */
function coverage(size, inside) {
  const out = new Float32Array(size * size);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          if (inside(px + (sx + 0.5) / SS, py + (sy + 0.5) / SS)) hits++;
        }
      }
      out[py * size + px] = hits / (SS * SS);
    }
  }
  return out;
}

/** Coverage of the mark itself, cropped to `crop` around its centre. */
function markCoverage(size, crop = CROP) {
  const scale = crop / size;
  const originX = CENTRE.x - crop / 2;
  const originY = CENTRE.y - crop / 2;
  return coverage(size, (x, y) => inMark(originX + x * scale, originY + y * scale));
}

/** Coverage of a rounded square filling the icon, for app-icon style plates. */
function plateCoverage(size, radiusRatio) {
  const r = size * radiusRatio;
  return coverage(size, (x, y) => {
    const dx = Math.min(x, size - x), dy = Math.min(y, size - y);
    if (dx < 0 || dy < 0) return false;
    if (dx >= r || dy >= r) return true;
    return (r - dx) ** 2 + (r - dy) ** 2 <= r * r;
  });
}

/**
 * Paints the mark in `ink` over `plate`, which may be null for transparency.
 * Alpha comes from the plate where there is one, so the corners stay smooth.
 */
function compose(size, mark, ink, plate, plateColour) {
  const out = Buffer.alloc(size * size * 4);
  for (let p = 0; p < size * size; p++) {
    const m = mark[p];
    const a = plate ? plate[p] : m;
    const i = p * 4;
    for (let c = 0; c < 3; c++) {
      out[i + c] = plate
        ? Math.round(ink[c] * m + plateColour[c] * (1 - m))
        : ink[c];
    }
    out[i + 3] = Math.round(a * 255);
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

const write = (path, bytes, note) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  console.log(`${relative(PUBLIC_DIR, path).padEnd(30)} ${String(bytes.length).padStart(6)} bytes  ${note}`);
};

const WHITE = [255, 255, 255];

// Browser tab. Transparent, so it sits on light and dark chrome alike.
write(
  join(PUBLIC_DIR, 'favicon.ico'),
  encodeIco([16, 32, 48, 64].map(size => ({
    size,
    png: encodePng(size, compose(size, markCoverage(size), MARK, null))
  }))),
  '16, 32, 48, 64'
);

// iOS home screen. Composited, because apple-touch-icon has no usable alpha
// and would otherwise land on black.
write(
  join(PUBLIC_DIR, 'apple-touch-icon.png'),
  encodePng(180, compose(180, markCoverage(180), MARK, plateCoverage(180, 0), WHITE)),
  '180, on white'
);

/* Push notifications, both referenced by src/sw.js.
 *
 * The two are not the same picture. `icon` is shown in full colour, at whatever
 * size the platform picks, against a notification shade that may be light or
 * dark: a bare maroon mark would disappear on one of them, so it gets the brand
 * plate and a white mark, the way an app icon would.
 *
 * `badge` is the opposite. Android throws the colour away and renders the alpha
 * channel as a flat silhouette in the status bar, so only the shape matters,
 * and it needs extra margin because the system crops to a circle. */
write(
  join(PUBLIC_DIR, 'assets', 'icons', 'icon-192x192.png'),
  encodePng(192, compose(192, markCoverage(192, 330), WHITE, plateCoverage(192, 0.22), MARK)),
  '192, white mark on the brand plate'
);

write(
  join(PUBLIC_DIR, 'assets', 'icons', 'badge-72x72.png'),
  encodePng(72, compose(72, markCoverage(72, 300), WHITE, null)),
  '72, alpha-only silhouette'
);
