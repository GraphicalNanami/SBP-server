import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { StrKey } from '@stellar/stellar-sdk';

@ValidatorConstraint({ async: false })
export class IsStellarAddressConstraint
  implements ValidatorConstraintInterface
{
  validate(address: any): boolean {
    if (typeof address !== 'string') {
      return false;
    }

    // Stellar public keys are 56 characters, start with 'G', and are valid Ed25519 public keys
    if (address.length !== 56 || !address.startsWith('G')) {
      return false;
    }

    try {
      return StrKey.isValidEd25519PublicKey(address);
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Invalid Stellar address format. Must be a valid 56-character public key starting with "G"';
  }
}

export function IsStellarAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStellarAddressConstraint,
    });
  };
}
