import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Together from 'together-ai';

interface ExtractedEntity {
  text: string;
  type: 'PERSON' | 'ORG' | 'EVENT' | 'PRODUCT' | 'LOCATION';
  confidence?: number;
}

interface ExtractionResult {
  entities: ExtractedEntity[];
  topics: string[];
  confidence?: number;
}

@Injectable()
export class TogetherAiService {
  private readonly logger = new Logger(TogetherAiService.name);
  private readonly together: Together;
  private readonly primaryModel = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';
  private readonly fallbackModel = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('TOGETHER_API_KEY');
    if (!apiKey) {
      this.logger.warn('TOGETHER_API_KEY not configured - AI features will be disabled');
      this.together = null as any; // Set to null when not configured
    } else {
      this.together = new Together({ apiKey });
    }
  }

  async extractTopicsAndEntities(
    postContent: string, 
    useFallback: boolean = false
  ): Promise<ExtractionResult> {
    if (!this.together) {
      this.logger.warn('Together AI not configured - returning empty extraction result');
      return { entities: [], topics: [] };
    }

    try {
      const model = useFallback ? this.fallbackModel : this.primaryModel;
      
      const response = await this.together.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting named entities and topics from social media content about technology, crypto, finance, and current events. 

Extract:
1. Named Entities: People, organizations, events, products, and locations
2. Topics: Key themes, subjects, and concepts discussed

Return ONLY valid JSON matching the schema. Be concise but comprehensive.`
          },
          {
            role: 'user',
            content: `Extract entities and topics from this content:\n\n${postContent}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'extraction_result',
            schema: {
              type: 'object',
              properties: {
                entities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      type: { 
                        type: 'string', 
                        enum: ['PERSON', 'ORG', 'EVENT', 'PRODUCT', 'LOCATION'] 
                      },
                      confidence: { type: 'number', minimum: 0, maximum: 1 }
                    },
                    required: ['text', 'type']
                  }
                },
                topics: {
                  type: 'array',
                  items: { type: 'string' }
                },
                confidence: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['entities', 'topics']
            }
          }
        },
        temperature: 0.1,
        max_tokens: 512
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }
      
      const result = JSON.parse(content);
      
      this.logger.debug(`Extracted ${result.entities?.length || 0} entities and ${result.topics?.length || 0} topics using ${model}`);
      
      return {
        entities: result.entities || [],
        topics: (result.topics || []).map((topic: string) => topic.toLowerCase().trim()),
        confidence: result.confidence
      };

    } catch (error) {
      this.logger.error(`Together AI extraction error: ${error.message}`);
      
      // If primary model fails and we haven't tried fallback yet, try it
      if (!useFallback && error.message.includes('rate limit')) {
        this.logger.warn('Rate limited on primary model, trying fallback');
        return this.extractTopicsAndEntities(postContent, true);
      }
      
      return { entities: [], topics: [] };
    }
  }

  async classifyContent(
    postContent: string,
    categories: string[]
  ): Promise<string | null> {
    if (!this.together) {
      this.logger.warn('Together AI not configured');
      return null;
    }

    try {
      const response = await this.together.chat.completions.create({
        model: this.primaryModel,
        messages: [
          {
            role: 'system',
            content: `Classify the content into one of these categories: ${categories.join(', ')}. Return ONLY the category name.`
          },
          {
            role: 'user',
            content: postContent
          }
        ],
        response_format: {
          type: 'text'
        },
        temperature: 0.1,
        max_tokens: 50
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }
      
      const classification = content.trim();
      
      if (categories.includes(classification)) {
        return classification;
      }
      
      return null;

    } catch (error) {
      this.logger.error(`Together AI classification error: ${error.message}`);
      return null;
    }
  }

  async batchExtractTopics(
    posts: Array<{ id: string; content: string }>
  ): Promise<Map<string, ExtractionResult>> {
    const results = new Map<string, ExtractionResult>();
    
    // Process in batches of 5 to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      const promises = batch.map(async post => {
        const result = await this.extractTopicsAndEntities(post.content);
        results.set(post.id, result);
      });

      await Promise.all(promises);
      
      // Add small delay between batches to respect rate limits
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async getEmbedding(text: string): Promise<number[] | null> {
    if (!this.together) {
      this.logger.warn('Together AI not configured');
      return null;
    }

    try {
      const response = await this.together.embeddings.create({
        model: 'BAAI/bge-large-en-v1.5',
        input: text
      });

      return response.data[0].embedding;

    } catch (error) {
      this.logger.error(`Together AI embedding error: ${error.message}`);
      return null;
    }
  }
}