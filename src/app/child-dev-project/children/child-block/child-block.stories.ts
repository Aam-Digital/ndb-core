import { ChildBlockComponent } from "./child-block.component";
import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";

export default {
  title: "Features/Participant/ChildBlock",
  component: ChildBlockComponent,
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

const Template: StoryFn<ChildBlockComponent> = (args: ChildBlockComponent) => ({
  component: ChildBlockComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: demoChild,
};

const demoInactiveChild = createEntityOfType("Child");
demoInactiveChild.name = "John Doe";
demoInactiveChild.projectNumber = "42";
demoInactiveChild.status = "Dropout";

export const Inactive = Template.bind({});
Inactive.args = {
  entity: demoInactiveChild,
};
