/**
 * Embedding Service for generating query embeddings
 * Integrates with EmbeddingGemma service on Railway
 */

const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';

export interface EmbeddingResponse {
  embedding: number[];
  dimension: number;
  model: string;
}

export class EmbeddingService {
  private serviceUrl: string;

  constructor(serviceUrl?: string) {
    this.serviceUrl = serviceUrl || EMBEDDING_SERVICE_URL;
  }

  /**
   * Generate embedding for a single query
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.serviceUrl}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Embedding service error: ${response.statusText}`);
      }

      const data: EmbeddingResponse = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error('Failed to generate embedding for query');
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.serviceUrl}/api/embed/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        throw new Error(`Embedding service error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embeddings;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw new Error('Failed to generate embeddings for queries');
    }
  }

  /**
   * Health check for embedding service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Embedding service health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
