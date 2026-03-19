import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { MetadataStripper } from '../src/core/stripper';
import { ANFAError } from '../src/types/anfa.types';

describe('MetadataStripper', () => {
  let stripper: MetadataStripper;
  const tempDir = path.join(__dirname, 'temp_stripper_test');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterAll(async () => {
    // Small delay to ensure sharp releases file handles on Windows
    await new Promise(resolve => setTimeout(resolve, 500));
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Failed to remove temp directory:', e);
      }
    }
  });

  beforeEach(() => {
    stripper = new MetadataStripper();
  });

  it('should successfully strip metadata from a JPEG image', async () => {
    const inputPath = path.join(tempDir, 'test.jpg');
    // Create a 10x10 white JPEG
    const buffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .withMetadata({ 
        exif: { 
            IFD0: { 
                Software: 'Test Software' 
            } 
        } 
    })
    .jpeg()
    .toBuffer();
    
    fs.writeFileSync(inputPath, buffer);

    const strippedBuffer = await stripper.strip(inputPath);
    const metadata = await sharp(strippedBuffer).metadata();

    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
    expect(metadata.iptc).toBeUndefined();
  });

  it('should successfully strip metadata from a PNG image', async () => {
    const inputPath = path.join(tempDir, 'test.png');
    // Create a 10x10 white PNG
    const buffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .png()
    .toBuffer();
    
    fs.writeFileSync(inputPath, buffer);

    const strippedBuffer = await stripper.strip(inputPath);
    const metadata = await sharp(strippedBuffer).metadata();

    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
    expect(metadata.iptc).toBeUndefined();
  });

  it('should return a valid image buffer after stripping', async () => {
    const inputPath = path.join(tempDir, 'valid_check.webp');
    const buffer = await sharp({
      create: {
        width: 5,
        height: 5,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    })
    .webp()
    .toBuffer();

    fs.writeFileSync(inputPath, buffer);

    const strippedBuffer = await stripper.strip(inputPath);
    const metadata = await sharp(strippedBuffer).metadata();

    expect(metadata.width).toBe(5);
    expect(metadata.height).toBe(5);
    expect(metadata.format).toBe('webp');
  });

  it('verifyClean should return true for a clean buffer', async () => {
    const cleanBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    })
    .png() // Must specify a format to be a valid image buffer
    .toBuffer();

    const isClean = await stripper.verifyClean(cleanBuffer);
    expect(isClean).toBe(true);
  });

  it('should throw ANFAError with STRIP_FAILED for corrupted input', async () => {
    const corruptedPath = path.join(tempDir, 'corrupted.jpg');
    fs.writeFileSync(corruptedPath, Buffer.from('not an image'));

    try {
      await stripper.strip(corruptedPath);
      throw new Error('Should have thrown an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(ANFAError);
      expect(error.code).toBe('STRIP_FAILED');
    }
  });
});
