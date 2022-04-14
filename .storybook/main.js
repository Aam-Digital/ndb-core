module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    // See {@link https://github.com/storybookjs/storybook/issues/17004#issuecomment-993210351}
    { name: "@storybook/addon-essentials", options: { docs: false } },
  ],
};
