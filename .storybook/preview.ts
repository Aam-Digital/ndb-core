import "@angular/localize/init";
// polyfill buffer here as well
import * as buffer from "buffer";
import * as MockDate from "mockdate";
import { Preview } from "@storybook/angular";

// fixing a mocked "TODAY" to have persistent stories for visual regression testing
MockDate.set(new Date("2023-06-09"));

export const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    options: {
      storySort: {
        order: ["Core", "Features", "*"],
        method: "alphabetical",
      },
    },
  },
  decorators: [],
};

window.Buffer = buffer.Buffer;
