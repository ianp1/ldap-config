module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended'
    ],
    ignorePatterns: [
      "node_modules/",
      "dist/",
      "karma.conf.js",
      "e2e/",
      ".eslintrc.js"
    ],
    rules: {
      "@typescript-eslint/no-inferrable-types": "off"
    }
  };