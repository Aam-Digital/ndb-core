/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */
import * as path from "node:path";

// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html
// This file karma configuration is used by the pipeline. It uses the chrome headless browser in no-sandbox mode

export default function (config) {
  config.set({
    basePath: "..",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      "karma-jasmine",
      "karma-chrome-launcher",
      "karma-jasmine-html-reporter",
      "karma-coverage",
      "@angular-devkit/build-angular/plugins/karma",
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        random: true,
      },
    },
    mime: {
      "text/x-typescript": ["ts", "tsx"],
    },
    coverageReporter: {
      dir: path.join(import.meta.dirname, "..", "coverage"),
      reporters: [{ type: "lcovonly", subdir: "." }],
    },
    angularCli: {
      environment: "dev",
    },
    reporters:
      config.angularCli && config.angularCli.codeCoverage
        ? ["progress", "coverage-istanbul"]
        : ["progress", "kjhtml"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    customLaunchers: {
      ChromeCustom: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox", "--disable-gpu"],
      },
    },
    browsers: ["ChromeCustom"],
    singleRun: true,
  });
}
