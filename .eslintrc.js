module.exports = {
  root: true,
  extends: ["@thesis-co/eslint-config"],
  parserOptions: {
    project: "./.tsconfig-eslint.json",
  },
  ignorePatterns: ["dist/*"],
};
