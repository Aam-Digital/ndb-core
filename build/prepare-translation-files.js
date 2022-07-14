const fs = require("fs");
const parseXliffToJson = require("../src/app/utils/parse-xliff-to-js");

const localeFolder = "dist/assets/locale";

// get all locales
const xliffFiles = fs
  .readdirSync(localeFolder)
  .filter((fileName) => fileName !== "messages.xlf");

xliffFiles.forEach(async (fileName) => {
  // read xliff content and transform to JSON
  const xliffContent = fs.readFileSync(`${localeFolder}/${fileName}`, "utf8");
  const jsonContent = await parseXliffToJson(xliffContent);

  // get name of locale e.g. "de" and create json file
  const locale = fileName.match(/\.(.+)\./)[1];
  fs.writeFileSync(
    `${localeFolder}/messages.${locale}.json`,
    JSON.stringify(jsonContent)
  );
});
