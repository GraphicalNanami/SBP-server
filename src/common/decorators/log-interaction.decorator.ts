import { Logger } from '@nestjs/common';

export function LogInteraction() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const logger = new Logger(className);

    descriptor.value = async function (...args: any[]) {
      const methodSignature = `${className}.${propertyKey}`;

      // Mask sensitive data in arguments
      const maskedArgs = args.map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          const masked = { ...arg };
          const sensitiveKeys = [
            'password',
            'token',
            'accessToken',
            'refreshToken',
            'secret',
          ];

          for (const key in masked) {
            if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
              masked[key] = '***MASKED***';
            }
          }
          return masked;
        }
        return arg;
      });

      logger.debug(
        `Calling ${methodSignature} with args: ${JSON.stringify(maskedArgs)}`,
      );

      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - start;

        // Optional: Log result summary (be careful with large objects)
        const resultLog = typeof result === 'object' ? 'Object' : result;
        logger.debug(
          `${methodSignature} executed in ${executionTime}ms. Result: ${JSON.stringify(resultLog)}`,
        );

        return result;
      } catch (error) {
        const executionTime = Date.now() - start;
        logger.error(
          `${methodSignature} failed after ${executionTime}ms. Error: ${error instanceof Error ? error.message : error}`,
        );
        throw error;
      }
    };

    return descriptor;
  };
}
