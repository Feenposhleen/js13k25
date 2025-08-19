// rollup.config.js
const fs = require("fs");
const path = require("path");
const typescript = require("@rollup/plugin-typescript");
const terser = require("@rollup/plugin-terser");
const serve = require("rollup-plugin-serve");
const livereload = require("rollup-plugin-livereload");
const glslify = require("rollup-plugin-glslify");

/** Very small CSS minifier (good enough for jam CSS) */
function minifyCss(css) {
  return String(css || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")  // strip comments
    .replace(/\s+/g, " ")              // collapse whitespace
    .replace(/\s*([{}:;,>~+])\s*/g, "$1") // trim around symbols
    .replace(/;}/g, "}");              // drop last semicolons
}

function inlineTemplate({
  templatePath = "scaffold.template",
  cssPath = "src/style.css",
  outFile = "index.html",
  jsToken = "__js__",
  cssToken = "__css__",
} = {}) {
  return {
    name: "inline-template",
    buildStart() {
      if (cssPath) this.addWatchFile(cssPath); // watch CSS in dev
      this.addWatchFile(templatePath);
    },
    generateBundle(_opts, bundle) {
      const entry = Object.values(bundle).find(f => f.type === "chunk" && f.isEntry);
      const js = entry ? entry.code : "";

      const css = fs.readFileSync(path.resolve(cssPath), "utf8");
      const template = fs.readFileSync(templatePath, "utf8");

      const html = template
        .replace(jsToken, js)
        .replace(cssToken, minifyCss(css));

      this.emitFile({ type: "asset", fileName: outFile, source: html });
    }
  };
}

module.exports = (cli) => {
  const dev = !!cli.watch; // true when running `rollup -w`

  return {
    input: "src/game/main.ts",
    output: {
      file: "dist/game.js",
      format: "iife",
      sourcemap: dev
    },
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    plugins: [
      // TypeScript → modern JS (no helpers if you target ES2020+ in tsconfig)
      typescript({ tsconfig: "./tsconfig.json" }),

      glslify({
        include: [
          '**/*.vs',
          '**/*.fs',
          '**/*.vert',
          '**/*.frag',
          '**/*.glsl'
        ],
        exclude: 'node_modules/**',
      }),

      // Production-only minification (keep builds fast in dev)
      !dev &&
      terser({
        ecma: 2020,
        toplevel: true,
        compress: {
          passes: 3,
          unsafe: true,
          module: true,
          hoist_funs: true,
          hoist_vars: true,
          booleans_as_integers: true
        },
        mangle: {
          toplevel: true,
          properties: {
            // Only mangle your own "private" props (e.g., this._x)
            regex: /^_/
          }
        },
        format: { comments: false }
      }),

      // Inject into scaffold.template → dist/index.html
      inlineTemplate(),

      // Dev server + live reload only when watching
      dev &&
      serve({
        // Serve project root (for index.html) and dist/ (for bundle)
        contentBase: [".", "dist"],
        port: 5173,
        headers: { "Cache-Control": "no-store" },
        open: false
      }),
      dev && livereload({ watch: "dist", verbose: false })
    ].filter(Boolean),
    watch: {
      clearScreen: false
    }
  };
};