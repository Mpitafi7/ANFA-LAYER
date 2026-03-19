import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult } from '../types/anfa.types';

/**
 * ImageValidator handles security and privacy checks for image files.
 * It validates file existence, size, extension, and magic bytes to prevent spoofing.
 */
export class ImageValidator {
  private readonly maxFileSize: number;
  private readonly allowedFormats: string[];

  /**
   * Initializes the validator with configuration from environment variables or defaults.
   */
  constructor() {
    const envMaxSize = process.env.MAX_FILE_SIZE_MB;
    this.maxFileSize = (envMaxSize ? parseInt(envMaxSize, 10) : 10) * 1024 * 1024;

    const envFormats = process.env.ALLOWED_FORMATS;
    this.allowedFormats = envFormats 
      ? envFormats.split(',').map(f => f.trim().toLowerCase())
      : ['jpeg', 'jpg', 'png', 'webp'];
  }

  /**
   * Validates an image file based on existence, size, extension, and magic bytes.
   * 
   * @param filePath - The absolute or relative path to the image file.
   * @returns A promise that resolves to a ValidationResult.
   */
  public async validate(filePath: string): Promise<ValidationResult> {
    try {
      // 1. Check if file exists
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
      } catch {
        return { isValid: false, error: `File not found: ${filePath}` };
      }

      // 2. Check file size
      const stats = await fs.promises.stat(filePath);
      if (!stats.isFile()) {
        return { isValid: false, error: 'Path is not a file' };
      }
      if (stats.size > this.maxFileSize) {
        return { 
          isValid: false, 
          error: `File size exceeds limit (${(stats.size / 1024 / 1024).toFixed(2)}MB > ${this.maxFileSize / 1024 / 1024}MB)`,
          fileSize: stats.size
        };
      }

      // 3. Check file extension
      const extension = path.extname(filePath).toLowerCase().slice(1);
      if (!this.allowedFormats.includes(extension)) {
        return { isValid: false, error: `Extension .${extension} is not allowed` };
      }

      // 4. Check magic bytes (first 12 bytes)
      const magicBytesCheck = await this.verifyMagicBytes(filePath, extension);
      if (!magicBytesCheck.isValid) {
        return magicBytesCheck;
      }

      return {
        isValid: true,
        fileSize: stats.size,
        format: extension === 'jpg' ? 'jpeg' : extension
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during validation';
      return { isValid: false, error: `Validation error: ${errorMessage}` };
    }
  }

  /**
   * Verifies the magic bytes of a file to prevent extension spoofing.
   * 
   * @param filePath - The path to the file.
   * @param extension - The file extension to check against.
   * @returns A promise that resolves to a ValidationResult.
   */
  private async verifyMagicBytes(filePath: string, extension: string): Promise<ValidationResult> {
    const fileHandle = await fs.promises.open(filePath, 'r');
    
    try {
      const buffer = Buffer.alloc(12);
      await fileHandle.read(buffer, 0, 12, 0);

      const hex = buffer.toString('hex').toUpperCase();

      // JPEG: FF D8 FF
      if (extension === 'jpeg' || extension === 'jpg') {
        if (hex.startsWith('FFD8FF')) return { isValid: true };
        return { isValid: false, error: 'Magic bytes mismatch: Not a valid JPEG file' };
      }

      // PNG: 89 50 4E 47
      if (extension === 'png') {
        if (hex.startsWith('89504E47')) return { isValid: true };
        return { isValid: false, error: 'Magic bytes mismatch: Not a valid PNG file' };
      }

      // WebP: 52 49 46 46 (RIFF header)
      if (extension === 'webp') {
        if (hex.startsWith('52494646')) {
          if (hex.slice(16, 24) === '57454250') return { isValid: true };
        }
        return { isValid: false, error: 'Magic bytes mismatch: Not a valid WebP file' };
      }

      // TIFF: 49 49 2A 00 (LE) OR 4D 4D 00 2A (BE)
      if (extension === 'tiff') {
        if (hex.startsWith('49492A00') || hex.startsWith('4D4D002A')) return { isValid: true };
        return { isValid: false, error: 'Magic bytes mismatch: Not a valid TIFF file' };
      }

      // GIF: 47 49 46 38
      if (extension === 'gif') {
        if (hex.startsWith('47494638')) return { isValid: true };
        return { isValid: false, error: 'Magic bytes mismatch: Not a valid GIF file' };
      }

      // BMP: 42 4D
      if (extension === 'bmp') {
        if (hex.startsWith('424D')) return { isValid: true };
        return { isValid: false, error: 'Magic bytes mismatch: Not a valid BMP file' };
      }

      // AVIF: 00 00 00 XX 66 74 79 70 (ftyp box)
      if (extension === 'avif') {
        if (hex.slice(8, 16) === '66747970') return { isValid: true };
        return { isValid: false, error: 'Magic bytes mismatch: Not a valid AVIF file' };
      }

      // HEIC: 00 00 00 XX 66 74 79 70 68 65 69 (ftyp heic)
      if (extension === 'heic') {
        if (hex.slice(8, 24).includes('66747970686569')) return { isValid: true };
        return { isValid: false, error: 'Magic bytes mismatch: Not a valid HEIC file' };
      }

      return { isValid: false, error: `Unsupported format for magic byte check: ${extension}` };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error reading magic bytes';
      return { isValid: false, error: `Magic bytes check failed: ${errorMessage}` };
    } finally {
      await fileHandle.close();
    }
  }
}
