module.exports = {
  root: true,
  extends: [
      "@tallyho/eslint-config",
  ],
  parserOptions: {
    project: "./.tsconfig-eslint.json",
  },
  rules: {
    "@typescript-eslint/comma-dangle": ["error", "always-multiline"],
  }
}
