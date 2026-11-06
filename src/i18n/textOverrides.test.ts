import { describe, it, expect } from "vitest";
import { applyTextOverrides, flattenTexts } from "./textOverrides";

const base = { delivery: { freeTitle: "უფასო მიწოდება", costDesc: "10₾" }, items: ["a"] };

describe("text overrides", () => {
  it("replaces an edited text", () => {
    expect(applyTextOverrides(base, { "delivery.freeTitle": "ფასიანი მიწოდება" }).delivery.freeTitle).toBe("ფასიანი მიწოდება");
  });
  it("keeps the default when override is empty", () => {
    expect(applyTextOverrides(base, { "delivery.costDesc": "  " }).delivery.costDesc).toBe("10₾");
  });
  it("ignores unknown paths", () => {
    expect(applyTextOverrides(base, { "x.y": "z" })).toEqual(base);
  });
  it("flattens string leaves", () => {
    expect(flattenTexts(base)["delivery.costDesc"]).toBe("10₾");
  });
});
