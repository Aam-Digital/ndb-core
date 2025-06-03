import * as path from "node:path";

// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

export default function (config) {
  config.set({
    basePath: "",
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
    preprocessors: {},
    mime: {
      "text/x-typescript": ["ts", "tsx"],
    },
    coverageReporter: {
      dir: path.join(import.meta.dirname, "..", "coverage"),
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
    browsers: ["Chrome"],
    singleRun: false,
    retryLimit: 10,
  });
}
