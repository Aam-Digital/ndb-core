import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayLongTextComponent } from "./display-long-text.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/string/DisplayLongText",
  component: DisplayLongTextComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayLongTextComponent> = (
  args: DisplayLongTextComponent,
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  value: `Lorem ipsum dolor sit amet,

  consectetur adipiscing elit. Nullam nec
  purus nec nunc ultricies ultricies.
  `,
};
