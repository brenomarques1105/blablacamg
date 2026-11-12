export function todayInSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function whatsappPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^\d{10,11}$/.test(digits)) return `55${digits}`;
  if (/^55\d{10,11}$/.test(digits)) return digits;
  return null;
}

export function extractPhones(text: string) {
  const matches = text.match(/(?<!\d)(?:\+?55[ .-]?)?\(?[1-9]\d\)?[ .-]?\d{4,5}[ .-]?\d{4}(?!\d)/g) ?? [];
  return [...new Set(matches.map(whatsappPhone).filter((phone): phone is string => !!phone))];
}
