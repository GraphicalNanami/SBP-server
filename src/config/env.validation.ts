import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
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

  // Redis configuration: Either REDIS_URL OR (REDIS_HOST + REDIS_PORT)
  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @ValidateIf((o) => !o.REDIS_URL)
  @IsString()
  REDIS_HOST?: string;

  @ValidateIf((o) => !o.REDIS_URL)
  @IsNumber()
  REDIS_PORT?: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsNumber()
  REDIS_DB?: number;

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

  // Custom validation: Ensure Redis configuration is provided
  if (!validatedConfig.REDIS_URL && (!validatedConfig.REDIS_HOST || !validatedConfig.REDIS_PORT)) {
    throw new Error(
      'Redis configuration error: Either REDIS_URL or both REDIS_HOST and REDIS_PORT must be provided'
    );
  }

  return validatedConfig;
}
