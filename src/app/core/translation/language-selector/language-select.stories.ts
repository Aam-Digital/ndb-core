import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { LanguageSelectComponent } from "./language-select.component";
import { TranslationModule } from "../translation.module";
import { RouterTestingModule } from "@angular/router/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

export default {
  title: "Core/LanguageSelect",
  decorators: [
    moduleMetadata({
      imports: [
        TranslationModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
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
