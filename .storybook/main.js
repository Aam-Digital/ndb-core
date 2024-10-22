module.exports = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-essentials"],

  framework: {
    name: "@storybook/angular",
    options: {
      builder: {
        lazyCompilation: true,
        fsCache: true,
      },
    },
  },

  docs: {}
};
