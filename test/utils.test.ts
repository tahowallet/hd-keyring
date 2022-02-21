import {
  normalizeMnemonic,
  normalizeHexAddress,
  validateAndFormatMnemonic,
  toChecksumAddress,
} from "../src/utils"

const validMnemonics = [
  "square time hurdle gospel crash uncle flash tomorrow city space shine sad fence ski harsh salt need edit name fold corn chuckle resource else",
  "until issue must",
  "glass skin grass cat photo essay march detail remain",
  "dream dinosaur poem cherry brief hand injury ice stuff steel bench vacant amazing bar uncover",
  "mad such absent minor vapor edge tornado wrestle convince shy battle region adapt order finish foot follow monitor",
]
const twelveOrMoreWordMnemonics = validMnemonics.filter(
  (m) => m.split(" ").length >= 12
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
      expect(normalizeHexAddress(input)).toEqual(expectedOutput)
    )
  })

  it("normalized addresses to checksum", () => {
    const testCases = [
      [
        "0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359",
        "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
      ],
      [
        "0x52908400098527886E0F7030069857D2E4169EE7",
        "0x52908400098527886E0F7030069857D2E4169EE7",
      ],
      [
        "0x8617E340B3D01FA5F11F306F4090FD50E238070D",
        "0x8617E340B3D01FA5F11F306F4090FD50E238070D",
      ],
      [
        "0x8617e340b3d01fa5f11f306f4090fd50e238070d",
        "0x8617E340B3D01FA5F11F306F4090FD50E238070D",
      ],
      [
        "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
        "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
      ],
      [
        "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
        "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
      ],
      [
        "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB",
        "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB",
      ],
      [
        "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb",
        "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb",
      ],
      [
        "0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb",
        "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb",
      ],
    ]

    testCases.forEach(([input, expectedOutput]) =>
      expect(toChecksumAddress(input)).toEqual(expectedOutput)
    )
  })

  it("validates and formats mnemonics", () => {
    twelveOrMoreWordMnemonics.forEach((valid) =>
      expect(validateAndFormatMnemonic(valid)).toEqual(valid)
    )
  })
})
