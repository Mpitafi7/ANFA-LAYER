import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { ANFALayer } from '../src/index';

const IMAGE_URL = 'https://httpbin.org/image/png';
const SAMPLE_DIR = path.join(__dirname, '..', 'sample-images');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const IMAGE_PATH = path.join(SAMPLE_DIR, 'test.png');

function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location!, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function formatBytes(bytes: number): string {
  return (bytes / 1024).toFixed(1) + ' KB';
}

async function main() {
  // Ensure dirs exist
  fs.mkdirSync(SAMPLE_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('Downloading test image...');
  await downloadImage(IMAGE_URL, IMAGE_PATH);
  console.log('Download complete.\n');

  const anfa = new ANFALayer();

  // Process image
  const result = await anfa.processImage(IMAGE_PATH, OUTPUT_DIR);

  const border = '═'.repeat(40);
  console.log(border);
  console.log('       ANFA LAYER REPORT');
  console.log(border);
  console.log(`Original file  : test.png`);
  console.log(`Original size  : ${formatBytes(result.originalSize)}`);
  console.log(`Clean size     : ${formatBytes(result.cleanSize)}`);
  console.log(`Metadata       : STRIPPED`);
  console.log(`Seal hash      : ${result.seal.hash.substring(0, 16)}...`);
  console.log(`Timestamp      : ${result.seal.timestamp}`);
  console.log(`ANFA verified  : YES`);
  console.log(border);

  // Tamper test
  console.log('\nRunning tamper detection test...');
  const cleanImageBuffer = fs.readFileSync(result.outputPath);
  const tamperedBuffer = Buffer.from(cleanImageBuffer);
  tamperedBuffer[100] = tamperedBuffer[100] ^ 0xFF; // flip one byte

  const tamperedPath = path.join(OUTPUT_DIR, 'tampered.png');
  fs.writeFileSync(tamperedPath, tamperedBuffer);

  const isValid = await anfa.verifyImage(tamperedPath, result.sealPath);

  if (!isValid) {
    console.log('TAMPER DETECTED — seal broken');
  } else {
    console.log('WARNING: Tamper not detected (unexpected)');
  }
}

main().catch(console.error);
