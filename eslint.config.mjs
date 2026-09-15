import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

// eslint-config-next's core-web-vitals only turns on a handful of jsx-a11y rules (alt-text,
// aria-props, a couple of others) — this pulls in the plugin's full "recommended" set (label
// association, click-events-have-key-events, no-static-element-interactions, valid anchors, etc.)
// on top of that, since the narrow subset alone was passing clean while real gaps went unflagged.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Just the rules, not the whole flat config object — its own `plugins` key would collide with
  // the jsx-a11y plugin nextVitals already registers under the same name.
  { rules: jsxA11y.flatConfigs.recommended.rules },
  {
    rules: {
      // Every current use of autoFocus in this console is on a field inside a modal the operator
      // just opened by clicking something (Suspend, Ban, a destructive confirm) — not a grab on
      // page load, which is what actually disorients a screen reader user. Real page-load autofocus
      // would still be worth catching, so this stays a warning rather than off outright.
      'jsx-a11y/no-autofocus': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
