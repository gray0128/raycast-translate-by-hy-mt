const { defineConfig } = require("eslint/config");
const raycastConfig = require("@raycast/eslint-config");

module.exports = defineConfig([
  ...raycastConfig,
  {
    ignores: ["dist/**", "node_modules/**", "test/**", "assets/**", "eslint.config.js", "raycast-env.d.ts"],
  },
  {
    rules: {
      "@raycast/prefer-title-case": "off",
    },
  },
]);
