import "@angular/localize/init";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  // layout: 'fullscreen', // remove paddings of storybook container
};

// polyfill buffer here as well
import * as buffer from "buffer";

window.Buffer = buffer.Buffer;
