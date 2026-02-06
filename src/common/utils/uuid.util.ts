import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { BadRequestException } from '@nestjs/common';

export class UuidUtil {
  static generate(): string {
    return uuidv4();
  }

  static validate(uuid: string): boolean {
    return uuidValidate(uuid);
  }

  static isValidOrThrow(uuid: string): void {
    if (!this.validate(uuid)) {
      throw new BadRequestException(`Invalid UUID: ${uuid}`);
    }
  }
}
