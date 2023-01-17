import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { EnumDropdownComponent } from "./enum-dropdown.component";
import { FormControl } from "@angular/forms";
import { centersUnique } from "../../../child-dev-project/children/demo-data-generators/fixtures/centers";

export default {
  title: "Core/EntityComponents/Entity Property Fields/Enum Dropdown",
  component: EnumDropdownComponent,
  decorators: [
    moduleMetadata({
      imports: [EnumDropdownComponent, StorybookBaseModule],
      providers: [],
    }),
  ],
  parameters: {
    controls: {
      //exclude: ["form"],
    },
  },
} as Meta;

const Template: Story<EnumDropdownComponent> = (
  args: EnumDropdownComponent
) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  form: new FormControl(""),
  label: "test field",
  enumId: "center",
};

const disabledControl = new FormControl(centersUnique[0]);
disabledControl.disable();
export const Disabled = Template.bind({});
Disabled.args = {
  form: disabledControl,
  label: "test field",
  enumId: "center",
};

export const Multi = Template.bind({});
Multi.args = {
  form: new FormControl([]),
  label: "test field",
  enumId: "center",
  multi: true,
};
