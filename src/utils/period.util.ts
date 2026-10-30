export interface Period {
  start: number;
  end: number;
}

export function periodsOverlap(first: Period, second: Period): boolean {
  return first.start < second.end && second.start < first.end;
}
