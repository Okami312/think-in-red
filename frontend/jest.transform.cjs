/**
 * @swc/jest with one extra step: some ESM-only dependencies (react-router) use
 * `import.meta` (e.g. `import.meta.hot` for Vite HMR), which can't exist in
 * CommonJS. Rewrite it to an empty object before SWC compiles the file.
 */
const swcJest = require("@swc/jest")

const swc = swcJest.createTransformer({
  jsc: {
    parser: { syntax: "typescript", tsx: true },
    transform: { react: { runtime: "automatic" } },
    target: "es2022",
  },
  module: { type: "commonjs" },
})

const stripImportMeta = (src) =>
  src.includes("import.meta") ? src.replace(/import\.meta\.hot/g, "undefined").replace(/import\.meta/g, "({})") : src

module.exports = {
  process: (src, filename, options) => swc.process(stripImportMeta(src), filename, options),
  getCacheKey: (src, filename, options) => swc.getCacheKey(stripImportMeta(src), filename, options),
}
