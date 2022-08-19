import { Story, Meta } from "@storybook/angular/types-6-0";
import { ChildBlockComponent } from "./child-block.component";
import { Child } from "../model/child";
import { moduleMetadata } from "@storybook/angular";
import { FlexLayoutModule } from "@angular/flex-layout";
import { CommonModule } from "@angular/common";
import { addDefaultChildPhoto } from "../../../../../.storybook/utils/addDefaultChildPhoto";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Child Dev Project/ChildBlock",
  component: ChildBlockComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FlexLayoutModule, StorybookBaseModule],
    }),
  ],
} as Meta;

const demoChild = new Child("1");
demoChild.name = "John Doe";
addDefaultChildPhoto(demoChild);
demoChild.projectNumber = "99";
demoChild.phone = "+49 199 1234567";
demoChild.schoolClass = "5";

const Template: Story<ChildBlockComponent> = (args: ChildBlockComponent) => ({
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
