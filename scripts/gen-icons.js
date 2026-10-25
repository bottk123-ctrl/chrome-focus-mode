const fs = require("fs");
const zlib = require("zlib");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function png(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const p = pixels(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = p[0];
      raw[o + 1] = p[1];
      raw[o + 2] = p[2];
      raw[o + 3] = p[3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const RED = [211, 47, 47];
const WHITE = [255, 255, 255];

function makeIcon(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;
  const ringR = size * 0.26;
  const ringW = Math.max(1.5, size * 0.09);
  const dotR = size * 0.1;
  const corner = size * 0.22;
  return png(size, (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    const dx = px - cx;
    const dy = py - cy;
    const insideSquare =
      px >= 0 && px <= size && py >= 0 && py <= size;
    const rx = Math.abs(px - cx);
    const ry = Math.abs(py - cy);
    let inRounded = false;
    if (rx <= size / 2 - corner && ry <= size / 2) inRounded = true;
    else if (ry <= size / 2 - corner && rx <= size / 2) inRounded = true;
    else {
      const bx = size / 2 - corner;
      const by = size / 2 - corner;
      inRounded = (rx - bx) ** 2 + (ry - by) ** 2 <= corner ** 2;
    }
    if (!inRounded) return [0, 0, 0, 0];
    const dist = Math.sqrt(dx * dx + dy * dy);
    const onRing = Math.abs(dist - ringR) <= ringW / 2;
    const onDot = dist <= dotR;
    if (onRing || onDot) return [...WHITE, 255];
    return [...RED, 255];
  });
}

const out = process.argv[2] || "icons";
fs.mkdirSync(out, { recursive: true });
for (const size of [16, 48, 128]) {
  fs.writeFileSync(`${out}/icon${size}.png`, makeIcon(size));
  console.log(`icons/icon${size}.png`);
}
