import { verifyMessage, verifyTypedData } from "@ethersproject/wallet"
import { Bytes } from "@ethersproject/bytes"
import {
  parse,
  recoverAddress,
  serialize,
  UnsignedTransaction,
} from "@ethersproject/transactions"
import { keccak256 } from "@ethersproject/keccak256"
import { TransactionRequest } from "@ethersproject/abstract-provider"
import { toUtf8Bytes } from "@ethersproject/strings"
import HDKeyring from "../src"

const validMnemonics = [
  "square time hurdle gospel crash uncle flash tomorrow city space shine sad fence ski harsh salt need edit name fold corn chuckle resource else",
  "until issue must",
  "glass skin grass cat photo essay march detail remain",
  "dream dinosaur poem cherry brief hand injury ice stuff steel bench vacant amazing bar uncover",
  "mad such absent minor vapor edge tornado wrestle convince shy battle region adapt order finish foot follow monitor",
]

const validDerivations = [
  {
    mnemonic:
      "square time hurdle gospel crash uncle flash tomorrow city space shine sad fence ski harsh salt need edit name fold corn chuckle resource else",
    addresses: [
      "0xca19be978a1d2456d16bde3efb0a5b8946f4a1ce",
      "0xce73b34e2cdf4e00054c509cc5fdf3882d4a87c8",
      "0x0b5446d680c0e665ee63508237337c8a9fe31361",
      "0x342097b215dacc397b7adc11eb54257f6bcb680e",
      "0x53e5caff572f5d16ae00054a77a252a636e56700",
      "0x17e02708eeaa9fc8c6ed86b08af1ea2e81cf18f9",
      "0x4a8d4ad7206c24a1c7e694760dbd35df33068401",
      "0x2d43d1f8f96ff679511209280617a146b049a999",
      "0xf260e5482cc567f04f42f6229b694f3a38721ed9",
      "0xcd29ee2e1fb20fa948451fb66316da280251c439",
    ],
  },
  {
    mnemonic:
      "brain surround have swap horror body response double fire dumb bring hazard",
    addresses: [
      "0x7b4322b9abe447ce86faa6121b35c84ec36945ad",
      "0x33a77a26b8523bf21bfd63f81c77f495627304e3",
      "0x2614fdc904520631f0a24ac3360393e48359fe78",
      "0xd317dcc257bedf8868b8b41a3f053604e08d3618",
      "0x0b87d62bec983a9d7832f560377e8a0876fba9cc",
      "0x6208e7af335ea9422e703b1e688b0e7f17a44a87",
      "0x74502255857e5fc38945cd6391818726fd9117e5",
      "0xc3c542dd8057f1c4a92e0bf6aa0248ed37825472",
      "0xa20ac021efb093f7f56d1e2cff31cca1c6ecac02",
      "0x260268b1cb9f4b9f6269d6051300057e3a8e1cb5",
    ],
  },
]

const testPassphrases = ["super_secret", "1234"]

const twelveOrMoreWordMnemonics = validMnemonics.filter(
  (m) => m.split(" ").length >= 12
)

const underTwelveWorkMnemonics = validMnemonics.filter(
  (m) => m.split(" ").length < 12
)

describe("HDKeyring", () => {
  it("can be constructed without a mnemonic", () => {
    const keyring = new HDKeyring()
    expect(keyring.id).toBeTruthy()
    expect(keyring.id.length).toBeGreaterThan(9)
  })
  it("can be constructed with a mnemonic", () => {
    const keyring = new HDKeyring({
      mnemonic: validMnemonics[0],
    })
    expect(keyring.id).toBeTruthy()
    expect(keyring.id.length).toBeGreaterThan(9)
  })
  it("can be constructed with a mnemonic and passphrase", () => {
    const keyring = new HDKeyring({
      mnemonic: validMnemonics[0],
      passphrase: testPassphrases[0],
    })
    expect(keyring.id).toBeTruthy()
    expect(keyring.id.length).toBeGreaterThan(9)
  })
  it("cannot be constructed with an invalid mnemonic", () => {
    underTwelveWorkMnemonics.forEach((m) =>
      expect(() => new HDKeyring({ mnemonic: m })).toThrowError()
    )
  })
  it("serializes its mnemonic", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })
        const serialized = await keyring.serialize()
        expect(serialized.mnemonic).toBe(m)
      })
    )
  })
  it("deserializes after serializing", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })
        const id1 = keyring.id

        const serialized = await keyring.serialize()
        const deserialized = HDKeyring.deserialize(serialized)

        expect(id1).toBe(deserialized.id)
      })
    )
  })
  it("deserializes with passphrase after serializing", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({
          mnemonic: m,
          passphrase: testPassphrases[0],
        })
        const id1 = keyring.id

        const serialized = await keyring.serialize()
        const deserialized = HDKeyring.deserialize(
          serialized,
          testPassphrases[0]
        )

        expect(id1).toBe(deserialized.id)
      })
    )
  })
  it("fails to deserialize different versions", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })
        const serialized = await keyring.serialize()
        serialized.version = 2
        expect(() => HDKeyring.deserialize(serialized)).toThrowError()
      })
    )
  })
  it("generates the same IDs from the same mnemonic", async () => {
    twelveOrMoreWordMnemonics.forEach((m) => {
      const keyring1 = new HDKeyring({ mnemonic: m })
      const keyring2 = new HDKeyring({ mnemonic: m })

      expect(keyring1.id).toBe(keyring2.id)
    })
  })
  it("generates a different ID from the same mnemonic with a passphrase", async () => {
    twelveOrMoreWordMnemonics.forEach((m) => {
      const keyring1 = new HDKeyring({ mnemonic: m })
      const keyring2 = new HDKeyring({
        mnemonic: m,
        passphrase: testPassphrases[0],
      })

      expect(keyring1.id).not.toBe(keyring2.id)
    })
  })
  it("generates distinct addresses", async () => {
    const allAddresses: string[] = []
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        await keyring.addAddresses(10)

        const addresses = await keyring.getAddresses()
        expect(addresses.length).toEqual(10)
        expect(new Set(addresses).size).toEqual(10)

        allAddresses.concat(addresses)
      })
    )
    expect(new Set(allAddresses).size).toEqual(allAddresses.length)
  })
  it("fails to generate out-of-bounds addresses", async () => {
    const addressBounds0 = await Promise.allSettled(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        // Add negatives, should always fail.
        await keyring.addAddresses(-Math.random() * 10 - 1)
      })
    )

    const addressBoundsMax = await Promise.allSettled(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        await keyring.addAddresses(2 ** 31)
      })
    )

    const addressBoundsMaxSplit = await Promise.allSettled(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        // Adding more than order-of-10 addresses can get so slow it kills test
        // time, thus the small first and second splits.
        const firstSplit = Math.floor(Math.random() * 10)
        const secondSplit = Math.floor(Math.random() * 10)
        const remaining = 2 ** 31 - firstSplit

        await keyring.addAddresses(firstSplit)
        await keyring.addAddresses(secondSplit)
        await keyring.addAddresses(remaining)
      })
    )

    expect(
      [...addressBounds0, ...addressBoundsMax, ...addressBoundsMaxSplit]
        .map(({ status }) => status)
        .every((status) => status === "rejected")
    ).toEqual(true)
  })
  it("generates addresses without off-by-one errors", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.slice(-1).map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        await keyring.addAddresses(10)

        const addresses = await keyring.getAddresses()
        expect(addresses.length).toEqual(10)
        expect(new Set(addresses).size).toEqual(10)

        const keyring2 = new HDKeyring({ mnemonic: m })

        for (let i = 0; i < 10; i += 1) {
          keyring2.addAddressesSync()
        }

        const addresses2 = await keyring2.getAddresses()
        expect(addresses2.length).toEqual(10)
        expect(new Set(addresses2).size).toEqual(10)
      })
    )
  })
  it("generates and initializes the same first address from the same mnemonic", async () => {
    await Promise.all(
      validDerivations.map(async ({ mnemonic, addresses }) => {
        const keyring = new HDKeyring({ mnemonic })

        expect((await keyring.getAddresses()).length).toEqual(0)

        keyring.addAddressesSync()

        expect((await keyring.getAddresses()).length).toEqual(1)
        expect(await keyring.getAddresses()).toStrictEqual([addresses[0]])
      })
    )
  })
  it("generates the same addresses from the same mnemonic", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring1 = new HDKeyring({ mnemonic: m })
        const keyring2 = new HDKeyring({ mnemonic: m })

        keyring1.addAddressesSync()
        keyring2.addAddressesSync()

        expect((await keyring1.getAddresses()).length).toBeGreaterThan(0)
        expect((await keyring2.getAddresses()).length).toBeGreaterThan(0)

        expect(await keyring1.getAddresses()).toStrictEqual(
          await keyring2.getAddresses()
        )
      })
    )
  })
  it("generates different addresses from the same mnemonic with different passphrases", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring1 = new HDKeyring({ mnemonic: m })
        const keyring2 = new HDKeyring({
          mnemonic: m,
          passphrase: testPassphrases[0],
        })
        const keyring3 = new HDKeyring({
          mnemonic: m,
          passphrase: testPassphrases[1],
        })

        keyring1.addAddressesSync()
        keyring2.addAddressesSync()
        keyring3.addAddressesSync()

        expect((await keyring1.getAddresses()).length).toBeGreaterThan(0)
        expect((await keyring2.getAddresses()).length).toBeGreaterThan(0)
        expect((await keyring3.getAddresses()).length).toBeGreaterThan(0)

        expect(await keyring1.getAddresses()).not.toStrictEqual(
          await keyring2.getAddresses()
        )
        expect(await keyring1.getAddresses()).not.toStrictEqual(
          await keyring3.getAddresses()
        )
        expect(await keyring2.getAddresses()).not.toStrictEqual(
          await keyring3.getAddresses()
        )
      })
    )
  })
  it("derives the same addresses as legacy wallets", async () => {
    await Promise.all(
      validDerivations.map(async ({ mnemonic, addresses }) => {
        const keyring = new HDKeyring({ mnemonic })
        await keyring.addAddressesSync(10)
        const newAddresses = keyring.getAddressesSync()
        expect(newAddresses).toStrictEqual(addresses)
      })
    )
  })
  it("returns the correct addresses when generated 1 by 1", async () => {
    await Promise.all(
      validDerivations.slice(-1).map(async ({ mnemonic, addresses }) => {
        const keyring = new HDKeyring({ mnemonic })
        for (let i = 0; i < addresses.length; i += 1) {
          const newAddresses = keyring.addAddressesSync()
          expect(newAddresses.length).toEqual(1)
          expect(newAddresses[0]).toStrictEqual(addresses[i])
        }
      })
    )
  })
  it("signs messages recoverably", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        const addresses = await keyring.addAddresses(2)
        addresses.forEach(async (address) => {
          const message = "recoverThisMessage"
          const sig = await keyring.signMessage(address, message)
          expect(verifyMessage(message, sig).toLowerCase()).toEqual(address)
        })
      })
    )
  })
  it("signs message bytes recoverably", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        const addresses = await keyring.addAddresses(2)
        addresses.forEach(async (address) => {
          const message = "recoverThisMessage"
          const sig = await keyring.signMessageBytes(
            address,
            toUtf8Bytes(message)
          )
          expect(verifyMessage(message, sig).toLowerCase()).toEqual(address)
        })
      })
    )
  })
  it("does not sign message bytes when receiving a string", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        const addresses = await keyring.addAddresses(2)
        addresses.forEach(async (address) => {
          const message = "recoverThisMessage"
          expect(
            await keyring
              .signMessageBytes(address, message as unknown as Bytes)
              .catch(() => "error")
          ).toEqual("error")
        })
      })
    )
  })
  it("signs transactions recoverably", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        const addresses = await keyring.addAddresses(2)
        addresses.forEach(async (address) => {
          const tx: TransactionRequest = {
            to: address,
            value: 300000,
            gasLimit: 300000,
            gasPrice: 300000,
            nonce: 300000,
          }
          const signedTx = await keyring.signTransaction(address, tx)
          const parsed = parse(signedTx)
          const sig = {
            r: parsed.r as string,
            s: parsed.s as string,
            v: parsed.v as number,
          }
          const digest = keccak256(serialize(<UnsignedTransaction>tx))
          expect(recoverAddress(digest, sig).toLowerCase()).toEqual(address)
        })
      })
    )
  })
  it("signs typed data recoverably", async () => {
    await Promise.all(
      twelveOrMoreWordMnemonics.map(async (m) => {
        const keyring = new HDKeyring({ mnemonic: m })

        const addresses = await keyring.addAddresses(2)
        addresses.forEach(async (address) => {
          const domain = {
            name: "Ether Mail",
            version: "1",
            chainId: 1,
            verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
          }

          const types = {
            Person: [{ name: "name", type: "string" }],
            Mail: [
              { name: "from", type: "Person" },
              { name: "to", type: "Person" },
              { name: "contents", type: "string" },
            ],
          }

          const value = {
            contents: "Hello, Bob!",
            from: {
              name: "Alice",
            },
            to: {
              name: "Bob",
            },
          }

          const sig = await keyring.signTypedData(address, domain, types, value)

          expect(
            verifyTypedData(domain, types, value, sig).toLowerCase()
          ).toEqual(address)
        })
      })
    )
  })
})
