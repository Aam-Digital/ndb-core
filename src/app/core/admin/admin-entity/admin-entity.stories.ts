import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AdminEntityComponent } from "./admin-entity.component";
import { FileModule } from "../../../features/file/file.module";
import { AdminModule } from "../admin.module";

export default {
  title: "Core/Admin/Entity",
  component: AdminEntityComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      imports: [AdminModule, FileModule],
    }),
  ],
} as Meta;

const Template: StoryFn<AdminEntityComponent> = (args) => ({
  component: AdminEntityComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entityType: "RecurringActivity",
};
