import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import AhoCorasick from 'modern-ahocorasick';
import { Topic, TopicDocument } from '../schemas/topic.schema';

@Injectable()
export class TopicMatchingService implements OnModuleInit {
  private readonly logger = new Logger(TopicMatchingService.name);
  private ahoCorasick: AhoCorasick;
  private topicMap: Map<string, string[]> = new Map(); // normalized -> [original terms]
  private aliasMap: Map<string, string> = new Map(); // alias -> canonical name

  constructor(
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>
  ) {}

  async onModuleInit() {
    await this.initializeDictionary();
  }

  async initializeDictionary() {
    try {
      // Load topics from database
      const topics = await this.topicModel.find({ is_active: true }).exec();
      
      if (topics.length === 0) {
        this.logger.warn('No topics found in database, initializing with default crypto terms');
        await this.initializeDefaultTopics();
        return this.initializeDictionary();
      }

      // Build dictionary from topics and their aliases
      const dictionary: string[] = [];
      this.topicMap.clear();
      this.aliasMap.clear();

      for (const topic of topics) {
        const canonical = topic.name.toLowerCase().trim();
        
        // Add main topic name
        dictionary.push(canonical);
        
        if (!this.topicMap.has(canonical)) {
          this.topicMap.set(canonical, []);
        }
        this.topicMap.get(canonical)!.push(topic.name);

        // Add aliases
        for (const alias of topic.aliases) {
          const normalizedAlias = alias.toLowerCase().trim();
          dictionary.push(normalizedAlias);
          this.aliasMap.set(normalizedAlias, canonical);
          this.topicMap.get(canonical)!.push(alias);
        }
      }

      // Initialize Aho-Corasick with case-insensitive matching
      this.ahoCorasick = new AhoCorasick(dictionary);
      
      this.logger.log(`Initialized topic dictionary with ${dictionary.length} terms from ${topics.length} topics`);

    } catch (error) {
      this.logger.error(`Error initializing topic dictionary: ${error.message}`);
    }
  }

  private async initializeDefaultTopics() {
    const defaultTopics = [
      // Core Stellar Terms
      { name: 'stellar', aliases: ['xlm', 'Stellar', 'XLM', 'stellar lumens', 'Stellar Lumens', 'lumen', 'lumens'], category: 'cryptocurrency' },
      { name: 'stellar network', aliases: ['stellar blockchain', 'stellar protocol', 'Stellar Network', 'Stellar Blockchain'], category: 'technology' },
      { name: 'stellar development foundation', aliases: ['SDF', 'Stellar.org', 'stellar foundation', 'Stellar Development Foundation'], category: 'organization' },
      
      // Stellar Technology
      { name: 'soroban', aliases: ['stellar soroban', 'soroban smart contracts', 'Soroban', 'stellar smart contracts'], category: 'technology' },
      { name: 'stellar consensus protocol', aliases: ['SCP', 'federated byzantine agreement', 'FBA', 'stellar consensus', 'Stellar Consensus Protocol'], category: 'technology' },
      { name: 'stellar anchor', aliases: ['anchor', 'anchors', 'asset issuer', 'stellar issuer', 'stellar anchors'], category: 'technology' },
      { name: 'stellar horizon', aliases: ['horizon api', 'horizon', 'Horizon', 'Stellar Horizon API'], category: 'technology' },
      { name: 'stellar core', aliases: ['stellar-core', 'Stellar Core'], category: 'technology' },
      { name: 'stellar laboratory', aliases: ['stellar lab', 'laboratory', 'Stellar Laboratory'], category: 'tool' },
      
      // Stellar Ecosystem Projects
      { name: 'stellar quest', aliases: ['StellarQuest', 'Stellar Quest'], category: 'education' },
      { name: 'lobstr', aliases: ['LOBSTR', 'lobstr wallet'], category: 'wallet' },
      { name: 'freighter', aliases: ['Freighter', 'freighter wallet'], category: 'wallet' },
      { name: 'stellarx', aliases: ['StellarX'], category: 'exchange' },
      
      // Partnerships and Use Cases
      { name: 'moneygram', aliases: ['MoneyGram', 'money gram'], category: 'partnership' },
      { name: 'circle', aliases: ['Circle', 'USDC on stellar', 'circle stellar'], category: 'partnership' },
      { name: 'airtm', aliases: ['AirTM'], category: 'partnership' },
      { name: 'vibrant', aliases: ['Vibrant'], category: 'partnership' },
      { name: 'cowrie', aliases: ['Cowrie'], category: 'partnership' },
      { name: 'cross border payments', aliases: ['cross-border payments', 'remittances', 'international transfers', 'global payments'], category: 'use_case' },
      { name: 'financial inclusion', aliases: ['financial inclusion', 'banking the unbanked', 'underbanked'], category: 'use_case' },
      { name: 'cbdc', aliases: ['CBDC', 'central bank digital currency', 'digital currency'], category: 'use_case' },
      
      // Key People
      { name: 'jed mccaleb', aliases: ['Jed McCaleb', 'jed', 'stellar founder'], category: 'person' },
      { name: 'denelle dixon', aliases: ['Denelle Dixon', 'SDF CEO'], category: 'person' },
      
      // Technical Features
      { name: 'stellar multisig', aliases: ['multisignature', 'multi-sig', 'stellar multisignature'], category: 'technology' },
      { name: 'stellar pathfinding', aliases: ['pathfinding', 'path payments', 'stellar paths'], category: 'technology' },
      { name: 'stellar claimable balances', aliases: ['claimable balance', 'claimable balances'], category: 'technology' },
      { name: 'stellar sponsored reserves', aliases: ['sponsored reserves', 'account sponsorship'], category: 'technology' },
      
      // General blockchain (minimal for context)
      { name: 'blockchain', aliases: ['Blockchain', 'distributed ledger'], category: 'technology' },
      { name: 'cryptocurrency', aliases: ['crypto', 'digital asset'], category: 'general' }
    ];

    for (const topicData of defaultTopics) {
      await this.topicModel.create({
        name: topicData.name,
        aliases: topicData.aliases,
        type: 'dictionary_match',
        category: topicData.category,
        frequency: 0,
        is_active: true
      });
    }

    this.logger.log(`Initialized database with ${defaultTopics.length} Stellar-focused topics`);
  }

  async resetAndReloadTopics(): Promise<void> {
    try {
      // Clear all existing topics
      await this.topicModel.deleteMany({});
      this.logger.log('Cleared existing topics from database');
      
      // Reinitialize with new Stellar-focused topics
      await this.initializeDefaultTopics();
      
      // Rebuild the dictionary
      await this.initializeDictionary();
      
      this.logger.log('Successfully reset and reloaded topics with Stellar focus');
    } catch (error) {
      this.logger.error(`Error resetting topics: ${error.message}`);
      throw error;
    }
  }

  matchTopics(text: string, minLength: number = 0): string[] {
    if (!this.ahoCorasick) {
      this.logger.warn('Topic matcher not initialized');
      return [];
    }

    // Apply minimum length filter to avoid spam
    if (minLength > 0 && text.length < minLength) {
      return [];
    }

    try {
      const matches = this.ahoCorasick.search(text.toLowerCase());
      const topics = new Set<string>();

      for (const [position, keywords] of matches) {
        for (const keyword of keywords) {
          // Map alias to canonical name if needed
          const canonical = this.aliasMap.get(keyword) || keyword;
          topics.add(canonical);
        }
      }

      return Array.from(topics);

    } catch (error) {
      this.logger.error(`Error matching topics: ${error.message}`);
      return [];
    }
  }

  async addTopic(name: string, aliases: string[] = [], category?: string): Promise<boolean> {
    try {
      const normalizedName = name.toLowerCase().trim();
      
      // Check if topic already exists
      const existing = await this.topicModel.findOne({ name: normalizedName }).exec();
      if (existing) {
        this.logger.warn(`Topic '${normalizedName}' already exists`);
        return false;
      }

      // Create new topic
      await this.topicModel.create({
        name: normalizedName,
        aliases: aliases,
        type: 'dictionary_match',
        category: category,
        frequency: 0,
        is_active: true
      });

      // Reinitialize dictionary to include new topic
      await this.initializeDictionary();
      
      this.logger.log(`Added new topic: ${normalizedName}`);
      return true;

    } catch (error) {
      this.logger.error(`Error adding topic: ${error.message}`);
      return false;
    }
  }

  async updateTopicFrequency(topicName: string, increment: number = 1): Promise<void> {
    try {
      await this.topicModel.updateOne(
        { name: topicName.toLowerCase() },
        { $inc: { frequency: increment } }
      ).exec();
    } catch (error) {
      this.logger.error(`Error updating topic frequency: ${error.message}`);
    }
  }

  async getTopTopics(limit: number = 50): Promise<TopicDocument[]> {
    try {
      return this.topicModel
        .find({ is_active: true })
        .sort({ frequency: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting top topics: ${error.message}`);
      return [];
    }
  }

  async refreshDictionary(): Promise<void> {
    await this.initializeDictionary();
  }

  getTopicsByCategory(category: string): Promise<TopicDocument[]> {
    return this.topicModel.find({ category, is_active: true }).exec();
  }
}