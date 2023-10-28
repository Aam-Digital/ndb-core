import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { ConfigEntityComponent } from "./config-entity.component";
import { ConfigUiModule } from "../config-ui.module";
import { FileModule } from "../../../features/file/file.module";

export default {
  title: "Core/Admin UI/Config Entity",
  component: ConfigEntityComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      imports: [ConfigUiModule, FileModule],
    }),
  ],
} as Meta;

const Template: StoryFn<ConfigEntityComponent> = (args) => ({
  component: ConfigEntityComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entityType: "RecurringActivity",
};
