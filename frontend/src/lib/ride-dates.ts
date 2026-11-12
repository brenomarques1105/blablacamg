// All arithmetic happens at UTC noon on a calendar date, independent of the
// browser's timezone. The starting date comes from America/Sao_Paulo.
export function weekDates(start: string) {
  const first = new Date(`${start}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || Number.isNaN(first.getTime()) || first.toISOString().slice(0, 10) !== start) return [];
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), weekday: date.getUTCDay() };
  });
}
