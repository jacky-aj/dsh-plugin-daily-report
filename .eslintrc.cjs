module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "script",
  },
  ignorePatterns: ["node_modules/**", "src/**", "test/**", "scripts/**"],
  rules: {
    "no-undef": "error",
  },
  overrides: [
    {
      files: ["index.js", "lib/**/*.js"],
      parserOptions: {
        sourceType: "module",
      },
    },
  ],
};
