import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportEntityTypeComponent } from "./import-entity-type.component";

export default {
  title: "Features/Import/2 Select Entity Type",
  component: ImportEntityTypeComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, ImportEntityTypeComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportEntityTypeComponent> = (
  args: ImportEntityTypeComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};
