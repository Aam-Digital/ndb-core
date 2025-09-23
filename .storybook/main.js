export default {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-docs"],

  framework: {
    name: "@storybook/angular",
    options: {
      builder: {
        lazyCompilation: true,
        fsCache: true,
      },
    },
  },

  docs: {},

  webpackFinal: async (config) => {
    // this was causing some issue with Storybook's webpack setup so need to test without it
    config.plugins = config.plugins.filter((plugin) => {
      return !plugin.constructor.name.includes("SourceMapDevTool");
    });
    return config;
  },
};
