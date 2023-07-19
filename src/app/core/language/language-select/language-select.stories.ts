import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
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

const Template: Story<LanguageSelectComponent> = (args) => ({
  component: LanguageSelectComponent,
  props: args,
});

export const Primary = Template.bind({
  availableLocales: [
    { locale: "de", regionCode: "de" },
    { locale: "en-US", regionCode: "us" },
  ],
});
