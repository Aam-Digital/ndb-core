import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
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

const Template: Story<ConfigImportComponent> = (
  args: ConfigImportComponent
) => ({
  component: ConfigImportComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
