import { describe, expect, it } from "vitest";
import { generateInvitationCode, hashInvitationCode, normalizeInvitationCode } from "./invitation-code";

describe("Einladungscodes", () => {
  it("erzeugt Codes im Format WES-XXXX-XXXX", () => {
    expect(generateInvitationCode()).toMatch(/^WES-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("normalisiert Kleinschreibung, Leerzeichen und fehlende Bindestriche", () => {
    expect(normalizeInvitationCode(" wes abcd efgh ")).toBe("WES-ABCD-EFGH");
    expect(normalizeInvitationCode("abcdefgh")).toBe("WES-ABCD-EFGH");
  });

  it("lehnt falsche Längen ab", () => {
    expect(normalizeInvitationCode("WES-ABC")).toBe("");
  });

  it("hasht stabil", () => {
    expect(hashInvitationCode("WES-ABCD-EFGH")).toHaveLength(64);
    expect(hashInvitationCode("WES-ABCD-EFGH")).toBe(hashInvitationCode("WES-ABCD-EFGH"));
  });
});
