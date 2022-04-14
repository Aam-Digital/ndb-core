/**
 * This file patches mjs modules for @casl to simple js files.
 * mjs modules do not work well with webpack 4.
 *
 * see https://github.com/stalniy/casl/issues/427#issuecomment-757539486
 * Note: the first suggestion with webpack config only works in dev mode, not with --prod
 *
 * This file does what the last solution with shx does,
 * but without an extra shx library and without adding a lot of script lines to package.json
 *
 */

// TODO remove this once webpack 5 is used

console.log(`
\n============================================================
Patching @casl libs to work with webpack 4
see https://github.com/stalniy/casl/issues/427#issuecomment-757539486
`);

const fs = require("fs");
const libsToPatch = [
  "@casl/ability",
  "@ucast/mongo2js",
  "@ucast/mongo",
  "@ucast/js",
];
for (let lib of libsToPatch) {
  console.log(`Patching mjs for ${lib}:`);
  const mjsIndexPath = `./node_modules/${lib}/dist/es6m/index.mjs`;
  const jsIndexPath = `./node_modules/${lib}/dist/es6m/index.js`;
  const packageJsonPath = `./node_modules/${lib}/package.json`;

  // copy index.mjs to index.js
  console.log(`  - copy index.mjs to index.js`);
  fs.copyFileSync(mjsIndexPath, jsIndexPath);

  // replace index.mjs with index.js in the libs package.json
  console.log(`  - replace index.mjs with index.js in package.json`);
  let contents = fs.readFileSync(packageJsonPath, "utf8");
  contents = contents.replace(/index\.mjs/g, "index.js");
  fs.writeFileSync(packageJsonPath, contents, { encoding: "utf8" });
}

console.log("============================================================\n");
