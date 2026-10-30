export const CLINIC_TIME_ZONE = 'America/Sao_Paulo';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINUTES_PER_HOUR = 60;

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
