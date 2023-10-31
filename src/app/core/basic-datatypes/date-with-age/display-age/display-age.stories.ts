import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayAgeComponent } from "./display-age.component";
import { importProvidersFrom } from "@angular/core";
import { DateWithAge } from "../dateWithAge";

export default {
  title: "Core/Entities/Properties/date/DisplayAge",
  component: DisplayAgeComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayAgeComponent> = (args: DisplayAgeComponent) => ({
  props: args,
});

// currently Storybook can't handle classes extending Date - so this doesn't work: https://github.com/storybookjs/storybook/issues/14618
const date = new DateWithAge("2001-12-25");
(date as any)["age"] = "12";

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
