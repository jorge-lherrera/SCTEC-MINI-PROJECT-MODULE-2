import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION_CODE = '23505';
const EXCLUSION_VIOLATION_CODE = '23P01';

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  return isConstraintViolation(error, UNIQUE_VIOLATION_CODE, constraint);
}

export function isExclusionViolation(
  error: unknown,
  constraint: string,
): boolean {
  return isConstraintViolation(error, EXCLUSION_VIOLATION_CODE, constraint);
}

function isConstraintViolation(
  error: unknown,
  code: string,
  constraint: string,
): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as PostgresDriverError;

  return driverError.code === code && driverError.constraint === constraint;
}
