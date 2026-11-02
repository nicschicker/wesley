import { createHash, randomBytes } from "node:crypto";

// Ohne leicht verwechselbare Zeichen (0/O, 1/I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomPart(length: number): string {
  return Array.from(randomBytes(length), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Neuer Code im Format WES-XXXX-XXXX. */
export function generateInvitationCode(): string {
  return `WES-${randomPart(4)}-${randomPart(4)}`;
}

/** Eingabe tolerant normalisieren: Leerzeichen weg, Grossbuchstaben, Bindestriche setzen. */
export function normalizeInvitationCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("WES") ? raw.slice(3) : raw;
  if (body.length !== 8) return "";
  return `WES-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** In der Datenbank liegt nur der Hash, nie der Code selbst. */
export function hashInvitationCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
