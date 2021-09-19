import HDWallet, { hdkey as EthereumHDKey } from "ethereumjs-wallet"
import { generateMnemonic, mnemonicToSeedSync } from "bip39"
import SimpleKeyring from "eth-simple-keyring"

import {
  idFromMnemonic,
  normalizeHexAddress,
  normalizeMnemonic,
  validateAndFormatMnemonic,
} from "./utils"

export function generateTimeBasedIDFromMnemonic(
  mnemonic: string,
  time: number,
): string {
  // use a poor man's salt to provide some precomputation / rainbow table
  // resistance while maintaining determinism
  const salt = new Date(Math.round(time / 2 / 60 / 1000) * 2 * 60 * 1000)
    .getTime()
    .toString()

  const normalized = normalizeMnemonic(mnemonic)

  return idFromMnemonic(normalized, salt)
}

export type Options = {
  strength?: number
  path?: string
  keyringType?: string
  mnemonic?: string | null
  id?: string | null
}

const defaultOptions = {
  path: "m/44'/60'/0'/0",
  strength: 256,
  keyringType: "bip44",
  mnemonic: null,
  id: null,
}

export type SerializedHDKeyring = {
  version: number
  id: string
  mnemonic: string
  path: string
  keyringType: string
}

export class HDKeyring extends SimpleKeyring {
  readonly type: string

  readonly path: string

  readonly id: string

  readonly hdKey: EthereumHDKey

  readonly hdRoot: EthereumHDKey

  readonly hdWallets: HDWallet[]

  #mnemonic: string

  constructor(options: Options) {
    super()

    const now = Date.now()

    const hdOptions: Required<Options> = {
      ...defaultOptions,
      ...options,
    }

    if (options.keyringType !== "bip44") {
      throw new Error("HDKeyring only supports BIP-32/44 style HD wallets.")
    }

    const mnemonic = validateAndFormatMnemonic(
      hdOptions.mnemonic || generateMnemonic(hdOptions.strength),
    )

    if (!mnemonic) {
      throw new Error("Invalid mnemonic.")
    }

    this.#mnemonic = mnemonic

    this.type = hdOptions.keyringType
    this.path = hdOptions.path

    const seed = mnemonicToSeedSync(mnemonic)
    this.hdKey = EthereumHDKey.fromMasterSeed(seed)
    this.hdRoot = this.hdKey.derivePath(this.path)
    this.hdWallets = []

    // derive a reference to the mnemonic suitable for identifying the wallet
    this.id = hdOptions.id || generateTimeBasedIDFromMnemonic(mnemonic, now)
  }

  serializeSync(): SerializedHDKeyring {
    return {
      version: 1,
      id: this.id,
      mnemonic: this.#mnemonic,
      keyringType: this.type,
      path: this.path,
    }
  }

  async serialize(): Promise<SerializedHDKeyring> {
    return this.serializeSync()
  }

  /* eslint-disable class-methods-use-this */
  async deserialize(_: unknown): Promise<void> {
    throw new Error(
      "HDKeyrings are immutable, and don't support deserialization into an existing instance. Consider HDKeyring.deserialize(..)",
    )
  }
  /* eslint-enable class-methods-use-this */

  static deserialize(obj: SerializedHDKeyring): HDKeyring {
    if (obj.version !== 1) {
      throw new Error(`Unknown serialization version ${obj.version}`)
    }
    return new HDKeyring({
      id: obj.id,
      mnemonic: obj.mnemonic,
      path: obj.path,
      keyringType: obj.keyringType,
    })
  }

  addAccountsSync(numNewAccounts = 1): string[] {
    const numAddresses = this.getAccountsSync().length

    for (let i = 0; i < numNewAccounts; i += 1) {
      this.addAccountAtIndex(i + numAddresses)
    }

    const addresses = this.getAccountsSync()
    return addresses.slice(numAddresses)
  }

  async addAccounts(numNewAccounts = 1): Promise<string[]> {
    return this.addAccountsSync(numNewAccounts)
  }

  private addAccountAtIndex(index: number) {
    const hdWallet = this.hdRoot.deriveChild(index).getWallet()
    this.hdWallets.push(hdWallet)
  }

  getAccountsSync(): string[] {
    return this.hdWallets.map((w) =>
      normalizeHexAddress(w.getAddress().toString("hex")),
    )
  }

  async getAccounts(): Promise<string[]> {
    return this.getAccountsSync()
  }
}
