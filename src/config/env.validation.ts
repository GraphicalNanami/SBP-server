import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsString()
  MONGO_URI: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;

  @IsString()
  JWT_SECRET: string;

  @IsNumber()
  JWT_ACCESS_TTL: number;

  @IsNumber()
  JWT_REFRESH_TTL: number;

  @IsNumber()
  BCRYPT_ROUNDS: number;

  @IsOptional()
  @IsString()
  ORG_TERMS_VERSION: string;

  @IsNumber()
  ORG_NAME_MIN_LENGTH: number;

  @IsNumber()
  ORG_NAME_MAX_LENGTH: number;

  @IsNumber()
  ORG_TAGLINE_MAX_LENGTH: number;

  @IsOptional()
  @IsString()
  UPLOAD_DIR: string;

  @IsNumber()
  MAX_FILE_SIZE: number;

  @IsString()
  ALLOWED_IMAGE_TYPES: string;

  @IsString()
  STELLAR_NETWORK: string;

  @IsString()
  STELLAR_HORIZON_URL: string;

  @IsNumber()
  UPLOAD_RATE_LIMIT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
