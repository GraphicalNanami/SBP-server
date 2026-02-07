import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates if a value is either a valid URL or a base64 data URI
 * Supports:
 * - HTTP/HTTPS URLs
 * - Data URIs (data:image/png;base64,...)
 */
export function IsUrlOrDataUri(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUrlOrDataUri',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Check if it's a data URI
          const dataUriPattern = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+);base64,(.+)$/;
          if (dataUriPattern.test(value)) {
            return true;
          }

          // Check if it's a valid URL
          try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid URL or base64 data URI`;
        },
      },
    });
  };
}
