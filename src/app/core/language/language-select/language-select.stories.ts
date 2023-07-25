import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { LanguageSelectComponent } from "./language-select.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/> App Layout/Language Select",
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
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
