import { validateMnemonic } from "bip39"
import { pbkdf2Sync } from "pbkdf2"

export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase()
}

export function validateAndFormatMnemonic(
  mnemonic: string,
  wordlist?: string[],
): string | null {
  const normalized = normalizeMnemonic(mnemonic)

  if (validateMnemonic(normalized, wordlist)) {
    return normalized
  }
  return null
}

export function normalizeHexAddress(address: string): string {
  const lower = address.toLowerCase()
  const noPrefix = lower.replace(/^0x/, "")
  const even = noPrefix.length % 2 === 0 ? noPrefix : `0${noPrefix}`
  return `0x${even}`
}

/*
 * Derive a deterministic ID from a mnemonic that's safe to share publicly.
 * Useful for identifying particular HD wallets from their mnemonics.
 */
export function idFromMnemonic(mnemonic: string, salt: string): string {
  return pbkdf2Sync(
    Buffer.from(mnemonic, "utf8"),
    Buffer.from(`tally-${salt}`, "utf8"),
    4096,
    32,
    "sha512",
  ).toString("hex")
}
