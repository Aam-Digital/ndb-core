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

// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        random: true,
      },
    },
    preprocessors: {},
    mime: {
      "text/x-typescript": ["ts", "tsx"],
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "coverage"),
      reporters: [{ type: "html" }, { type: "lcovonly" }],
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
    autoWatch: true,
    customLaunchers: {
      ChromeCustom: {
        base: "Chrome",
        flags: ["--no-first-run"],
      },
    },
    browsers: ["ChromeCustom"],
    singleRun: false,
    retryLimit: 10,
  });
};
