import { ChildBlockComponent } from "./child-block.component";
import { Child } from "../model/child";
import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Participant/ChildBlock",
  component: ChildBlockComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const demoChild = new Child("1");
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

const demoInactiveChild = Child.create("John Doe");
demoInactiveChild.projectNumber = "42";
demoInactiveChild.status = "Dropout";

export const Inactive = Template.bind({});
Inactive.args = {
  entity: demoInactiveChild,
};
