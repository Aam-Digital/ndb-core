const fs = require("fs");
const parseXliffToJson = require("../src/app/utils/parse-xliff-to-js");

const localeFolder = "src/assets/locale";

// get all locales
const xliffFiles = fs
  .readdirSync(localeFolder)
  .map((fileName) => fileName.match(/messages\.([a-zA-Z\-]+)\.xlf/))
  .filter((fn) => fn != null);

xliffFiles.forEach(async ([fileName, locale]) => {
  // read xliff content and transform to JSON
  const xliffContent = fs.readFileSync(`${localeFolder}/${fileName}`, "utf8");
  const jsonContent = await parseXliffToJson(xliffContent);

  fs.writeFileSync(
    `${localeFolder}/messages.${locale}.json`,
    JSON.stringify(jsonContent)
  );
});
