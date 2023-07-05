import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportHistoryComponent } from "./import-history.component";
import { MatCardModule } from "@angular/material/card";

export default {
  title: "Features/Import/Import History",
  component: ImportHistoryComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, FontAwesomeModule, MatCardModule],
      declarations: [ImportHistoryComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportHistoryComponent> = (
  args: ImportHistoryComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};
