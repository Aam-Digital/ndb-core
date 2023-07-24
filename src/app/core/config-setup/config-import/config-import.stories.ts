import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { ConfigImportComponent } from "./config-import.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Core/Admin/Config Import",
  component: ConfigImportComponent,
  decorators: [
    moduleMetadata({
      imports: [ConfigImportComponent, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: StoryFn<ConfigImportComponent> = (
  args: ConfigImportComponent,
) => ({
  component: ConfigImportComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
