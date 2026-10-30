export function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
