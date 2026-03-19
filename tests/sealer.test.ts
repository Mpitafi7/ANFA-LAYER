import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ImageSealer } from '../src/core/sealer';
import { ANFASeal } from '../src/types/anfa.types';

describe('ImageSealer', () => {
  let sealer: ImageSealer;
  const tempDir = path.join(__dirname, 'temp_sealer_test');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    sealer = new ImageSealer();
  });

  it('should generate a seal with the correct structure', async () => {
    const buffer = Buffer.from('test image data');
    const seal = await sealer.generateSeal(buffer);

    expect(seal.version).toBe('1.0.0');
    expect(seal.algorithm).toBe('sha256');
    expect(seal.anfa).toBe(true);
    expect(seal.imageSize).toBe(buffer.length);
    expect(typeof seal.hash).toBe('string');
    expect(typeof seal.timestamp).toBe('string');
  });

  it('should verify a seal for an unmodified image', async () => {
    const buffer = Buffer.from('consistent image data');
    const seal = await sealer.generateSeal(buffer);

    const isValid = await sealer.verifySeal(buffer, seal);
    expect(isValid).toBe(true);
  });

  it('should fail verification if the image is modified by even 1 byte', async () => {
    const buffer = Buffer.from('original data');
    const seal = await sealer.generateSeal(buffer);

    const modifiedBuffer = Buffer.from('original data!'); // Added 1 byte
    const isValid = await sealer.verifySeal(modifiedBuffer, seal);
    expect(isValid).toBe(false);
  });

  it('should use timingSafeEqual for comparison (implied by logic)', async () => {
    // We can't easily "test" if it's timing safe without benchmarks,
    // but we can verify it functions correctly for equal and unequal buffers.
    const buffer1 = Buffer.from('data');
    const seal1 = await sealer.generateSeal(buffer1);
    
    // Test with a different hash of same length
    const tamperedSeal: ANFASeal = {
      ...seal1,
      hash: crypto.createHash('sha256').update('different data').digest('hex')
    };

    const isValid = await sealer.verifySeal(buffer1, tamperedSeal);
    expect(isValid).toBe(false);
  });

  it('should save and load a seal correctly', async () => {
    const buffer = Buffer.from('io test data');
    const seal = await sealer.generateSeal(buffer);
    const outputPath = path.join(tempDir, 'test_image.jpg');

    await sealer.saveSeal(seal, outputPath);
    
    const sealPath = `${outputPath}.anfa.json`;
    expect(fs.existsSync(sealPath)).toBe(true);

    const loadedSeal = await sealer.loadSeal(sealPath);
    expect(loadedSeal).toEqual(seal);
  });

  it('should fail to load a tampered seal structure', async () => {
    const sealPath = path.join(tempDir, 'invalid.anfa.json');
    fs.writeFileSync(sealPath, JSON.stringify({ version: "1.0", tampered: true }));

    try {
      await sealer.loadSeal(sealPath);
      throw new Error('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe('INVALID_SEAL');
    }
  });
});
