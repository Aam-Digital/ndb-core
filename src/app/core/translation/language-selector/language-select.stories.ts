import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { LanguageSelectComponent } from "./language-select.component";
import { TranslationModule } from "../translation.module";

export default {
  title: "UI/LanguageSelect",
  decorators: [
    moduleMetadata({
      imports: [TranslationModule],
    }),
  ],
} as Meta;

const Template: Story<LanguageSelectComponent> = (args) => ({
  component: LanguageSelectComponent,
  props: args,
});

export const Primary = Template.bind({});
