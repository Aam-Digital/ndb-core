import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ImportModule } from "../import.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportComponent } from "./import.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

export default {
  title: "Features/Import",
  component: ImportComponent,
  decorators: [
    moduleMetadata({
      imports: [ImportModule, StorybookBaseModule, FontAwesomeModule],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportComponent> = (args: ImportComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
