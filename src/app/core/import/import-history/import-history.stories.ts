import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportHistoryComponent } from "./import-history.component";
import { User } from "../../user/user";
import { IMPORT_SAMPLE_PREVIOUS_IMPORTS } from "../import/import-sample-raw-data";
import { importProvidersFrom } from "@angular/core";
import { TEST_USER } from "../../../utils/mock-local-session";

export default {
  title: "Features/Import/Import History",
  component: ImportHistoryComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            ...IMPORT_SAMPLE_PREVIOUS_IMPORTS,
            Object.assign(new User(TEST_USER), { name: TEST_USER }),
          ]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ImportHistoryComponent> = (
  args: ImportHistoryComponent,
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};
