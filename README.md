# ANFA Layer

![CI](https://github.com/Mpitafi7/ANFA-LAYER/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

A security and privacy layer for images. Strips all metadata and seals
images with SHA-256 cryptographic proof.

## What it does
1. Strips all metadata — EXIF, XMP, IPTC (GPS, camera, timestamp — all gone)
2. Seals image with SHA-256 hash — tamper detection built in
3. Validates input — magic bytes check prevents file spoofing

## Supported Formats
JPEG, PNG, WebP, TIFF, AVIF, GIF, BMP, HEIC

## Installation
```bash
npm install anfa-layer
```

## Quick Start
```typescript
import { ANFALayer } from 'anfa-layer';

const anfa = new ANFALayer();

// Process image — strip metadata + seal
const result = await anfa.processImage('./photo.jpg', './output/');

console.log(result.seal.hash);    // SHA-256 hash
console.log(result.originalSize); // original bytes
console.log(result.cleanSize);    // clean bytes

// Verify image later
const isValid = await anfa.verifyImage(
  './output/photo.jpg',
  './output/photo.jpg.anfa.json'
);
console.log(isValid); // true = untampered
```

## Real World Result
```
════════════════════════════════════════
       ANFA LAYER REPORT
════════════════════════════════════════
Original size  : 7.9 KB
Clean size     : 3.9 KB
Metadata       : STRIPPED
Seal hash      : 19bd5aa2a321dd62...
ANFA verified  : YES
════════════════════════════════════════
TAMPER DETECTED — seal broken
```

## API Reference
### processImage(inputPath, outputDir)
Validates, strips metadata, generates seal.
Returns: `{ outputPath, sealPath, seal, originalSize, cleanSize }`

### verifyImage(imagePath, sealPath)
Verifies image against its seal.
Returns: `boolean`

## Security
See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)

## License
MIT — see [LICENSE](LICENSE)
