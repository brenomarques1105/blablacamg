import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAssistantDates } from "../src/lib/assistant-dates.ts";

test("relative dates use Belo Horizonte time and roll over the year", () => {
  const now = new Date("2027-01-01T01:00:00Z");
  assert.equal(resolveAssistantDates("Hoje, AMANHÃ ou depois de amanha às 07:40", now),
    "31/12/2026, 01/01/2027 ou 02/01/2027 às 07:40");
});

test("explicit dates and substrings inside words stay intact", () => {
  const message = "Carona em 25/12/2026 ou no amanhecer";
  assert.equal(resolveAssistantDates(message), message);
});

test("next week spans Monday through Sunday in Belo Horizonte", () => {
  const message = "Tem carona para o Buritis na semana que vem?";
  for (const instant of ["2026-11-09T15:00:00Z", "2026-11-16T01:00:00Z"]) {
    assert.equal(resolveAssistantDates(message, new Date(instant)),
      "Tem carona para o Buritis entre 16/11/2026 e 22/11/2026 (inclusive)?");
  }
});
