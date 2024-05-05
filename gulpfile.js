const { series, src, watch, dest } = require("gulp");
const gls = require("gulp-live-server");
const dotenv = require("rollup-plugin-dotenv").default;
const rollup = require("rollup");
const fs = require("fs");
const path = require("path");

function jsIndex() {
  return rollup
    .rollup({
      input: "./src/js/index.js",
      plugins: [dotenv()],
    })
    .then((bundle) => {
      return bundle.write({
        file: "./dist/index.js",
        format: "iife",
      });
    });
}

function jsOptions() {
  return rollup
    .rollup({
      input: "./src/js/options.js",
      plugins: [dotenv()],
    })
    .then((bundle) => {
      return bundle.write({
        file: "./dist/options.js",
        format: "cjs",
      });
    });
}

function html() {
  return src("./src/html/*.html").pipe(dest("dist"));
}

function static() {
  return src("./src/assets/**.*").pipe(dest("dist"));
}

function manifest() {
  const pkg = require("./package.json");
  const manifest = require("./src/manifest.json");
  manifest.name = pkg.name;
  manifest.description = pkg.description;
  manifest.version = pkg.version;
  fs.writeFileSync(
    path.resolve(__dirname, "dist/manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  return Promise.resolve();
}

if (process.env.NODE_ENV === "production") {
  exports.build = series(jsOptions, jsIndex, html, static, manifest);
} else {
  watch("./src/**/*", series(jsOptions, jsIndex, html));
  exports.dev = series(jsOptions, jsIndex, html, static, manifest);
  const server = gls.static("dist", 3000);
  server.start();
}
