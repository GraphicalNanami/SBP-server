import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class GetTopicPostsDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168) // max 7 days
  hours?: number = 24;

  @IsOptional()
  @IsIn(['twitter', 'reddit', 'discord'])
  platform?: 'twitter' | 'reddit' | 'discord';
}

export class GetRelatedTopicsDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168) // max 7 days
  hours?: number = 24;
}

export class ProcessPostsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 100;

  @IsOptional()
  @IsIn(['twitter', 'reddit', 'discord'])
  platform?: 'twitter' | 'reddit' | 'discord';
}
