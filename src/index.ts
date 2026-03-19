import * as fs from 'fs';
import * as path from 'path';
import { ImageValidator } from './core/validator';
import { MetadataStripper } from './core/stripper';
import { ImageSealer } from './core/sealer';
import { 
  ANFASeal, 
  ValidationResult, 
  ANFAResult, 
  ANFAError 
} from './types/anfa.types';
import { logger } from './utils/logger';

// Export types for developers
export { ANFASeal, ValidationResult, ANFAResult, ANFAError };

/**
 * ANFALayer is the main entry point for the ANFA security and privacy layer.
 * It provides a simplified API to process and verify images.
 */
export class ANFALayer {
  private validator: ImageValidator;
  private stripper: MetadataStripper;
  private sealer: ImageSealer;

  constructor() {
    this.validator = new ImageValidator();
    this.stripper = new MetadataStripper();
    this.sealer = new ImageSealer();
  }

  /**
   * Processes an image by validating it, stripping all metadata, 
   * and generating a cryptographic seal.
   * 
   * @param inputPath - Path to the source image.
   * @param outputDir - Directory where the clean image and seal will be saved.
   * @returns Resulting file paths and the cryptographic seal.
   */
  public async processImage(inputPath: string, outputDir: string): Promise<ANFAResult> {
    try {
      logger.info(`Processing image: ${inputPath} -> ${outputDir}`);

      // 1. Validation
      const validation = await this.validator.validate(inputPath);
      if (!validation.isValid) {
        throw new ANFAError(`Validation failed: ${validation.error}`, 'INVALID_INPUT');
      }

      // 2. Metadata Stripping
      const cleanBuffer = await this.stripper.strip(inputPath);
      const originalSize = fs.statSync(inputPath).size;
      const cleanSize = cleanBuffer.length;

      // 3. Sealing
      const seal = await this.sealer.generateSeal(cleanBuffer);

      // 4. Persistence
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileName = path.basename(inputPath);
      const outputPath = path.join(outputDir, fileName);
      const sealPath = `${outputPath}.anfa.json`;

      await fs.promises.writeFile(outputPath, cleanBuffer);
      await this.sealer.saveSeal(seal, outputPath);

      logger.info(`Successfully processed image: ${fileName}`);
      
      return {
        outputPath,
        sealPath,
        seal,
        originalSize,
        cleanSize
      };
    } catch (error: unknown) {
      if (error instanceof ANFAError) throw error;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
      logger.error(`Critical error during image processing: ${errorMessage}`);
      throw new ANFAError(`Process failed: ${errorMessage}`, 'PROCESS_FAILED');
    }
  }

  /**
   * Verifies an image buffer against its sidecar seal file.
   * 
   * @param imagePath - Path to the processed image.
   * @param sealPath - Path to the corresponding .anfa.json file.
   * @returns true if the image is authentic and unmodified.
   */
  public async verifyImage(imagePath: string, sealPath: string): Promise<boolean> {
    try {
      logger.info(`Verifying image integrity: ${imagePath}`);
      
      const imageBuffer = await fs.promises.readFile(imagePath);
      const seal = await this.sealer.loadSeal(sealPath);

      return await this.sealer.verifySeal(imageBuffer, seal);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during verification';
      logger.error(`Verification process failed: ${errorMessage}`);
      return false;
    }
  }
}

// Simple CLI Support
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\nUsage: node dist/index.js <input_image> <output_directory>\n');
    process.exit(1);
  }

  const [input, output] = args;
  const anfa = new ANFALayer();

  console.log('\n--- ANFA Layer Processing ---');
  
  anfa.processImage(input, output)
    .then(result => {
      console.log('\nSUCCESS!');
      console.log(`- Clean Image: ${result.outputPath}`);
      console.log(`- Seal File:  ${result.sealPath}`);
      console.log(`- Original Size: ${(result.originalSize / 1024).toFixed(2)} KB`);
      console.log(`- Clean Size:    ${(result.cleanSize / 1024).toFixed(2)} KB`);
      console.log(`- Security Hash: ${result.seal.hash.substring(0, 16)}...\n`);
    })
    .catch(err => {
      console.error('\nERROR:', err.message);
      if (err instanceof ANFAError) {
        console.error(`Error Code: ${err.code}`);
      }
      process.exit(1);
    });
}
