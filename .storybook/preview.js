import { setCompodocJson } from "@storybook/addon-docs/angular";
import "@angular/localize/init";
// polyfill buffer here as well
import * as buffer from "buffer";

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
