import sharp from 'sharp';
import { logger } from '../utils/logger';
import { ANFAError } from '../types/anfa.types';

/**
 * MetadataStripper handles the removal of all metadata from image files.
 * It uses the sharp library for high-performance image processing.
 */
export class MetadataStripper {
  /**
   * Strips all metadata from an image and returns a clean buffer.
   * Supports JPEG, PNG, and WebP.
   * 
   * @param inputPath - The absolute or relative path to the source image.
   * @returns A promise that resolves to a clean image buffer.
   * @throws ANFAError with code 'STRIP_FAILED' if processing fails.
   * @throws ANFAError with code 'VERIFY_FAILED' if the output still contains metadata.
   */
  public async strip(inputPath: string): Promise<Buffer> {
    try {
      logger.info(`Starting metadata stripping for: ${inputPath}`);
      
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      const format = metadata.format;

      logger.debug(`Detected image format: ${format}`);

      // Sharp strips all metadata by default. 
      // We only use .withMetadata() if we wanted to PRESERVE something.
      // Since we want to remove ALL, we just process the image.
      let pipeline = image.rotate(); 

      // Apply quality settings or conversions based on format
      const normalizedFormat = (format as string)?.toLowerCase();

      if (normalizedFormat === 'jpeg' || normalizedFormat === 'jpg') {
        pipeline = pipeline.jpeg({ quality: 95 });
      } else if (normalizedFormat === 'png') {
        pipeline = pipeline.png({ compressionLevel: 9, palette: true });
      } else if (normalizedFormat === 'webp') {
        pipeline = pipeline.webp({ quality: 95 });
      } else if (normalizedFormat === 'tiff' || normalizedFormat === 'tif') {
        pipeline = pipeline.tiff({ compression: 'lzw' });
      } else if (normalizedFormat === 'avif') {
        pipeline = pipeline.avif({ quality: 85 });
      } else if (normalizedFormat === 'gif') {
        logger.warn('GIF output is not supported by sharp. Converting to lossless PNG instead.');
        pipeline = pipeline.png({ compressionLevel: 9 });
      } else if (normalizedFormat === 'bmp') {
        logger.info('BMP detected. Converting to lossless PNG for standardized storage.');
        pipeline = pipeline.png({ compressionLevel: 9 });
      } else if (normalizedFormat === 'heif' || normalizedFormat === 'heic') {
        logger.info('HEIC detected. Converting to high-quality JPEG due to license limitations.');
        pipeline = pipeline.jpeg({ quality: 95 });
      }

      const strippedBuffer = await pipeline.toBuffer();
      logger.info('Metadata successfully stripped.');

      // Verification
      const isClean = await this.verifyClean(strippedBuffer);
      if (!isClean) {
        logger.error('Verification failed: Metadata still present after stripping.');
        throw new ANFAError('Metadata still present after stripping.', 'VERIFY_FAILED');
      }

      return strippedBuffer;
    } catch (error: unknown) {
      if (error instanceof ANFAError) throw error;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during stripping';
      logger.error(`Stripping failed: ${errorMessage}`);
      throw new ANFAError(`Failed to strip metadata: ${errorMessage}`, 'STRIP_FAILED');
    }
  }

  /**
   * Confirms that no metadata (EXIF, XMP, IPTC) remains in the image buffer.
   * 
   * @param imageBuffer - The buffer of the processed image.
   * @returns A promise that resolves to true if no metadata is found.
   */
  public async verifyClean(imageBuffer: Buffer): Promise<boolean> {
    try {
      logger.debug('Starting verification of clean buffer.');
      const metadata = await sharp(imageBuffer).metadata();
      
      const hasExif = !!metadata.exif;
      const hasXmp = !!metadata.xmp;
      const hasIptc = !!metadata.iptc;
      
      if (hasExif || hasXmp || hasIptc) {
        logger.debug(`Metadata found: EXIF=${hasExif}, XMP=${hasXmp}, IPTC=${hasIptc}`);
        return false;
      }

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during verification';
      logger.warn(`Verification process encountered an error: ${errorMessage}`);
      return false;
    }
  }
}
