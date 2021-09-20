import { TransactionRequest } from "@ethersproject/abstract-provider"
import { HDNode } from "@ethersproject/hdnode"
import { Wallet } from "@ethersproject/wallet"

import { generateMnemonic } from "bip39"

import { normalizeHexAddress, validateAndFormatMnemonic } from "./utils"

export type Options = {
  strength?: number
  path?: string
  mnemonic?: string | null
}

const defaultOptions = {
  // default path is BIP-44, where depth 5 is the address index
  path: "m/44'/60'/0'/0",
  strength: 256,
  mnemonic: null,
}

export type SerializedHDKeyring = {
  version: number
  id: string
  mnemonic: string
  path: string
  keyringType: string
}

export default class HDKeyring {
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
      hdOptions.mnemonic || generateMnemonic(hdOptions.strength),
    )

    if (!mnemonic) {
      throw new Error("Invalid mnemonic.")
    }

    this.#mnemonic = mnemonic

    this.path = hdOptions.path
    this.#hdNode = HDNode.fromMnemonic(mnemonic, undefined, "en").derivePath(
      this.path,
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
    }
  }

  async serialize(): Promise<SerializedHDKeyring> {
    return this.serializeSync()
  }

  static deserialize(obj: SerializedHDKeyring): HDKeyring {
    if (obj.version !== 1) {
      throw new Error(`Unknown serialization version ${obj.version}`)
    }

    if (obj.keyringType !== HDKeyring.type) {
      throw new Error("HDKeyring only supports BIP-32/44 style HD wallets.")
    }

    return new HDKeyring({
      mnemonic: obj.mnemonic,
      path: obj.path,
    })
  }

  async signTransaction(
    address: string,
    transaction: TransactionRequest,
  ): Promise<string> {
    const normAddress = normalizeHexAddress(address)
    if (!this.#addressToWallet[normAddress]) {
      throw new Error("Address not found!")
    }
    return this.#addressToWallet[normAddress].signTransaction(transaction)
  }

  async signMessage(address: string, message: string): Promise<string> {
    const normAddress = normalizeHexAddress(address)
    if (!this.#addressToWallet[normAddress]) {
      throw new Error("Address not found!")
    }
    return this.#addressToWallet[normAddress].signMessage(message)
  }

  addAccountsSync(numNewAccounts = 1): string[] {
    const numAddresses = this.#addressIndex

    for (let i = 0; i < numNewAccounts; i += 1) {
      this.#deriveChildWallet(i + numAddresses)
    }

    this.#addressIndex += numNewAccounts
    const addresses = this.getAccountsSync()
    return addresses.slice(numAddresses)
  }

  async addAccounts(numNewAccounts = 1): Promise<string[]> {
    return this.addAccountsSync(numNewAccounts)
  }

  #deriveChildWallet(index: number): void {
    const newPath = `${index}`

    const childNode = this.#hdNode.derivePath(newPath)
    const wallet = new Wallet(childNode)

    this.#wallets.push(wallet)
    const address = normalizeHexAddress(wallet.address)
    this.#addressToWallet[address] = wallet
  }

  getAccountsSync(): string[] {
    return this.#wallets.map((w) => normalizeHexAddress(w.address))
  }

  async getAccounts(): Promise<string[]> {
    return this.getAccountsSync()
  }
}
