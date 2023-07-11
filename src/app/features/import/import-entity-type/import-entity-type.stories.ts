import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportEntityTypeComponent } from "./import-entity-type.component";
import { MatSelectModule } from "@angular/material/select";
import { HelpButtonComponent } from "../../../core/common-components/help-button/help-button.component";

export default {
  title: "Features/Import/2 Select Entity Type",
  component: ImportEntityTypeComponent,
  decorators: [
    moduleMetadata({
      imports: [
        StorybookBaseModule,
        FontAwesomeModule,
        MatSelectModule,
        HelpButtonComponent,
      ],
      declarations: [ImportEntityTypeComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportEntityTypeComponent> = (
  args: ImportEntityTypeComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};
