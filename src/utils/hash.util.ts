import { compare, hash } from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plainPassword, passwordHash);
}
