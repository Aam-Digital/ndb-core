import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { LanguageSelectComponent } from "./language-select.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Core/> App Layout/Language Select",
  decorators: [
    moduleMetadata({
      imports: [LanguageSelectComponent, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: StoryFn<LanguageSelectComponent> = (args) => ({
  component: LanguageSelectComponent,
  props: args,
});

export const Primary = Template.bind({
  availableLocales: [
    { locale: "de", regionCode: "de" },
    { locale: "en-US", regionCode: "us" },
  ],
});
