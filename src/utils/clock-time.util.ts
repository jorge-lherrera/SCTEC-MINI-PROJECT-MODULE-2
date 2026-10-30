export const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const MINUTES_PER_HOUR = 60;

export function clockTimeToMinutes(clockTime: string): number {
  const [hours, minutes] = clockTime.split(':').map(Number);

  return hours * MINUTES_PER_HOUR + minutes;
}

export function toClockTime(databaseTime: string): string {
  return databaseTime.slice(0, 5);
}
