import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const MAX_IDENTITY_VALUE = 2_147_483_647;
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
