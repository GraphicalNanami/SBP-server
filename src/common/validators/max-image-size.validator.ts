import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates that an image (URL or base64 data URI) doesn't exceed the specified size
 * For base64 data URIs, validates the decoded size
 * For URLs, skips size validation (assumes external validation)
 *
 * @param maxSizeInMB - Maximum allowed size in megabytes (default: 10MB)
 */
export function MaxImageSize(
  maxSizeInMB: number = 10,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxImageSize',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxSizeInMB],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return true; // Let other validators handle type checking
          }

          // Skip validation for URLs
          if (value.startsWith('http://') || value.startsWith('https://')) {
            return true;
          }

          // Check if it's a data URI
          const dataUriPattern = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+);base64,(.+)$/;
          const match = value.match(dataUriPattern);

          if (!match) {
            return true; // Not a data URI, let other validators handle it
          }

          const base64Data = match[2];

          // Calculate the decoded size
          // Base64 encoding increases size by ~33%, so decoded size = (encoded length * 3) / 4
          const decodedSize = (base64Data.length * 3) / 4;
          const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

          return decodedSize <= maxSizeInBytes;
        },
        defaultMessage(args: ValidationArguments) {
          const [maxSize] = args.constraints;
          return `${args.property} image size must not exceed ${maxSize}MB`;
        },
      },
    });
  };
}
