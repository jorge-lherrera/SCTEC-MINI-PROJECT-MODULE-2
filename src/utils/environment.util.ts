export function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function requireIntegerEnvironmentVariable(name: string): number {
  const value = Number(requireEnvironmentVariable(name));

  if (!Number.isInteger(value)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }

  return value;
}

export function readBooleanEnvironmentVariable(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === 'true';
}
