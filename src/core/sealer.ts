import * as crypto from 'crypto';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { ANFASeal, ANFAError } from '../types/anfa.types';

/**
 * ImageSealer handles the generation and verification of cryptographic seals for images.
 * It uses SHA-256 for hashing and provides timing-safe comparison.
 */
export class ImageSealer {
  private readonly VERSION = "1.0.0";
  private readonly ALGORITHM = "sha256";

  /**
   * Generates a cryptographic seal for a clean image buffer.
   * 
   * @param cleanBuffer - The buffer of the image with all metadata removed.
   * @returns A promise that resolves to an ANFASeal object.
   */
  public async generateSeal(cleanBuffer: Buffer): Promise<ANFASeal> {
    try {
      logger.info('Generating cryptographic seal...');
      
      const hash = this.computeHash(cleanBuffer);
      
      const seal: ANFASeal = {
        version: this.VERSION,
        hash,
        algorithm: this.ALGORITHM,
        timestamp: new Date().toISOString(),
        imageSize: cleanBuffer.length,
        anfa: true
      };

      logger.info('Seal generated successfully.');
      return seal;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during seal generation';
      logger.error(`Seal generation failed: ${errorMessage}`);
      throw new ANFAError(`Failed to generate seal: ${errorMessage}`, 'SEAL_GEN_FAILED');
    }
  }

  /**
   * Verifies if an image buffer matches its provided seal.
   * Uses constant-time comparison to prevent timing attacks.
   * 
   * @param imageBuffer - The image buffer to verify.
   * @param seal - The seal to verify against.
   * @returns A promise that resolves to true if the seal is valid and matches.
   */
  public async verifySeal(imageBuffer: Buffer, seal: ANFASeal): Promise<boolean> {
    try {
      logger.info('Verifying cryptographic seal...');
      
      // 1. Validate seal structure
      this.validateSealStructure(seal);

      // 2. Recompute hash
      const actualHash = this.computeHash(imageBuffer);

      // 3. Constant-time comparison
      const actualBuffer = Buffer.from(actualHash, 'hex');
      const expectedBuffer = Buffer.from(seal.hash, 'hex');

      if (actualBuffer.length !== expectedBuffer.length) {
        logger.warn('Seal hash length mismatch.');
        return false;
      }

      const isValid = crypto.timingSafeEqual(actualBuffer, expectedBuffer);
      
      if (isValid) {
        logger.info('Seal verification successful.');
      } else {
        logger.warn('Seal verification failed: Hash mismatch.');
      }

      return isValid;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during verification';
      logger.error(`Seal verification failed with error: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Saves the provided seal as a pretty-printed JSON file.
   * 
   * @param seal - The seal to save.
   * @param outputPath - The path where the image is saved. The seal will be named image.anfa.json.
   */
  public async saveSeal(seal: ANFASeal, outputPath: string): Promise<void> {
    try {
      const sealPath = `${outputPath}.anfa.json`;
      logger.info(`Saving seal to: ${sealPath}`);
      
      const json = JSON.stringify(seal, null, 2);
      await fs.promises.writeFile(sealPath, json, 'utf8');
      
      logger.info('Seal saved successfully.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during seal saving';
      logger.error(`Failed to save seal: ${errorMessage}`);
      throw new ANFAError(`Failed to save seal: ${errorMessage}`, 'SEAL_SAVE_FAILED');
    }
  }

  /**
   * Loads a seal from a .anfa.json file.
   * 
   * @param sealPath - The path to the seal file.
   * @returns A promise that resolves to the loaded ANFASeal.
   */
  public async loadSeal(sealPath: string): Promise<ANFASeal> {
    try {
      logger.info(`Loading seal from: ${sealPath}`);
      
      const data = await fs.promises.readFile(sealPath, 'utf8');
      const seal = JSON.parse(data) as ANFASeal;
      
      this.validateSealStructure(seal);
      
      logger.info('Seal loaded and validated successfully.');
      return seal;
    } catch (error: unknown) {
      if (error instanceof ANFAError) throw error;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during seal loading';
      logger.error(`Failed to load seal: ${errorMessage}`);
      throw new ANFAError(`Failed to load seal: ${errorMessage}`, 'SEAL_LOAD_FAILED');
    }
  }

  /**
   * Computes a SHA-256 hash of the buffer.
   */
  private computeHash(buffer: Buffer): string {
    return crypto.createHash(this.ALGORITHM).update(buffer).digest('hex');
  }

  /**
   * Validates the structure and essential fields of an ANFA seal.
   * 
   * @param seal - The seal object to validate.
   * @throws ANFAError if the seal structure is invalid.
   */
  private validateSealStructure(seal: unknown): void {
    if (typeof seal !== 'object' || seal === null) {
      throw new ANFAError('Invalid seal: must be an object', 'INVALID_SEAL');
    }

    const sealRecord = seal as Record<string, unknown>;
    const requiredFields = ['version', 'hash', 'algorithm', 'timestamp', 'imageSize', 'anfa'];

    for (const field of requiredFields) {
      if (!(field in sealRecord)) {
        throw new ANFAError(`Invalid seal structure: Missing ${field}`, 'INVALID_SEAL');
      }
    }

    if (sealRecord['anfa'] !== true) {
      throw new ANFAError('Invalid seal: Not an ANFA seal', 'INVALID_SEAL');
    }
  }
}
