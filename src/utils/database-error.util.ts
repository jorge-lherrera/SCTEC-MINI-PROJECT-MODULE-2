import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION_CODE = '23505';

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as PostgresDriverError;

  return (
    driverError.code === UNIQUE_VIOLATION_CODE &&
    driverError.constraint === constraint
  );
}
