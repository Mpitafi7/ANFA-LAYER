import * as fs from 'fs';
import * as path from 'path';
import { ImageValidator } from '../src/core/validator';

describe('ImageValidator', () => {
  let validator: ImageValidator;
  const tempDir = path.join(__dirname, 'temp_test_images');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    process.env.MAX_FILE_SIZE_MB = '1'; // 1MB for testing
    process.env.ALLOWED_FORMATS = 'jpeg,jpg,png,webp';
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    validator = new ImageValidator();
  });

  it('should pass for a valid JPEG file', async () => {
    const filePath = path.join(tempDir, 'valid.jpg');
    const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    fs.writeFileSync(filePath, buffer);

    const result = await validator.validate(filePath);
    expect(result.isValid).toBe(true);
    expect(result.format).toBe('jpeg');
  });

  it('should fail if file size exceeds limit', async () => {
    const filePath = path.join(tempDir, 'large.jpg');
    // Create a file larger than 1MB
    const largeBuffer = Buffer.alloc(1.1 * 1024 * 1024);
    fs.writeFileSync(filePath, largeBuffer);

    const result = await validator.validate(filePath);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('File size exceeds limit');
  });

  it('should fail for a wrong extension', async () => {
    const filePath = path.join(tempDir, 'script.sh');
    fs.writeFileSync(filePath, 'echo hello');

    const result = await validator.validate(filePath);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Extension .sh is not allowed');
  });

  it('should fail if magic bytes do not match (spoofed extension)', async () => {
    const filePath = path.join(tempDir, 'spoofed.jpg');
    // Write some non-JPEG data to a .jpg file
    fs.writeFileSync(filePath, Buffer.from('this is not a jpeg file'));

    const result = await validator.validate(filePath);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Magic bytes mismatch');
  });

  it('should fail if file is not found', async () => {
    const result = await validator.validate('nonexistent_file.jpg');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('File not found');
  });
});
