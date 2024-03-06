import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AdminEntityDetailsComponent } from "./admin-entity-details.component";
import { FileModule } from "../../../../features/file/file.module";
import { AdminModule } from "../../admin.module";

export default {
  title: "Core/Admin/Entity Details",
  component: AdminEntityDetailsComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      imports: [AdminModule, FileModule],
    }),
  ],
} as Meta;

const Template: StoryFn<AdminEntityDetailsComponent> = (args) => ({
  component: AdminEntityDetailsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entityType: "RecurringActivity",
};
