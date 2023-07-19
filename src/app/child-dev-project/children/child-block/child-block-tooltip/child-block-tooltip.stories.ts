import { Meta, Story } from "@storybook/angular/types-6-0";
import { Child } from "../../model/child";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { ChildBlockTooltipComponent } from "./child-block-tooltip.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

export default {
  title: "Features/Participant/ChildBlockTooltip",
  component: ChildBlockTooltipComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, StorybookBaseModule, FontAwesomeModule],
    }),
  ],
} as Meta;

const demoChild = new Child("1");
demoChild.name = "John Doe";
demoChild.projectNumber = "99";
demoChild.phone = "+49 199 1234567";
demoChild.schoolClass = "5";
demoChild.schoolId = ["0"];

const Template: Story<ChildBlockTooltipComponent> = (
  args: ChildBlockTooltipComponent
) => ({
  component: ChildBlockTooltipComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: demoChild,
};
