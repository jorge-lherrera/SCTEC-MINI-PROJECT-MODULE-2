export const CLINIC_TIME_ZONE = 'America/Sao_Paulo';
export const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_DAY = 86_400_000;
const UTC_OFFSET_PATTERN = /GMT([+-])(\d{2}):(\d{2})/;

const clinicOffsetFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TIME_ZONE,
  timeZoneName: 'longOffset',
});

const clinicClockFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export interface ClinicLocalTime {
  weekDay: number;
  minuteOfDay: number;
}

export function toClinicLocalTime(instant: Date): ClinicLocalTime {
  const parts = new Map(
    clinicClockFormat
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );

  return {
    weekDay: WEEK_DAYS.indexOf(parts.get('weekday') as string),
    minuteOfDay:
      Number(parts.get('hour')) * MINUTES_PER_HOUR + Number(parts.get('minute')),
  };
}

export function startOfClinicDay(date: string, dayOffset = 0): Date {
  const [year, month, day] = date.split('-').map(Number);
  const wallClockMidnight = Date.UTC(year, month - 1, day + dayOffset);
  const firstGuess =
    wallClockMidnight -
    clinicOffsetMinutes(wallClockMidnight) * MILLISECONDS_PER_MINUTE;

  return new Date(
    wallClockMidnight -
      clinicOffsetMinutes(firstGuess) * MILLISECONDS_PER_MINUTE,
  );
}

export function calendarDaysBetween(from: string, to: string): number {
  return (
    (calendarDateToUtc(to) - calendarDateToUtc(from)) / MILLISECONDS_PER_DAY
  );
}

function calendarDateToUtc(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  return Date.UTC(year, month - 1, day);
}

function clinicOffsetMinutes(instant: number): number {
  const zoneName =
    clinicOffsetFormat
      .formatToParts(new Date(instant))
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  const match = UTC_OFFSET_PATTERN.exec(zoneName);

  if (match === null) {
    return 0;
  }

  const minutes = Number(match[2]) * MINUTES_PER_HOUR + Number(match[3]);

  return match[1] === '-' ? -minutes : minutes;
}
