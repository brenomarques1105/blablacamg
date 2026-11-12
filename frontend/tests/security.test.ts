import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "../src/lib/navigation.ts";
import { extractPhones, todayInSaoPaulo, whatsappPhone } from "../src/lib/format.ts";

test("redirect destinations stay on the application origin", () => {
  for (const value of [null, "https://evil.test", "//evil.test", "/\\evil.test", "/\tevil.test", "javascript:alert(1)"]) {
    assert.equal(safeNextPath(value), "/");
  }
  assert.equal(safeNextPath("/caronas/nova?tipo=Ida"), "/caronas/nova?tipo=Ida");
  assert.equal(safeNextPath("/redefinir-senha"), "/redefinir-senha");
});

test("Brazilian phone numbers preserve DDD 55 and normalize country code", () => {
  assert.equal(whatsappPhone("(55) 99999-1234"), "5555999991234");
  assert.equal(whatsappPhone("+55 (31) 96666-6669"), "5531966666669");
  assert.equal(whatsappPhone("123"), null);
  assert.deepEqual(extractPhones("Thiago: (31) 96666-6669; Jorge: +55 (31) 98888-8888; Thiago: (31) 96666-6669"), ["5531966666669", "5531988888888"]);
  assert.deepEqual(extractPhones("16/11/2026 às 07:40"), []);
});

test("ride dates use São Paulo even around UTC midnight", () => {
  assert.equal(todayInSaoPaulo(new Date("2026-11-13T01:00:00Z")), "2026-11-12");
  assert.equal(todayInSaoPaulo(new Date("2026-11-13T04:00:00Z")), "2026-11-13");
});
