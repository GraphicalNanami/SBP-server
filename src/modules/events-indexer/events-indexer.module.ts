import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Schemas
import { Post, PostSchema } from './schemas/post.schema';
import { Author, AuthorSchema } from './schemas/author.schema';
import { Topic, TopicSchema } from './schemas/topic.schema';

// Services
import { TwitterService } from './services/twitter.service';
import { RedditService } from './services/reddit.service';
import { TogetherAiService } from './services/together-ai.service';
import { TopicMatchingService } from './services/topic-matching.service';
import { PostProcessingService } from './services/post-processing.service';
import { EventsIndexerService } from './services/events-indexer.service';

// Controllers
import { EventsIndexerController } from './events-indexer.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Topic.name, schema: TopicSchema },
    ]),
  ],
  controllers: [EventsIndexerController],
  providers: [
    TwitterService,
    RedditService,
    TogetherAiService,
    TopicMatchingService,
    PostProcessingService,
    EventsIndexerService,
  ],
  exports: [EventsIndexerService],
})
export class EventsIndexerModule {}
