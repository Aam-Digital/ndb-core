import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { ChildBlockTooltipComponent } from "./child-block-tooltip.component";
import { importProvidersFrom } from "@angular/core";
import { createEntityOfType } from "../../../../core/demo-data/create-entity-of-type";

export default {
  title: "Features/Participant/ChildBlockTooltip",
  component: ChildBlockTooltipComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const demoChild = createEntityOfType("Child", "1");
demoChild.name = "John Doe";
demoChild.projectNumber = "99";
demoChild.phone = "+49 199 1234567";
demoChild.schoolClass = "5";
demoChild.schoolId = ["0"];

const Template: StoryFn<ChildBlockTooltipComponent> = (
  args: ChildBlockTooltipComponent,
) => ({
  component: ChildBlockTooltipComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: demoChild,
};
