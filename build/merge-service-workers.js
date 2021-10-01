const fs = require("fs");

const distFolder = "dist";

function getNgswConfig(locale) {
  const swConfig = fs.readFileSync(`${distFolder}/${locale}/ngsw.json`);
  return JSON.parse(swConfig);
}

const locales = fs
  .readdirSync(distFolder)
  .filter((locale) => fs.lstatSync(`${distFolder}/${locale}`).isDirectory());

const firstLocale = locales.pop();
const combined = getNgswConfig(firstLocale);
locales.forEach((locale) => {
  const additional = getNgswConfig(locale);

  // combine asset groups
  additional.assetGroups.forEach((group) => {
    combined.assetGroups
      .find((g) => g.name === group.name)
      .urls.push(...group.urls);
  });

  // combine hash tables
  Object.assign(combined.hashTable, additional.hashTable);
  fs.unlinkSync(`${distFolder}/${locale}/ngsw.json`);
  fs.unlinkSync(`${distFolder}/${locale}/ngsw-worker.json`);
});

combined.index = "/index.html";

fs.writeFileSync(`${distFolder}/ngsw.json`, JSON.stringify(combined));
fs.unlinkSync(`${distFolder}/${firstLocale}/ngsw.json`);
fs.renameSync(
  `${distFolder}/${firstLocale}/ngsw-worker.json`,
  `${distFolder}/ngsw-worker.json`
);
