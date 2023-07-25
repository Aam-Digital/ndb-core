import "@angular/localize/init";
import * as buffer from "buffer";
import * as MockDate from "mockdate";
import { Preview } from "@storybook/angular";
import { environment } from "../src/environments/environment";
import { SessionType } from "../src/app/core/session/session-type";

// fixing a mocked "TODAY" to have persistent stories for visual regression testing
MockDate.set(new Date("2023-06-09"));
// polyfill buffer here as well
window.Buffer = buffer.Buffer;
environment.production = false;
environment.session_type = SessionType.mock;
environment.demo_mode = false;

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
};
