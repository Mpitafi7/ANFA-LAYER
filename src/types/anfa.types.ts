export interface AnfaConfig {
  maxFileSizeMB: number;
  allowedFormats: string[];
}

export interface ANFAResult {
  outputPath: string;
  sealPath: string;
  seal: ANFASeal;
  originalSize: number;
  cleanSize: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  format?: string;
  fileSize?: number;
}

export interface ANFASeal {
  version: string;          // ANFA version e.g. "1.0.0"
  hash: string;             // SHA-256 hash of clean image buffer
  algorithm: string;        // always "sha256"
  timestamp: string;        // ISO 8601 UTC timestamp
  imageSize: number;        // byte size of clean image
  anfa: true;               // marker that this is ANFA processed
}

export type SupportedFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'tiff' | 'avif' | 'gif' | 'bmp' | 'heic';

export class ANFAError extends Error {
  constructor(public message: string, public code: string) {
    super(message);
    this.name = 'ANFAError';
    Object.setPrototypeOf(this, ANFAError.prototype);
  }
}
