import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";

export default {
  title: "Features/Import/2b Select Additional Actions",
  component: ImportAdditionalActionsComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, FontAwesomeModule],
      declarations: [ImportAdditionalActionsComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportAdditionalActionsComponent> = (
  args: ImportAdditionalActionsComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};
