import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { MAX_IDENTITY_VALUE } from '../utils/identity.util';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  public transform(value: string): number {
    const id = Number(value);

    if (!POSITIVE_INTEGER_PATTERN.test(value) || id > MAX_IDENTITY_VALUE) {
      throw new BadRequestException(
        'O identificador deve ser um número inteiro positivo.',
      );
    }

    return id;
  }
}
