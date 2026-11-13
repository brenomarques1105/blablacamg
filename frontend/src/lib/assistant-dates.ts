import { todayInSaoPaulo } from "./format.ts";
import { weekDates } from "./ride-dates.ts";

export function resolveAssistantDates(message: string, now = new Date()) {
  const dates = weekDates(todayInSaoPaulo(now));
  const nextWeek = /\b(?:(?:na|da|para\s+a)\s+)?semana\s+que\s+vem\b|\b(?:(?:na|da|para\s+a)\s+)?pr[óo]xima\s+semana\b/giu;
  const relativeDate = /(?<![\p{L}\p{M}\p{N}_])(?:depois\s+de\s+amanh[ãa]|amanh[ãa]|hoje)(?![\p{L}\p{M}\p{N}_])/giu;

  return message.replace(nextWeek, () => {
    const weekday = dates[0].weekday || 7;
    const monday = new Date(`${dates[0].date}T12:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() + 8 - weekday);
    const nextWeekDates = weekDates(monday.toISOString().slice(0, 10));
    const start = nextWeekDates[0].date.split("-").reverse().join("/");
    const end = nextWeekDates[6].date.split("-").reverse().join("/");
    return `entre ${start} e ${end} (inclusive)`;
  }).replace(relativeDate, (phrase) => {
    const word = phrase.toLowerCase();
    const offset = word === "hoje" ? 0 : word.startsWith("depois") ? 2 : 1;
    return dates[offset].date.split("-").reverse().join("/");
  });
}
