import { TransactionRequest } from "@ethersproject/abstract-provider"
import { TypedDataDomain, TypedDataField } from "@ethersproject/abstract-signer"
import { Bytes } from "@ethersproject/bytes"
import { HDNode } from "@ethersproject/hdnode"
import { Wallet } from "@ethersproject/wallet"

import { generateMnemonic } from "bip39"

import { normalizeHexAddress, validateAndFormatMnemonic } from "./utils"

export {
  normalizeHexAddress,
  normalizeMnemonic,
  toChecksumAddress,
  validateAndFormatMnemonic,
} from "./utils"

export type Options = {
  strength?: number
  path?: string
  mnemonic?: string | null
  passphrase?: string | null
}

const defaultOptions = {
  // default path is BIP-44, where depth 5 is the address index
  path: "m/44'/60'/0'/0",
  strength: 256,
  mnemonic: null,
  passphrase: null,
}

export type SerializedHDKeyring = {
  version: number
  id: string
  mnemonic: string
  path: string
  keyringType: string
  addressIndex: number
}

export interface Keyring<T> {
  serialize(): Promise<T>
  getAddresses(): Promise<string[]>
  addAddresses(n?: number): Promise<string[]>
  signTransaction(
    address: string,
    transaction: TransactionRequest
  ): Promise<string>
  signTypedData(
    address: string,
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, unknown>
  ): Promise<string>
  signMessage(address: string, message: string): Promise<string>
}

export interface KeyringClass<T> {
  new (): Keyring<T>
  deserialize(serializedKeyring: T): Promise<Keyring<T>>
}

export default class HDKeyring implements Keyring<SerializedHDKeyring> {
  static readonly type: string = "bip32"

  readonly path: string

  readonly id: string

  #hdNode: HDNode

  #addressIndex: number

  #wallets: Wallet[]

  #addressToWallet: { [address: string]: Wallet }

  #mnemonic: string

  constructor(options: Options = {}) {
    const hdOptions: Required<Options> = {
      ...defaultOptions,
      ...options,
    }

    const mnemonic = validateAndFormatMnemonic(
      hdOptions.mnemonic || generateMnemonic(hdOptions.strength)
    )

    if (!mnemonic) {
      throw new Error("Invalid mnemonic.")
    }

    this.#mnemonic = mnemonic

    const passphrase = hdOptions.passphrase ?? ""

    this.path = hdOptions.path
    this.#hdNode = HDNode.fromMnemonic(mnemonic, passphrase, "en").derivePath(
      this.path
    )
    this.id = this.#hdNode.fingerprint
    this.#addressIndex = 0
    this.#wallets = []
    this.#addressToWallet = {}
  }

  serializeSync(): SerializedHDKeyring {
    return {
      version: 1,
      id: this.id,
      mnemonic: this.#mnemonic,
      keyringType: HDKeyring.type,
      path: this.path,
      addressIndex: this.#addressIndex,
    }
  }

  async serialize(): Promise<SerializedHDKeyring> {
    return this.serializeSync()
  }

  static deserialize(obj: SerializedHDKeyring, passphrase?: string): HDKeyring {
    const { version, keyringType, mnemonic, path, addressIndex } = obj
    if (version !== 1) {
      throw new Error(`Unknown serialization version ${obj.version}`)
    }

    if (keyringType !== HDKeyring.type) {
      throw new Error("HDKeyring only supports BIP-32/44 style HD wallets.")
    }

    const keyring = new HDKeyring({
      mnemonic,
      path,
      passphrase,
    })

    keyring.addAddressesSync(addressIndex)

    return keyring
  }

  async signTransaction(
    address: string,
    transaction: TransactionRequest
  ): Promise<string> {
    const normAddress = normalizeHexAddress(address)
    if (!this.#addressToWallet[normAddress]) {
      throw new Error("Address not found!")
    }
    return this.#addressToWallet[normAddress].signTransaction(transaction)
  }

  async signTypedData(
    address: string,
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, unknown>
  ): Promise<string> {
    const normAddress = normalizeHexAddress(address)
    if (!this.#addressToWallet[normAddress]) {
      throw new Error("Address not found!")
    }
    // eslint-disable-next-line no-underscore-dangle
    return this.#addressToWallet[normAddress]._signTypedData(
      domain,
      types,
      value
    )
  }

  async signMessage(address: string, message: string): Promise<string> {
    const normAddress = normalizeHexAddress(address)
    if (!this.#addressToWallet[normAddress]) {
      throw new Error("Address not found!")
    }
    return this.#addressToWallet[normAddress].signMessage(message)
  }

  async signMessageBytes(address: string, message: Bytes): Promise<string> {
    // Explicitly guard so non-TypeScript callers don't get an
    // impossible-to-track-down bad signature by accidentally passing a string
    // here.
    if (typeof message === "string") {
      throw new Error(
        "signMessageBytes cannot be used to sign strings or hex strings; please convert to a byte array first."
      )
    }
    const normAddress = normalizeHexAddress(address)
    if (!this.#addressToWallet[normAddress]) {
      throw new Error("Address not found!")
    }
    return this.#addressToWallet[normAddress].signMessage(message)
  }

  addAddressesSync(numNewAccounts = 1): string[] {
    const numAddresses = this.#addressIndex

    if (numNewAccounts < 0 || numAddresses + numNewAccounts > 2 ** 31 - 1) {
      throw new Error("New account index out of range")
    }

    for (let i = 0; i < numNewAccounts; i += 1) {
      this.#deriveChildWallet(i + numAddresses)
    }

    this.#addressIndex += numNewAccounts
    const addresses = this.getAddressesSync()
    return addresses.slice(-numNewAccounts)
  }

  async addAddresses(numNewAccounts = 1): Promise<string[]> {
    return this.addAddressesSync(numNewAccounts)
  }

  #deriveChildWallet(index: number): void {
    const newPath = `${index}`

    const childNode = this.#hdNode.derivePath(newPath)
    const wallet = new Wallet(childNode.privateKey)

    this.#wallets.push(wallet)
    const address = normalizeHexAddress(wallet.address)
    this.#addressToWallet[address] = wallet
  }

  exportPrivateKey(
    address: string,
    confirmation: "I solemnly swear that I am treating this private key material with great care."
  ): string | null {
    if (
      confirmation ===
      "I solemnly swear that I am treating this private key material with great care."
    ) {
      const wallet = this.#addressToWallet[address]
      return wallet ? wallet.privateKey : null
    }
    throw new Error(
      "Confirmation constant string must be provided to acknowledge the danger of exporting a private key"
    )
  }

  getAddressesSync(): string[] {
    return this.#wallets.map((w) => normalizeHexAddress(w.address))
  }

  async getAddresses(): Promise<string[]> {
    return this.getAddressesSync()
  }
}
