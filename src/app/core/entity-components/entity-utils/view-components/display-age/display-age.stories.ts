import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayAgeComponent } from "./display-age.component";
import { DateWithAge } from "../../../../../child-dev-project/children/model/dateWithAge";

export default {
  title: "Core/Entities/Display Properties/DisplayAge",
  component: DisplayAgeComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayAgeComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayAgeComponent> = (args: DisplayAgeComponent) => ({
  props: args,
});

const date = new DateWithAge("2001-12-25");
// currently Storybook can't handle classes extending Date - so this doesn't work: https://github.com/storybookjs/storybook/issues/14618

export const Basic = Template.bind({});
Basic.args = {
  config: "dateOfBirth",
  entity: { dateOfBirth: date },
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  config: "dateOfBirth",
  entity: {},
};
