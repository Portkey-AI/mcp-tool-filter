import { EmbeddingConfig, LocalEmbeddingConfig, APIEmbeddingConfig } from './types.js';
import OpenAI from 'openai';

/**
 * Abstract embedding provider interface
 */
export interface EmbeddingProvider {
  /**
   * Embed a single text
   */
  embed(text: string): Promise<Float32Array>;

  /**
   * Embed multiple texts in batch
   */
  embedBatch(texts: string[]): Promise<Float32Array[]>;

  /**
   * Get the dimension of embeddings
   */
  getDimensions(): number;
}

/**
 * OpenAI embedding provider
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(config: APIEmbeddingConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });

    // Default to text-embedding-3-small for speed
    this.model = config.model || 'text-embedding-3-small';
    this.dimensions = config.dimensions || 1536;
  }

  async embed(text: string): Promise<Float32Array> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
      dimensions: this.dimensions,
    });

    return new Float32Array(response.data[0].embedding);
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    // OpenAI supports batch embedding up to 2048 inputs
    const batchSize = 2048;
    const results: Float32Array[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
        dimensions: this.dimensions,
      });

      results.push(...response.data.map(d => new Float32Array(d.embedding)));
    }

    return results;
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

/**
 * Local embedding provider using transformers.js
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  private pipeline: any;
  private model: string;
  private dimensions: number = 384; // Default for all-MiniLM-L6-v2
  private initialized: boolean = false;
  private quantized: boolean;

  constructor(config: LocalEmbeddingConfig) {
    // Default to a fast, compact model
    this.model = config.model || 'Xenova/all-MiniLM-L6-v2';
    this.quantized = config.quantized !== false; // Default to true

    // Set dimensions based on model
    if (this.model.includes('all-MiniLM-L6-v2')) {
      this.dimensions = 384;
    } else if (this.model.includes('all-MiniLM-L12-v2')) {
      this.dimensions = 384;
    } else if (this.model.includes('bge-small')) {
      this.dimensions = 384;
    } else if (this.model.includes('bge-base')) {
      this.dimensions = 768;
    }
  }

  private async initPipeline() {
    if (this.initialized) return;

    const { pipeline } = await import('@xenova/transformers');

    // Initialize the feature extraction pipeline
    this.pipeline = await pipeline('feature-extraction', this.model, {
      quantized: this.quantized,
    });

    this.initialized = true;
  }

  private mean_pooling(lastHiddenState: any, attentionMask: any) {
    // Mean pooling - take average of token embeddings
    const inputMaskExpanded = attentionMask.unsqueeze(-1).expand(lastHiddenState.size()).data;
    const sumEmbeddings = lastHiddenState.data.reduce((acc: number[], val: number, idx: number) => {
      acc[idx % this.dimensions] = (acc[idx % this.dimensions] || 0) + val * inputMaskExpanded[idx];
      return acc;
    }, new Array(this.dimensions).fill(0));

    const sumMask = inputMaskExpanded.reduce((acc: number[], val: number, idx: number) => {
      acc[idx % this.dimensions] = (acc[idx % this.dimensions] || 0) + val;
      return acc;
    }, new Array(this.dimensions).fill(0));

    return sumEmbeddings.map((val: number, idx: number) => val / Math.max(sumMask[idx], 1e-9));
  }

  async embed(text: string): Promise<Float32Array> {
    await this.initPipeline();

    // Generate embedding
    const output = await this.pipeline(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to Float32Array
    return new Float32Array(output.data);
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    await this.initPipeline();

    // Process in parallel for better performance
    const results = await Promise.all(texts.map(text => this.embed(text)));
    return results;
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

/**
 * Voyage AI embedding provider (placeholder - would need voyage-ai SDK)
 */
export class VoyageEmbeddingProvider implements EmbeddingProvider {
  constructor(config: APIEmbeddingConfig) {
    throw new Error('Voyage AI provider not yet implemented. Use OpenAI provider for now.');
  }

  async embed(text: string): Promise<Float32Array> {
    throw new Error('Not implemented');
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    throw new Error('Not implemented');
  }

  getDimensions(): number {
    throw new Error('Not implemented');
  }
}

/**
 * Cohere embedding provider (placeholder - would need cohere-ai SDK)
 */
export class CohereEmbeddingProvider implements EmbeddingProvider {
  constructor(config: APIEmbeddingConfig) {
    throw new Error('Cohere provider not yet implemented. Use OpenAI provider for now.');
  }

  async embed(text: string): Promise<Float32Array> {
    throw new Error('Not implemented');
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    throw new Error('Not implemented');
  }

  getDimensions(): number {
    throw new Error('Not implemented');
  }
}

/**
 * Factory to create embedding provider
 */
export function createEmbeddingProvider(config: EmbeddingConfig): EmbeddingProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIEmbeddingProvider(config);
    case 'voyage':
      return new VoyageEmbeddingProvider(config);
    case 'cohere':
      return new CohereEmbeddingProvider(config);
    case 'local':
      return new LocalEmbeddingProvider(config);
    default:
      throw new Error(`Unknown embedding provider: ${(config as any).provider}`);
  }
}
