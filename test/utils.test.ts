import {
  normalizeMnemonic,
  normalizeHexAddress,
  validateAndFormatMnemonic,
} from "../src/utils"

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

describe("utils", () => {
  it("normalizes mnemonics", () => {
    const m1 = "ABE fish onE  "
    expect(normalizeMnemonic(m1)).toEqual("abe fish one")
  })
  it("normalizes addresses", () => {
    const testCases = [
      ["123abEd", "0x0123abed"],
      ["0x3ABCDEF123456789", "0x3abcdef123456789"],
      [Buffer.from("123456", "hex"), "0x123456"],
    ]

    testCases.forEach(([input, expectedOutput]) =>
      expect(normalizeHexAddress(input)).toEqual(expectedOutput),
    )
  })

  it("validates and formats mnemonics", () => {
    twelveOrMoreWordMnemonics.forEach((valid) =>
      expect(validateAndFormatMnemonic(valid)).toEqual(valid),
    )
  })
})
