import HDKeyring from "../src"

const validMnemonics = [
  "square time hurdle gospel crash uncle flash tomorrow city space shine sad fence ski harsh salt need edit name fold corn chuckle resource else",
  "until issue must",
  "glass skin grass cat photo essay march detail remain",
  "dream dinosaur poem cherry brief hand injury ice stuff steel bench vacant amazing bar uncover",
  "mad such absent minor vapor edge tornado wrestle convince shy battle region adapt order finish foot follow monitor",
]

const twelveOrMoreWordMnemonics = validMnemonics.filter(
  (m) => m.split(" ").length >= 12,
)

const underTwelveWorkMnemonics = validMnemonics.filter(
  (m) => m.split(" ").length < 12,
)

describe("HDKeyring", () => {
  it("can be constructed without a mnemonic", () => {
    const keyring = new HDKeyring()
    expect(keyring.id).toBeTruthy()
    expect(keyring.id.length).toBeGreaterThan(10)
  })
  it("can be constructed with a mnemonic", () => {
    const keyring = new HDKeyring({
      mnemonic: validMnemonics[0],
    })
    expect(keyring.id).toBeTruthy()
    expect(keyring.id.length).toBeGreaterThan(10)
  })
  it("cannot be constructed with an invalid mnemonic", () => {
    underTwelveWorkMnemonics.forEach((m) =>
      expect(() => new HDKeyring({ mnemonic: m })).toThrowError(),
    )
  })
  it("serializes its mnemonic", () => {
    twelveOrMoreWordMnemonics.forEach(async (m) => {
      const keyring = new HDKeyring({ mnemonic: m })
      const serialized = await keyring.serialize()
      expect(serialized.mnemonic).toBe(m)
    })
  })
  it("deserializes after serializing", () => {
    twelveOrMoreWordMnemonics.forEach(async (m) => {
      const keyring = new HDKeyring({ mnemonic: m })
      const id1 = keyring.id

      const serialized = await keyring.serialize()
      const deserialized = HDKeyring.deserialize(serialized)

      expect(id1).toBe(deserialized.id)
    })
  })
  it("fails to deserialize different versions", () => {
    twelveOrMoreWordMnemonics.forEach(async (m) => {
      const keyring = new HDKeyring({ mnemonic: m })
      const serialized = await keyring.serialize()
      serialized.version = 2
      expect(() => HDKeyring.deserialize(serialized)).toThrowError()
    })
  })
  it("generates the same IDs from the same mnemonic", async () => {
    twelveOrMoreWordMnemonics.forEach(async (m) => {
      const keyring1 = new HDKeyring({ mnemonic: m })
      const keyring2 = new HDKeyring({ mnemonic: m })

      expect(keyring1.id).toBe(keyring2.id)
    })
  })
  it("generates the same accounts from the same mnemonic", async () => {
    twelveOrMoreWordMnemonics.forEach(async (m) => {
      const keyring1 = new HDKeyring({ mnemonic: m })
      const keyring2 = new HDKeyring({ mnemonic: m })

      await keyring1.addAccounts()
      await keyring2.addAccounts()

      expect(await keyring1.getAccounts()).toStrictEqual(
        await keyring2.getAccounts(),
      )
    })
  })
  it.todo("signs transactions recoverably")
  it.todo("signs messages recoverably")
  it.todo("signs typed data recoverably")
})
