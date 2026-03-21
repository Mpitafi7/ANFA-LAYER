# ANFA Layer

![CI](https://github.com/Mpitafi7/ANFA-LAYER/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Formats](https://img.shields.io/badge/formats-8%20supported-blue)
![Web App](https://img.shields.io/badge/Web%20App-Live-brightgreen?logo=vercel)

> A security and privacy layer for images. Strips all metadata and seals images with SHA-256 cryptographic proof.

## 🌐 Live Web App
**Try it free in your browser — no installation required:**
👉 **[anfalayer.vercel.app](https://anfalayer.vercel.app)**
- Upload any image — see all hidden metadata exposed
- Strip everything with one click
- Download clean image + SHA-256 seal
- 100% private — nothing leaves your browser

---

## The Problem

Every image you share contains hidden data:

- **GPS coordinates** — exact location where photo was taken
- **Camera model** — device fingerprint
- **Timestamps** — when and where
- **Software info** — tools used to edit
- **Device serial number** — unique hardware fingerprint
- **WiFi network name** — home/office network embedded in photo
- **Hidden payloads** — malware can be embedded in image pixels

No existing image format (JPEG, PNG, WebP, AVIF) solves this at the format level.

**ANFA Layer does.**

---

## What it does

1. **Strips all metadata** — EXIF, XMP, IPTC (GPS, camera, timestamp — all gone)
2. **Seals with SHA-256** — cryptographic tamper detection built in
3. **Validates input** — magic bytes check prevents file type spoofing
4. **Verifies integrity** — prove an image has not been modified since processing

---

## Supported Formats

| Format | Input | Output | Notes |
|--------|-------|--------|-------|
| JPEG | Yes | JPEG | Quality 95, lossless metadata removal |
| PNG | Yes | PNG | True-color lossless |
| WebP | Yes | WebP | Quality 95 |
| TIFF | Yes | TIFF | LZW compression |
| AVIF | Yes | AVIF | Quality 85 |
| GIF | Yes | PNG | Converted to lossless PNG |
| BMP | Yes | PNG | Converted to lossless PNG |
| HEIC | Yes | JPEG | Converted due to license limitations |

---

## Installation
```bash
npm install anfa-layer
```

**Requirements:** Node.js >= 18.0.0

---

## Quick Start
```typescript
import { ANFALayer } from 'anfa-layer';

const anfa = new ANFALayer();

// Process image — validate, strip metadata, generate seal
const result = await anfa.processImage('./photo.jpg', './output/');

console.log(result.seal.hash);     // SHA-256 hash
console.log(result.originalSize);  // original file size in bytes
console.log(result.cleanSize);     // clean file size in bytes

// Verify image integrity later
const isValid = await anfa.verifyImage(
  './output/photo.jpg',
  './output/photo.jpg.anfa.json'
);
console.log(isValid); // true = untampered, false = tampered
```

---

## Real World Result
```
════════════════════════════════════════
       ANFA LAYER REPORT
════════════════════════════════════════
Original file  : photo.jpg
Original size  : 7.9 KB
Clean size     : 3.9 KB
Size saved     : 50%
Metadata       : STRIPPED
Seal hash      : 19bd5aa2a321dd62...
Timestamp      : 2026-03-19T21:54:21.039Z
ANFA verified  : YES
════════════════════════════════════════

Running tamper detection test...
TAMPER DETECTED — seal broken
```

---

## API Reference

### `processImage(inputPath, outputDir)`

Validates the image, strips all metadata, and generates a cryptographic seal.
```typescript
const result = await anfa.processImage('./photo.jpg', './output/');
```

**Returns:** `ANFAResult`
```typescript
{
  outputPath: string;    // path to clean image
  sealPath: string;      // path to .anfa.json seal file
  seal: ANFASeal;        // cryptographic seal object
  originalSize: number;  // original file size in bytes
  cleanSize: number;     // clean file size in bytes
}
```

---

### `verifyImage(imagePath, sealPath)`

Verifies a processed image against its sidecar seal file.
```typescript
const isValid = await anfa.verifyImage(
  './output/photo.jpg',
  './output/photo.jpg.anfa.json'
);
```

**Returns:** `boolean` — `true` if untampered, `false` if modified

---

### `cleanup(outputPath, sealPath)`

Deletes processed files after delivery. Important for server and web deployments.
```typescript
await anfa.cleanup(result.outputPath, result.sealPath);
```

---

## The ANFA Seal

Every processed image gets a `.anfa.json` sidecar file:
```json
{
  "version": "1.0.0",
  "hash": "19bd5aa2a321dd62c3a8f4e1b7d902...",
  "algorithm": "sha256",
  "timestamp": "2026-03-19T21:54:21.039Z",
  "imageSize": 3994,
  "anfa": true
}
```

If even **one pixel** is changed after sealing — verification fails.

---

## CLI Usage
```bash
# Process a single image
node dist/index.js ./photo.jpg ./output/

# Output:
# SUCCESS!
# - Clean Image: ./output/photo.jpg
# - Seal File:   ./output/photo.jpg.anfa.json
# - Original Size: 7.90 KB
# - Clean Size:    3.90 KB
# - Security Hash: 19bd5aa2a321dd62...
```

---

## Use Cases
**Journalists & Whistleblowers**
Share sensitive images without revealing GPS location, device identity, or capture time.

**Medical Professionals**
Strip patient-identifying metadata before sharing diagnostic images for research.

**Legal & Evidence**
Cryptographically prove an image has not been modified since processing.

**Privacy-Conscious Users**
Remove all tracking data before uploading images to social media or messaging apps.

**Security Researchers**
Detect steganographic payloads — images with hidden malicious data fail integrity checks.

---

## How It Works
```
Input Image
     │
     ▼
┌─────────────────┐
│  ImageValidator  │  Magic bytes check, size limit, format validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ MetadataStripper │  EXIF, XMP, IPTC — completely removed
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ImageSealer    │  SHA-256 hash, timing-safe verification
└────────┬────────┘
         │
         ▼
Clean Image + .anfa.json seal
```

---

## Security

- **No `any` types** — full TypeScript strict mode
- **Timing-safe comparison** — `crypto.timingSafeEqual` prevents timing attacks
- **Magic bytes validation** — file extension spoofing is blocked
- **Async only** — no blocking `fs.sync` calls
- **Zero vulnerabilities** — `npm audit` clean

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

---

## Development
```bash
# Clone
git clone https://github.com/Mpitafi7/ANFA-LAYER.git
cd ANFA-LAYER

# Install
npm install

# Build
npm run build

# Test
npm test

# Real world test
npm run test:real

# Watch mode
npm run dev
```

---

## Test Results
```
Test Suites: 4 passed, 4 total
Tests:       21 passed, 21 total

validator.test.ts  — 5 tests
stripper.test.ts   — 5 tests
sealer.test.ts     — 6 tests
formats.test.ts    — 5 tests
```

---

## Roadmap
- [x] npm package published
- [x] 8 formats supported
- [x] 21 tests passing — 0 vulnerabilities
- [x] GitHub Actions CI — Node 18, 20, 22
- [x] Web app live at [anfalayer.vercel.app](https://anfalayer.vercel.app)
- [ ] WebAssembly (WASM) version for faster browser processing
- [ ] Batch processing — multiple images at once
- [ ] Browser extension (Chrome + Firefox)
- [ ] Zero-knowledge proof (zk-SNARK) provenance layer
- [ ] Rust core rewrite for maximum performance
- [ ] Mobile SDK (iOS + Android)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE)

---

## Links
- **Web App:** https://anfalayer.vercel.app
- **npm:** https://www.npmjs.com/package/anfa-layer
- **GitHub:** https://github.com/Mpitafi7/ANFA-LAYER
- **Issues:** https://github.com/Mpitafi7/ANFA-LAYER/issues
- **Security:** https://github.com/Mpitafi7/ANFA-LAYER/security/advisories/new