import { moduleMetadata } from "@storybook/angular";
import { LanguageSelectorModule } from "./language-selector.module";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { LanguageSelectComponent } from "./language-select.component";

export default {
  title: "UI/LanguageSelect",
  decorators: [
    moduleMetadata({
      imports: [LanguageSelectorModule],
    }),
  ],
} as Meta;

const Template: Story<LanguageSelectComponent> = (args) => ({
  component: LanguageSelectComponent,
  props: args,
});

export const Primary = Template.bind({});
