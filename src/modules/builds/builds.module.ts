import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BuildsService } from './builds.service';
import { BuildsController } from './builds.controller';
import { Build, BuildSchema } from './schemas/build.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Build.name, schema: BuildSchema }]),
    UsersModule,
  ],
  controllers: [BuildsController],
  providers: [BuildsService],
  exports: [BuildsService],
})
export class BuildsModule {}
