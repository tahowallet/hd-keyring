import { validateMnemonic } from "bip39"
import { keccak256 } from "@ethersproject/keccak256"

export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase().replace(/\r/, " ").replace(/ +/, " ")
}

export function validateAndFormatMnemonic(
  mnemonic: string,
  wordlist?: string[]
): string | null {
  const normalized = normalizeMnemonic(mnemonic)

  if (validateMnemonic(normalized, wordlist)) {
    return normalized
  }
  return null
}

export function normalizeHexAddress(address: string | Buffer): string {
  const addressString =
    typeof address === "object" && !("toLowerCase" in address)
      ? address.toString("hex")
      : address
  const noPrefix = addressString.replace(/^0x/, "")
  const even = noPrefix.length % 2 === 0 ? noPrefix : `0${noPrefix}`
  return `0x${Buffer.from(even, "hex").toString("hex")}`
}

export function toChecksumAddress(address: string, chainId?: number): string {
  const addressWithOutPrefix = normalizeHexAddress(address)
    .replace("0x", "")
    .toLowerCase()
  const prefix = chainId != null ? `${chainId}0x` : ""
  const hash = keccak256(
    Buffer.from(`${prefix}${addressWithOutPrefix}`, "ascii")
  ).replace("0x", "")

  const checkSum = Array.from(addressWithOutPrefix)
    .map((_, index): string => {
      if (parseInt(hash[index], 16) >= 8) {
        return addressWithOutPrefix[index].toUpperCase()
      }
      return addressWithOutPrefix[index]
    })
    .join("")

  return `0x${checkSum}`
}

export function isValidChecksumAddress(
  address: string,
  chainId?: number
): boolean {
  return toChecksumAddress(address, chainId) === address
}
