import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayPercentageComponent } from "./display-percentage.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/number/DisplayPercentage",
  component: DisplayPercentageComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      imports: [DisplayPercentageComponent],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayPercentageComponent> = (
  args: DisplayPercentageComponent,
) => ({
  props: args,
});

export const Low = Template.bind({});
Low.args = {
  value: 5,
};
export const Medium = Template.bind({});
Medium.args = {
  value: 49,
};
export const High = Template.bind({});
High.args = {
  value: 100,
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
};
