import { test } from "node:test";
import assert from "node:assert/strict";
import { weekDates } from "../src/lib/ride-dates.ts";

test("weekly selection crosses month and year boundaries correctly", () => {
  const dates = weekDates("2026-12-29");
  assert.equal(dates.length, 7);
  assert.deepEqual(dates[6], { date: "2027-01-04", weekday: 1 });
  assert.deepEqual(dates.filter(({ weekday }) => weekday > 0 && weekday < 6).map(({ date }) => date), ["2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-04"]);
});

test("invalid calendar dates cannot create weekly offers", () => {
  for (const date of ["", "2026-02-30", "2026-13-01", "not-a-date"]) assert.deepEqual(weekDates(date), []);
});
