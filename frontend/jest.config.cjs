/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "<rootDir>/jest.environment.cjs",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  transform: {
    // SWC (not ts-jest): fast, and independent of the TypeScript version (TS 7).
    "^.+\\.(ts|tsx|js|jsx|mjs)$": "<rootDir>/jest.transform.cjs",
  },
  // react-router and its dependencies ship ES modules only — let SWC compile them too.
  transformIgnorePatterns: ["/node_modules/(?!(react-router|@remix-run|cookie-es)/)"],
  moduleNameMapper: {
    "^@/lib/env$": "<rootDir>/src/test/env.ts",
    "\\.css$": "<rootDir>/src/test/style-stub.cjs",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/components/ui/**", // generated shadcn/ui primitives
    "!src/test/**",
    "!src/main.tsx",
    "!src/**/*.d.ts",
    // Reads Vite's import.meta, which Jest can't run; tests use src/test/env.ts instead (see moduleNameMapper).
    "!src/lib/env.ts",
    // Third-party React Bits component; the app only uses a few of its options.
    // Those uses are tested in SplitText.test.tsx; the rest of the library isn't measured.
    "!src/components/SplitText.tsx",
  ],
}
