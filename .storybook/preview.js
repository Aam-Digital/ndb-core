import "@angular/localize/init";
// polyfill buffer here as well
import * as buffer from "buffer";
import * as MockDate from "mockdate";

// fixing a mocked "TODAY" to have persistent stories for visual regression testing
MockDate.set(new Date("2023-06-09"));

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  options: {
    storySort: {
      order: ["Core", "Features", "*"],
      method: "alphabetical",
    },
  },
  // layout: 'fullscreen', // remove paddings of storybook container
};

window.Buffer = buffer.Buffer;
